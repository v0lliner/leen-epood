/*
  # Lisa toodete piltide tugi

  1. Uued tabelid
    - `product_images` - toodete piltide haldamiseks
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `image_url` (text)
      - `image_path` (text)
      - `is_primary` (boolean)
      - `display_order` (integer)
      - `created_at` (timestamp)

  2. Turvalisus
    - Luba RLS `product_images` tabelil
    - Lisa poliitikad autentitud kasutajatele
*/

-- Loo product_images tabel
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_path text,
  is_primary boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Luba RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Loo indeksid
CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON product_images(product_id);
CREATE INDEX IF NOT EXISTS product_images_display_order_idx ON product_images(display_order);
CREATE INDEX IF NOT EXISTS product_images_is_primary_idx ON product_images(is_primary);

-- RLS poliitikad
CREATE POLICY "Anyone can read product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage product images"
  ON product_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Funktsioon, mis tagab et ainult üks pilt on primary per toode
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Kui uus pilt on primary, siis eemalda primary teistelt sama toote piltidelt
  IF NEW.is_primary = true THEN
    UPDATE product_images 
    SET is_primary = false 
    WHERE product_id = NEW.product_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Loo trigger
CREATE TRIGGER ensure_single_primary_image_trigger
  AFTER INSERT OR UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_image();

-- Migreerime olemasolevad tooted
INSERT INTO product_images (product_id, image_url, image_path, is_primary, display_order)
SELECT 
  id as product_id,
  image as image_url,
  image_path,
  true as is_primary,
  0 as display_order
FROM products 
WHERE image IS NOT NULL AND image != ''
ON CONFLICT DO NOTHING;