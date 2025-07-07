/*
  # Add Omniva Parcel Machine Fields to Orders Table
  
  1. New Fields
    - `omniva_parcel_machine_id` - ID of the selected Omniva parcel machine
    - `omniva_parcel_machine_name` - Name of the selected Omniva parcel machine
    - `omniva_barcode` - Barcode/tracking number for Omniva shipment
    - `omniva_shipment_status` - Status of Omniva shipment (e.g., REGISTERED, FAILED)
*/

-- Add Omniva-specific fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS omniva_parcel_machine_id TEXT NULL,
ADD COLUMN IF NOT EXISTS omniva_parcel_machine_name TEXT NULL,
ADD COLUMN IF NOT EXISTS omniva_barcode TEXT NULL,
ADD COLUMN IF NOT EXISTS omniva_shipment_status TEXT NULL;

-- Add comments to the columns (PostgreSQL syntax)
COMMENT ON COLUMN public.orders.omniva_parcel_machine_id IS 'ID of the selected Omniva parcel machine';
COMMENT ON COLUMN public.orders.omniva_parcel_machine_name IS 'Name of the selected Omniva parcel machine';
COMMENT ON COLUMN public.orders.omniva_barcode IS 'Barcode/tracking number for Omniva shipment';
COMMENT ON COLUMN public.orders.omniva_shipment_status IS 'Status of Omniva shipment (e.g., REGISTERED, FAILED)';