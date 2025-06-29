/*
  # Create FAQ table for managing frequently asked questions

  1. New Tables
    - `faq_items`
      - `id` (uuid, primary key)
      - `question` (text, required)
      - `answer` (text, required)
      - `language` (text, required - et/en)
      - `display_order` (integer, for ordering)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `faq_items` table
    - Add policy for public read access to active items
    - Add policy for authenticated users to manage all items

  3. Indexes
    - Index on language and display_order for efficient queries
    - Index on is_active for filtering
*/

CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  language text NOT NULL DEFAULT 'et',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read active FAQ items"
  ON faq_items
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage FAQ items"
  ON faq_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS faq_items_language_display_order_idx 
  ON faq_items (language, display_order);

CREATE INDEX IF NOT EXISTS faq_items_is_active_idx 
  ON faq_items (is_active);

CREATE INDEX IF NOT EXISTS faq_items_language_idx 
  ON faq_items (language);

-- Update trigger
CREATE OR REPLACE FUNCTION update_faq_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON faq_items
  FOR EACH ROW
  EXECUTE FUNCTION update_faq_items_updated_at();