/*
  # Switch Maksekeskus to Production Mode
  
  1. Changes
     - Updates existing Maksekeskus configuration to use production mode (test_mode = false)
     - Adds a default shop_id value to fix the not-null constraint
     - Provides fallback insert if no configuration exists yet
  
  2. Purpose
     - Prepares the system for production use by disabling test mode
*/

-- Update the test_mode to false for production use and set shop_id if missing
UPDATE maksekeskus_config
SET 
  test_mode = false,
  shop_id = COALESCE(shop_id, 'leen-shop') -- Use existing shop_id or set default
WHERE id = '4e2bed9a-aa24-4b87-801b-56c31c535d36';

-- If no rows exist yet, insert a new configuration with test_mode set to false
INSERT INTO maksekeskus_config (
  id, 
  shop_id,
  api_secret_key, 
  api_open_key, 
  test_mode, 
  active
) 
VALUES (
  '4e2bed9a-aa24-4b87-801b-56c31c535d36',
  'leen-shop',
  'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ',
  'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM',
  false,
  true
) 
ON CONFLICT (id) DO NOTHING;