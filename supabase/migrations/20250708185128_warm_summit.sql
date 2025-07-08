/*
  # Create Omniva Parcel Machines Table

  1. New Tables
    - `omniva_parcel_machines`
      - `zip` (text, primary key) - Unique location ID (Omniva ZIP code)
      - `name` (text) - Location name
      - `country` (char(2)) - Country code (EE, LV, LT, FI)
      - `county` (text) - County or region (A1_NAME)
      - `city` (text) - City or municipality (A2_NAME)
      - `district` (text) - Village/district or area name (A3_NAME)
      - `coordinates` (jsonb) - Latitude and longitude coordinates
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Update timestamp
  
  2. Security
    - Enable RLS on `omniva_parcel_machines` table
    - Add policy for public read access
*/

-- Create Omniva Parcel Machines table
CREATE TABLE IF NOT EXISTS omniva_parcel_machines (
  zip TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country CHAR(2) NOT NULL,
  county TEXT,
  city TEXT,
  district TEXT,
  coordinates JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on country for faster filtering
CREATE INDEX IF NOT EXISTS omniva_parcel_machines_country_idx ON omniva_parcel_machines(country);

-- Enable Row Level Security
ALTER TABLE omniva_parcel_machines ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Enable public read access for omniva_parcel_machines"
  ON omniva_parcel_machines
  FOR SELECT
  TO public
  USING (true);

-- Create trigger to update updated_at on update
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