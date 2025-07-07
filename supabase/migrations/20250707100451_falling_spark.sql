/*
  # Add Omniva Parcel Machine Fields to Orders Table

  1. New Fields
    - `omniva_parcel_machine_id` (text, nullable) - Stores the unique ID of the selected parcel machine
    - `omniva_parcel_machine_name` (text, nullable) - Stores the human-readable name of the selected parcel machine
    - `omniva_barcode` (text, nullable) - Stores the barcode/tracking number for Omniva shipment
    - `omniva_shipment_status` (text, nullable) - Stores the status of Omniva shipment (e.g., REGISTERED, FAILED)
  
  2. Comments
    - Added descriptive comments to each field for better documentation
*/

-- Add Omniva-specific fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS omniva_parcel_machine_id TEXT NULL COMMENT 'ID of the selected Omniva parcel machine',
ADD COLUMN IF NOT EXISTS omniva_parcel_machine_name TEXT NULL COMMENT 'Name of the selected Omniva parcel machine',
ADD COLUMN IF NOT EXISTS omniva_barcode TEXT NULL COMMENT 'Barcode/tracking number for Omniva shipment',
ADD COLUMN IF NOT EXISTS omniva_shipment_status TEXT NULL COMMENT 'Status of Omniva shipment (e.g., REGISTERED, FAILED)';