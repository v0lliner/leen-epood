/*
  # Update dimensions support for decimal values

  1. Changes
    - Update products table to support decimal dimensions
    - Add support for width2 field for asymmetric products
    - Ensure proper data types for decimal precision

  2. Security
    - No changes to RLS policies needed
*/

-- Update dimensions column to support decimal values and additional width measurement
-- The dimensions column is already JSONB, so we just need to ensure the application
-- handles decimal values properly. No schema changes needed for the database.

-- Add a comment to document the expected structure
COMMENT ON COLUMN products.dimensions IS 'JSONB object containing product dimensions. Expected fields: height, width, width2 (optional for asymmetric products), depth. All values should be numeric (supports decimals).';

-- Create a function to validate dimensions structure (optional, for data integrity)
CREATE OR REPLACE FUNCTION validate_product_dimensions(dimensions_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if dimensions is null or empty object (both are valid)
  IF dimensions_data IS NULL OR dimensions_data = '{}'::jsonb THEN
    RETURN TRUE;
  END IF;
  
  -- Check that all dimension values are numeric if they exist
  IF dimensions_data ? 'height' AND NOT (dimensions_data->>'height' ~ '^[0-9]*\.?[0-9]+$') THEN
    RETURN FALSE;
  END IF;
  
  IF dimensions_data ? 'width' AND NOT (dimensions_data->>'width' ~ '^[0-9]*\.?[0-9]+$') THEN
    RETURN FALSE;
  END IF;
  
  IF dimensions_data ? 'width2' AND NOT (dimensions_data->>'width2' ~ '^[0-9]*\.?[0-9]+$') THEN
    RETURN FALSE;
  END IF;
  
  IF dimensions_data ? 'depth' AND NOT (dimensions_data->>'depth' ~ '^[0-9]*\.?[0-9]+$') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add a check constraint to ensure dimensions data is valid (optional)
-- Note: This is commented out as it might be too restrictive for existing data
-- ALTER TABLE products ADD CONSTRAINT valid_dimensions_check 
-- CHECK (validate_product_dimensions(dimensions));