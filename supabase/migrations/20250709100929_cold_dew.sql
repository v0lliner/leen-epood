/*
  # Create Omniva Shipping Settings Table

  1. New Tables
    - `omniva_shipping_settings`
      - `id` (uuid, primary key)
      - `price` (numeric, shipping price)
      - `currency` (text, currency code)
      - `active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `omniva_shipping_settings` table
    - Add policy for authenticated users to manage settings
    - Add policy for public users to view settings
*/

CREATE TABLE IF NOT EXISTS omniva_shipping_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price numeric(10,2) NOT NULL DEFAULT 3.99,
  currency text NOT NULL DEFAULT 'EUR',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default value
INSERT INTO omniva_shipping_settings (price, currency, active)
VALUES (3.99, 'EUR', true);

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

-- Create trigger to update updated_at column
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