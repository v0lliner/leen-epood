/*
  # Add Omniva delivery columns to orders table

  1. Changes
     - Add columns to store Omniva parcel machine information
     - Add columns to store Omniva shipment tracking information
  
  2. Purpose
     - Support Omniva parcel machine delivery option
     - Store tracking information for shipments
*/

-- Add Omniva-specific columns to orders table
ALTER TABLE public.orders 
ADD COLUMN omniva_parcel_machine_id TEXT NULL,
ADD COLUMN omniva_parcel_machine_name TEXT NULL,
ADD COLUMN omniva_barcode TEXT NULL,
ADD COLUMN omniva_shipment_status TEXT NULL;

-- Add comment to explain the purpose of these columns
COMMENT ON COLUMN public.orders.omniva_parcel_machine_id IS 'ID of the selected Omniva parcel machine';
COMMENT ON COLUMN public.orders.omniva_parcel_machine_name IS 'Name of the selected Omniva parcel machine';
COMMENT ON COLUMN public.orders.omniva_barcode IS 'Barcode/tracking number for Omniva shipment';
COMMENT ON COLUMN public.orders.omniva_shipment_status IS 'Status of Omniva shipment (e.g., REGISTERED, FAILED)';

-- Add weight column to products table for shipping calculations
ALTER TABLE public.products
ADD COLUMN weight NUMERIC(10,3) NULL;

-- Add comment to explain the purpose of the weight column
COMMENT ON COLUMN public.products.weight IS 'Product weight in kilograms for shipping calculations';