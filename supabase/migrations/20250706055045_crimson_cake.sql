/*
  # Update Maksekeskus configuration to production mode
  
  1. Changes
     - Set test_mode to false in maksekeskus_config table
*/

-- Update the test_mode to false for production use
UPDATE maksekeskus_config
SET test_mode = false
WHERE id = '4e2bed9a-aa24-4b87-801b-56c31c535d36';

-- If no rows exist yet, insert a new configuration with test_mode set to false
INSERT INTO maksekeskus_config (
  id, 
  api_secret_key, 
  api_open_key, 
  test_mode, 
  active
) 
VALUES (
  '4e2bed9a-aa24-4b87-801b-56c31c535d36',
  'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ',
  'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM',
  false,
  true
) 
ON CONFLICT (id) DO NOTHING;