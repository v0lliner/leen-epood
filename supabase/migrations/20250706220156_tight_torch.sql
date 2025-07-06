/*
  # Fix Maksekeskus Config RLS Policies and Data Issues

  1. Data Cleanup
    - Ensure only one active configuration exists
    - Remove duplicate configurations if any

  2. Security Policies
    - Add proper RLS policies for authenticated users to manage Maksekeskus config
    - Allow service role to perform all operations

  3. View Fix
    - Ensure admin_payment_config_view returns single active config
*/

-- First, let's clean up any duplicate active configurations
-- Set all configs to inactive first
UPDATE maksekeskus_config SET active = false WHERE active = true;

-- Then activate only the most recent one (if any exist)
UPDATE maksekeskus_config 
SET active = true 
WHERE id = (
  SELECT id 
  FROM maksekeskus_config 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view payment config" ON maksekeskus_config;
DROP POLICY IF EXISTS "Authenticated users can manage payment config" ON maksekeskus_config;
DROP POLICY IF EXISTS "Service role can manage payment config" ON maksekeskus_config;

-- Create comprehensive RLS policies for maksekeskus_config
CREATE POLICY "Authenticated users can view payment config"
  ON maksekeskus_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage payment config"
  ON maksekeskus_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage payment config"
  ON maksekeskus_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure the view exists and works correctly
DROP VIEW IF EXISTS admin_payment_config_view;

CREATE VIEW admin_payment_config_view AS
SELECT 
  id,
  shop_id,
  CASE 
    WHEN LENGTH(api_secret_key) > 8 THEN 
      LEFT(api_secret_key, 4) || '****' || RIGHT(api_secret_key, 4)
    ELSE '****'
  END as api_secret_key_masked,
  CASE 
    WHEN LENGTH(api_open_key) > 8 THEN 
      LEFT(api_open_key, 4) || '****' || RIGHT(api_open_key, 4)
    ELSE '****'
  END as api_open_key_masked,
  test_mode,
  active,
  created_at,
  updated_at
FROM maksekeskus_config
WHERE active = true
LIMIT 1;

-- Grant permissions on the view
GRANT SELECT ON admin_payment_config_view TO authenticated;
GRANT SELECT ON admin_payment_config_view TO service_role;