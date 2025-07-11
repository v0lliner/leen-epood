/*
  # Create omniva_shipping_settings table

  1. New Tables
    - `omniva_shipping_settings`
      - `id` (uuid, primary key)
      - `price` (numeric, default 3.50)
      - `active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `omniva_shipping_settings` table
    - Add policy for authenticated users to manage settings
    - Add policy for public users to read active settings
*/

-- Create omniva_shipping_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS omniva_shipping_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price numeric(10,2) NOT NULL DEFAULT 3.50,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE omniva_shipping_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'omniva_shipping_settings' 
    AND policyname = 'Authenticated users can manage omniva_shipping_settings'
  ) THEN
    CREATE POLICY "Authenticated users can manage omniva_shipping_settings"
      ON omniva_shipping_settings
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'omniva_shipping_settings' 
    AND policyname = 'Enable public read access for omniva_shipping_settings'
  ) THEN
    CREATE POLICY "Enable public read access for omniva_shipping_settings"
      ON omniva_shipping_settings
      FOR SELECT
      TO public
      USING (active = true);
  END IF;
END
$$;

-- Create update function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_omniva_shipping_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_omniva_shipping_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_omniva_shipping_settings_updated_at
    BEFORE UPDATE ON omniva_shipping_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_omniva_shipping_settings_updated_at();
  END IF;
END
$$;

-- Insert default settings if table is empty
INSERT INTO omniva_shipping_settings (price, active)
SELECT 3.50, true
WHERE NOT EXISTS (SELECT 1 FROM omniva_shipping_settings);