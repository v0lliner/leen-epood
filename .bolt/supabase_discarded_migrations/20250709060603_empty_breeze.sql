/*
  # Add Omniva columns to orders table
  
  1. New Columns
    - `omniva_parcel_machine_id` (text) - Stores the ID of the selected Omniva parcel machine
    - `omniva_parcel_machine_name` (text) - Stores the name of the selected Omniva parcel machine
    - `omniva_barcode` (text) - Stores the tracking barcode from Omniva
  
  2. Changes
    - Adds columns to the orders table for Omniva integration
*/

-- Add Omniva columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS omniva_parcel_machine_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS omniva_parcel_machine_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS omniva_barcode text;

-- Create omniva_parcel_machines table
CREATE TABLE IF NOT EXISTS public.omniva_parcel_machines (
  zip TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country CHAR(2) NOT NULL,
  county TEXT,
  city TEXT,
  district TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index on country for faster filtering
CREATE INDEX IF NOT EXISTS omniva_parcel_machines_country_idx ON public.omniva_parcel_machines (country);

-- Enable RLS on the new table
ALTER TABLE public.omniva_parcel_machines ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public to read parcel machines
CREATE POLICY "Enable public read access for omniva_parcel_machines" 
  ON public.omniva_parcel_machines
  FOR SELECT 
  TO public 
  USING (true);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_omniva_parcel_machines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_omniva_parcel_machines_updated_at
BEFORE UPDATE ON public.omniva_parcel_machines
FOR EACH ROW
EXECUTE FUNCTION update_omniva_parcel_machines_updated_at();