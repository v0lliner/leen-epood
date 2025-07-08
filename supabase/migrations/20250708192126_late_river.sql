/*
  # Remove Omniva-related columns and tables

  1. Changes
    - Remove Omniva-related columns from orders table
    - Drop omniva_parcel_machines table if it exists
  
  2. Security
    - No security changes
*/

-- Remove Omniva-related columns from orders table
ALTER TABLE IF EXISTS orders 
  DROP COLUMN IF EXISTS omniva_parcel_machine_id,
  DROP COLUMN IF EXISTS omniva_parcel_machine_name,
  DROP COLUMN IF EXISTS omniva_barcode,
  DROP COLUMN IF EXISTS omniva_shipment_status;

-- Drop omniva_parcel_machines table if it exists
DROP TABLE IF EXISTS omniva_parcel_machines;