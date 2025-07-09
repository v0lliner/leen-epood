/*
  # Add order tracking and label columns
  
  1. New Columns
    - `label_url` (text) - URL to the PDF shipping label
    - `tracking_url` (text) - URL to track the shipment
    - `shipment_registered_at` (timestamp) - When the shipment was registered with Omniva
*/

-- Add new columns to orders table
ALTER TABLE IF EXISTS orders 
ADD COLUMN IF NOT EXISTS label_url TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS shipment_registered_at TIMESTAMP WITH TIME ZONE;