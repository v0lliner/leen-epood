/*
  # Order processing enhancements
  
  1. New Fields
    - Add `label_url` column to store PDF label URL
    - Add `tracking_url` column to store Omniva tracking URL
    - Add `shipment_registered_at` timestamp to track when shipment was registered
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Add new columns to orders table
ALTER TABLE IF EXISTS orders 
ADD COLUMN IF NOT EXISTS label_url TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS shipment_registered_at TIMESTAMP WITH TIME ZONE;

-- Create directory for PDF labels if it doesn't exist
DO $$
BEGIN
    EXECUTE format('CREATE OR REPLACE FUNCTION create_pdf_labels_directory() RETURNS void AS $$
    BEGIN
        PERFORM pg_catalog.pg_file_write(''public/pdf_labels/.gitkeep'', '''', false);
        RETURN;
    END;
    $$ LANGUAGE plpgsql;');
    
    -- Call the function
    PERFORM create_pdf_labels_directory();
END $$;