/*
  # Remove Omniva columns from orders table

  1. Changes
    - Remove `omniva_parcel_machine_id` column from `orders` table
    - Remove `omniva_parcel_machine_name` column from `orders` table
    - Remove `omniva_barcode` column from `orders` table
    - Remove `omniva_shipment_status` column from `orders` table
*/

-- Remove Omniva-related columns from orders table
DO $$
BEGIN
  -- Remove omniva_parcel_machine_id column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'omniva_parcel_machine_id'
  ) THEN
    ALTER TABLE orders DROP COLUMN omniva_parcel_machine_id;
  END IF;

  -- Remove omniva_parcel_machine_name column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'omniva_parcel_machine_name'
  ) THEN
    ALTER TABLE orders DROP COLUMN omniva_parcel_machine_name;
  END IF;

  -- Remove omniva_barcode column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'omniva_barcode'
  ) THEN
    ALTER TABLE orders DROP COLUMN omniva_barcode;
  END IF;

  -- Remove omniva_shipment_status column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'omniva_shipment_status'
  ) THEN
    ALTER TABLE orders DROP COLUMN omniva_shipment_status;
  END IF;
END $$;

-- Drop omniva_parcel_machines table if it exists
DROP TABLE IF EXISTS omniva_parcel_machines;