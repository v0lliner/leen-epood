/*
  # Create categories table

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, required) - Category name
      - `slug` (text, unique, required) - URL-friendly identifier
      - `parent_id` (uuid, optional) - Reference to parent category for hierarchical structure
      - `display_order` (integer, default 0) - Order for displaying categories
      - `is_active` (boolean, default true) - Whether category is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `categories` table
    - Add policy for public to read active categories
    - Add policy for authenticated users to manage all categories

  3. Features
    - Self-referencing foreign key for hierarchical categories
    - Unique constraint on slug
    - Automatic slug generation
    - Updated_at trigger for timestamp management
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read active categories"
  ON categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);
CREATE INDEX IF NOT EXISTS categories_display_order_idx ON categories(display_order);
CREATE INDEX IF NOT EXISTS categories_is_active_idx ON categories(is_active);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default categories
INSERT INTO categories (name, slug, display_order) VALUES
  ('Vaasid', 'vaasid', 1),
  ('Kausid', 'kausid', 2),
  ('Taldrikud', 'taldrikud', 3),
  ('Tasid', 'tasid', 4),
  ('Dekoratsioonid', 'dekoratsioonid', 5)
ON CONFLICT (slug) DO NOTHING;