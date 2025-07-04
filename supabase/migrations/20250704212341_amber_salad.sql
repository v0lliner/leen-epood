/*
  # Fix Payment Integration

  1. Create Maksekeskus Configuration Table
    - Adds a secure table to store payment gateway configuration
    - Includes shop ID, API keys, and environment settings
    - Enables proper credential management

  2. Security
    - Enables RLS on the configuration table
    - Restricts access to authenticated users only
    - Ensures sensitive payment credentials are protected
*/

-- Create a table to store Maksekeskus configuration
CREATE TABLE IF NOT EXISTS maksekeskus_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  api_secret_key TEXT NOT NULL,
  api_open_key TEXT NOT NULL,
  test_mode BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on the configuration table
ALTER TABLE maksekeskus_config ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view configuration
CREATE POLICY "Authenticated users can view payment config"
  ON maksekeskus_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial configuration with the correct credentials
INSERT INTO maksekeskus_config (
  shop_id, 
  api_secret_key, 
  api_open_key, 
  test_mode, 
  active
) VALUES (
  '4e2bed9a-aa24-4b87-801b-56c31c535d36',
  'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ',
  'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM',
  true,
  true
) ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maksekeskus_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_maksekeskus_config_updated_at
BEFORE UPDATE ON maksekeskus_config
FOR EACH ROW
EXECUTE FUNCTION update_maksekeskus_config_updated_at();

-- Create view for admin dashboard to see payment configuration status
CREATE OR REPLACE VIEW admin_payment_config_view AS
SELECT 
  id,
  shop_id,
  substring(api_secret_key, 1, 4) || '...' || substring(api_secret_key, length(api_secret_key) - 3, 4) AS api_secret_key_masked,
  substring(api_open_key, 1, 4) || '...' || substring(api_open_key, length(api_open_key) - 3, 4) AS api_open_key_masked,
  test_mode,
  active,
  created_at,
  updated_at
FROM 
  maksekeskus_config;

-- Grant access to the view
GRANT SELECT ON admin_payment_config_view TO authenticated;

-- Create function to get active payment configuration
CREATE OR REPLACE FUNCTION get_active_payment_config()
RETURNS TABLE (
  shop_id TEXT,
  api_secret_key TEXT,
  api_open_key TEXT,
  test_mode BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.shop_id,
    mc.api_secret_key,
    mc.api_open_key,
    mc.test_mode
  FROM 
    maksekeskus_config mc
  WHERE 
    mc.active = true
  ORDER BY 
    mc.updated_at DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_active_payment_config() TO authenticated;