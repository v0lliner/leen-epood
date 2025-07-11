/*
  # Create maksekeskus_config table

  1. New Tables
    - `maksekeskus_config`
      - `id` (uuid, primary key)
      - `shop_id` (text, not null)
      - `api_secret_key` (text, not null)
      - `api_open_key` (text, not null)
      - `test_mode` (boolean, default false)
      - `active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `maksekeskus_config` table
    - Add policy for authenticated users to manage configurations
  3. Views
    - Create `admin_payment_config_view` for masked API keys
*/

-- Create maksekeskus_config table
CREATE TABLE IF NOT EXISTS maksekeskus_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id text NOT NULL,
  api_secret_key text NOT NULL,
  api_open_key text NOT NULL,
  test_mode boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE maksekeskus_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can manage maksekeskus_config"
  ON maksekeskus_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create view for masked API keys
CREATE OR REPLACE VIEW admin_payment_config_view AS
SELECT 
  id,
  shop_id,
  CASE 
    WHEN LENGTH(api_secret_key) > 8 
    THEN SUBSTRING(api_secret_key, 1, 4) || '****' || SUBSTRING(api_secret_key, LENGTH(api_secret_key) - 3, 4) 
    ELSE '********' 
  END as api_secret_key_masked,
  CASE 
    WHEN LENGTH(api_open_key) > 8 
    THEN SUBSTRING(api_open_key, 1, 4) || '****' || SUBSTRING(api_open_key, LENGTH(api_open_key) - 3, 4) 
    ELSE '********' 
  END as api_open_key_masked,
  test_mode,
  active,
  created_at,
  updated_at
FROM maksekeskus_config
WHERE active = true
LIMIT 1;

-- Insert test configuration
INSERT INTO maksekeskus_config (shop_id, api_secret_key, api_open_key, test_mode, active)
VALUES (
  'f7741ab2-7445-45f9-9af4-0d0408ef1e4c',
  'pfOsGD9oPaFEILwqFLHEHkPf7vZz4j3t36nAcufP1abqT9l99koyuC1IWAOcBeqt',
  'zPA6jCTIvGKYqrXxlgkXLzv3F82Mjv2E',
  true,
  true
);

-- Create update function for updated_at
CREATE OR REPLACE FUNCTION update_maksekeskus_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_maksekeskus_config_updated_at
BEFORE UPDATE ON maksekeskus_config
FOR EACH ROW
EXECUTE FUNCTION update_maksekeskus_config_updated_at();