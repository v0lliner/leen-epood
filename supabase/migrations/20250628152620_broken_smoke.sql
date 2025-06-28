/*
  # Kategooriate haldus ja piltide salvestamine

  1. Uued tabelid
    - `categories` - kategooriate haldamiseks
    - Storage bucket piltide jaoks

  2. Turvalisus
    - RLS policies kõigile tabelitele
    - Storage policies piltide jaoks
*/

-- Kategooriate tabel
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Kategooriate policies
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Kategooriate updated_at trigger
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket piltide jaoks
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Algandmed kategooriatele
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Keraamika', 'keraamika', NULL, 1),
  ('Õmblustööd', 'omblus', NULL, 2)
ON CONFLICT (slug) DO NOTHING;

-- Alamkategooriad keraamikale
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Kausid', 'kausid', (SELECT id FROM categories WHERE slug = 'keraamika'), 1),
  ('Alused', 'alused', (SELECT id FROM categories WHERE slug = 'keraamika'), 2),
  ('Kujud', 'kujud', (SELECT id FROM categories WHERE slug = 'keraamika'), 3),
  ('Tassid', 'tassid', (SELECT id FROM categories WHERE slug = 'keraamika'), 4),
  ('Vaasid', 'vaasid', (SELECT id FROM categories WHERE slug = 'keraamika'), 5)
ON CONFLICT (slug) DO NOTHING;

-- Alamkategooriad õmblustöödele
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Kimonod', 'kimonod', (SELECT id FROM categories WHERE slug = 'omblus'), 1),
  ('Kaunistused', 'kaunistused', (SELECT id FROM categories WHERE slug = 'omblus'), 2),
  ('Rõivad', 'roivad', (SELECT id FROM categories WHERE slug = 'omblus'), 3)
ON CONFLICT (slug) DO NOTHING;