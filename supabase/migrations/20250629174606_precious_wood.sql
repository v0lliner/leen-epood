/*
  # Update dimensions support for improved labeling

  1. Documentation Update
    - Update the comment on the dimensions column to reflect the new labeling
    - width2 field is now conceptually "Pikkus" (Length) in the UI
    - Maintains backward compatibility with existing data

  2. Validation Function Update
    - Update the validation function to handle the new field semantics
    - Ensure all dimension values remain numeric (supporting decimals)

  3. Notes
    - No breaking changes to existing data structure
    - UI changes: "Laius 1" → "Laius", "Laius 2" → "Pikkus"
    - Database structure remains the same (JSONB with width2 field)
*/

-- Update the comment to reflect the new UI labeling
COMMENT ON COLUMN products.dimensions IS 'JSONB object containing product dimensions. Expected fields: height (Kõrgus), width (Laius), width2 (Pikkus - for asymmetric products), depth (Sügavus). All values should be numeric (supports decimals).';

-- Update the validation function to be more descriptive
CREATE OR REPLACE FUNCTION validate_product_dimensions(dimensions_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if dimensions is null or empty object (both are valid)
  IF dimensions_data IS NULL OR dimensions_data = '{}'::jsonb THEN
    RETURN TRUE;
  END IF;
  
  -- Check that all dimension values are numeric if they exist
  -- height (Kõrgus)
  IF dimensions_data ? 'height' AND NOT (dimensions_data->>'height' ~ '^[0-9]*\.?[0-9]+$') THEN
    RETURN FALSE;
  END IF;
  
  -- width (Laius)
  IF dimensions_data ? 'width' AND NOT (dimensions_data->>'width' ~ '^[0-9]*\.?[0-9]+$') THEN
    RETURN FALSE;
  END IF;
  
  -- width2 (Pikkus - for asymmetric products)
  IF dimensions_data ? 'width2' AND NOT (dimensions_data->>'width2' ~ '^[0-9]*\.?[0-9]+$') THEN
    RETURN FALSE;
  END IF;
  
  -- depth (Sügavus)
  IF dimensions_data ? 'depth' AND NOT (dimensions_data->>'depth' ~ '^[0-9]*\.?[0-9]+$') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add a comment to the validation function
COMMENT ON FUNCTION validate_product_dimensions(JSONB) IS 'Validates that product dimensions contain only numeric values. Supports decimal numbers. Fields: height (Kõrgus), width (Laius), width2 (Pikkus), depth (Sügavus).';