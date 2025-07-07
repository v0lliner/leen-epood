/*
  # Add Omniva fields to orders table

  1. New Fields
    - `omniva_parcel_machine_id` - ID of the selected Omniva parcel machine
    - `omniva_parcel_machine_name` - Name of the selected Omniva parcel machine
    - `omniva_barcode` - Barcode/tracking number for Omniva shipment
    - `omniva_shipment_status` - Status of Omniva shipment (e.g., REGISTERED, FAILED)
  
  2. Purpose
    - These fields enable integration with Omniva parcel delivery service
    - Allows tracking of shipments and status updates
*/

-- Add Omniva-specific fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS omniva_parcel_machine_id TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS omniva_parcel_machine_name TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS omniva_barcode TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS omniva_shipment_status TEXT;

-- Add comments to explain the fields
COMMENT ON COLUMN public.orders.omniva_parcel_machine_id IS 'ID of the selected Omniva parcel machine';
COMMENT ON COLUMN public.orders.omniva_parcel_machine_name IS 'Name of the selected Omniva parcel machine';
COMMENT ON COLUMN public.orders.omniva_barcode IS 'Barcode/tracking number for Omniva shipment';
COMMENT ON COLUMN public.orders.omniva_shipment_status IS 'Status of Omniva shipment (e.g., REGISTERED, FAILED)';