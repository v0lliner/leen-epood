/*
  # Add Omniva columns to orders table

  1. New Columns
    - `omniva_parcel_machine_id` (text) - ID of the selected Omniva parcel machine
    - `omniva_parcel_machine_name` (text) - Name of the selected Omniva parcel machine
    - `omniva_barcode` (text) - Tracking number for the Omniva shipment
    - `omniva_shipment_status` (text) - Status of the Omniva shipment

  2. Security
    - No changes to RLS policies
*/

-- Add Omniva-related columns to orders table
ALTER TABLE IF EXISTS orders
ADD COLUMN IF NOT EXISTS omniva_parcel_machine_id TEXT,
ADD COLUMN IF NOT EXISTS omniva_parcel_machine_name TEXT,
ADD COLUMN IF NOT EXISTS omniva_barcode TEXT,
ADD COLUMN IF NOT EXISTS omniva_shipment_status TEXT;

-- Create omniva_parcel_machines table to store parcel machine locations
CREATE TABLE IF NOT EXISTS omniva_parcel_machines (
  zip TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country CHAR(2) NOT NULL,
  county TEXT,
  city TEXT,
  district TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index on country for faster filtering
CREATE INDEX IF NOT EXISTS omniva_parcel_machines_country_idx ON omniva_parcel_machines (country);

-- Enable RLS on the new table
ALTER TABLE omniva_parcel_machines ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Enable public read access for omniva_parcel_machines"
  ON omniva_parcel_machines
  FOR SELECT
  TO public
  USING (true);

-- Create trigger to update updated_at on omniva_parcel_machines
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