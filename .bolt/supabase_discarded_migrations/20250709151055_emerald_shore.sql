/*
  # Create Omniva shipping settings table

  1. New Tables
    - `omniva_shipping_settings`
      - `id` (uuid, primary key)
      - `price` (numeric, default 3.99)
      - `currency` (text, default 'EUR')
      - `active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `omniva_shipping_settings` table
    - Add policy for authenticated users to manage shipping settings
    - Add policy for public users to view active shipping settings
*/

-- Create omniva_shipping_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS omniva_shipping_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price numeric(10,2) NOT NULL DEFAULT 3.99,
  currency text NOT NULL DEFAULT 'EUR',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE omniva_shipping_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can manage shipping settings"
  ON omniva_shipping_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public users can view shipping settings"
  ON omniva_shipping_settings
  FOR SELECT
  TO public
  USING (active = true);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_omniva_shipping_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_omniva_shipping_settings_updated_at
BEFORE UPDATE ON omniva_shipping_settings
FOR EACH ROW
EXECUTE FUNCTION update_omniva_shipping_settings_updated_at();

-- Insert default settings if table is empty
INSERT INTO omniva_shipping_settings (price, currency, active)
SELECT 3.99, 'EUR', true
WHERE NOT EXISTS (SELECT 1 FROM omniva_shipping_settings);