/*
  # Taasta Omniva saatmise seaded

  1. Uued tabelid
    - `omniva_shipping_settings`
      - `id` (uuid, primary key)
      - `price` (numeric, saatmise hind)
      - `active` (boolean, kas seaded on aktiivsed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Turvalisus
    - Luba RLS tabelil `omniva_shipping_settings`
    - Lisa poliitika autenditud kasutajatele haldamiseks
    - Lisa poliitika avalikuks lugemiseks
*/

CREATE TABLE IF NOT EXISTS omniva_shipping_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price numeric(10,2) NOT NULL DEFAULT 3.50,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE omniva_shipping_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable public read access for omniva_shipping_settings"
  ON omniva_shipping_settings
  FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can manage omniva_shipping_settings"
  ON omniva_shipping_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Lisa vaikimisi seaded
INSERT INTO omniva_shipping_settings (price, active) 
VALUES (3.50, true)
ON CONFLICT DO NOTHING;

-- Lisa trigger updated_at välja uuendamiseks
CREATE OR REPLACE FUNCTION update_omniva_shipping_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_omniva_shipping_settings_updated_at
  BEFORE UPDATE ON omniva_shipping_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_omniva_shipping_settings_updated_at();