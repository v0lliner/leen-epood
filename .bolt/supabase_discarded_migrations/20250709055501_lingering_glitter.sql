/*
  # Add Omniva parcel machines table and order columns

  1. New Tables
    - `omniva_parcel_machines`
      - `zip` (text, primary key)
      - `name` (text)
      - `country` (text)
      - `county` (text)
      - `city` (text)
      - `district` (text)
      - `updated_at` (timestamp with time zone)

  2. Changes to Existing Tables
    - Add Omniva-related columns to `orders` table:
      - `omniva_parcel_machine_id` (text)
      - `omniva_parcel_machine_name` (text)
      - `omniva_barcode` (text)
      - `omniva_shipment_status` (text)

  3. Security
    - Enable RLS on `omniva_parcel_machines` table
    - Add policy for public read access
*/

-- Create omniva_parcel_machines table
CREATE TABLE IF NOT EXISTS omniva_parcel_machines (
  zip text PRIMARY KEY,
  name text NOT NULL,
  country character(2) NOT NULL,
  county text,
  city text,
  district text,
  updated_at timestamptz DEFAULT now()
);

-- Add RLS to omniva_parcel_machines
ALTER TABLE omniva_parcel_machines ENABLE ROW LEVEL SECURITY;

-- Add policy for public read access
CREATE POLICY "Enable public read access for omniva_parcel_machines" 
  ON omniva_parcel_machines
  FOR SELECT
  TO public
  USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_omniva_parcel_machines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_omniva_parcel_machines_updated_at
BEFORE UPDATE ON omniva_parcel_machines
FOR EACH ROW
EXECUTE FUNCTION update_omniva_parcel_machines_updated_at();

-- Add Omniva columns to orders table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'omniva_parcel_machine_id') THEN
    ALTER TABLE orders ADD COLUMN omniva_parcel_machine_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'omniva_parcel_machine_name') THEN
    ALTER TABLE orders ADD COLUMN omniva_parcel_machine_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'omniva_barcode') THEN
    ALTER TABLE orders ADD COLUMN omniva_barcode text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'omniva_shipment_status') THEN
    ALTER TABLE orders ADD COLUMN omniva_shipment_status text;
  END IF;
END $$;

-- Create index on country for faster filtering
CREATE INDEX IF NOT EXISTS omniva_parcel_machines_country_idx ON omniva_parcel_machines(country);