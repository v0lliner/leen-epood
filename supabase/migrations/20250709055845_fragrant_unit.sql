/*
  # Fix Omniva Parcel Machines Migration

  1. New Tables
    - Ensures `omniva_parcel_machines` table exists
  2. Security
    - Adds RLS policy if not exists
    - Enables RLS on the table
  3. Changes
    - Adds Omniva columns to orders table if they don't exist
    - Creates index on country column for faster filtering
    - Adds trigger for updated_at timestamp
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

-- Add policy for public read access (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'omniva_parcel_machines' 
    AND policyname = 'Enable public read access for omniva_parcel_machines'
  ) THEN
    CREATE POLICY "Enable public read access for omniva_parcel_machines" 
      ON omniva_parcel_machines
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Add trigger for updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_omniva_parcel_machines_updated_at'
  ) THEN
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
  END IF;
END $$;

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
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'omniva_parcel_machines_country_idx'
  ) THEN
    CREATE INDEX omniva_parcel_machines_country_idx ON omniva_parcel_machines(country);
  END IF;
END $$;