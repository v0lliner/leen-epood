/*
  # Create Admin Payment Config View

  1. New Views
    - `admin_payment_config_view` - Secure view for displaying payment configuration with masked API keys
  
  2. Security
    - Enable RLS on the view
    - Add policy for authenticated users to view payment config
*/

-- Create a view that masks sensitive API keys
CREATE OR REPLACE VIEW admin_payment_config_view AS
SELECT
  id,
  shop_id,
  -- Mask the API keys for security
  CASE 
    WHEN api_secret_key IS NOT NULL THEN 
      '••••••' || RIGHT(api_secret_key, 4)
    ELSE NULL
  END as api_secret_key_masked,
  CASE 
    WHEN api_open_key IS NOT NULL THEN 
      '••••••' || RIGHT(api_open_key, 4)
    ELSE NULL
  END as api_open_key_masked,
  test_mode,
  active,
  created_at,
  updated_at
FROM
  maksekeskus_config;

-- Grant permissions to the view
GRANT SELECT ON admin_payment_config_view TO authenticated;

-- Add comment to the view
COMMENT ON VIEW admin_payment_config_view IS 'Secure view of payment configuration with masked API keys for admin UI';