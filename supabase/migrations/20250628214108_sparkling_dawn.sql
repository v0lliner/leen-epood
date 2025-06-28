/*
  # Create portfolio_items table

  1. New Tables
    - `portfolio_items`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `technique` (text, optional)
      - `dimensions` (text, optional)
      - `year` (integer, optional)
      - `category` (text, required)
      - `image` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `portfolio_items` table
    - Add policy for public read access
    - Add policy for authenticated users to manage items

  3. Sample Data
    - Insert sample portfolio items for testing
*/

-- Loo portfolio_items tabel kui see ei eksisteeri
CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  technique text,
  dimensions text,
  year integer,
  category text NOT NULL,
  image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Luba RLS
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Loo indeksid
CREATE INDEX IF NOT EXISTS portfolio_items_category_idx ON portfolio_items(category);
CREATE INDEX IF NOT EXISTS portfolio_items_year_idx ON portfolio_items(year);
CREATE INDEX IF NOT EXISTS portfolio_items_created_at_idx ON portfolio_items(created_at);

-- Kustuta olemasolevad poliitikad kui need eksisteerivad
DROP POLICY IF EXISTS "Anyone can read portfolio items" ON portfolio_items;
DROP POLICY IF EXISTS "Authenticated users can manage portfolio items" ON portfolio_items;

-- RLS poliitikad
-- 1. Kõik saavad lugeda portfolio tööd
CREATE POLICY "Anyone can read portfolio items"
  ON portfolio_items
  FOR SELECT
  TO public
  USING (true);

-- 2. Autenditud kasutajad saavad hallata portfolio tööd
CREATE POLICY "Authenticated users can manage portfolio items"
  ON portfolio_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Loo updated_at trigger kui see ei eksisteeri
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_portfolio_items_updated_at'
  ) THEN
    CREATE TRIGGER update_portfolio_items_updated_at
      BEFORE UPDATE ON portfolio_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Lisa mõned näidisandmed kui tabel on tühi
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM portfolio_items LIMIT 1) THEN
    INSERT INTO portfolio_items (title, technique, dimensions, year, category, image) VALUES
      ('Savi vaas', 'Käsitsi vormitud, glasuuritud', '25cm x 15cm', 2023, 'ceramics', 'https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'),
      ('Linane kleit', 'Käsitsi õmmeldud, looduslik materjal', 'Suurus M', 2023, 'clothing', 'https://images.pexels.com/photos/7148430/pexels-photo-7148430.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'),
      ('Kohvitassid', 'Dreitud, mattkasiin', '8cm x 8cm, komplekt 4tk', 2022, 'ceramics', 'https://images.pexels.com/photos/4226894/pexels-photo-4226894.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'),
      ('Villane vest', 'Käsitööna kootud, loodusvärvid', 'Suurus S-M', 2023, 'clothing', 'https://images.pexels.com/photos/6069101/pexels-photo-6069101.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'),
      ('Segatehnika taldrik', 'Keraamika ja tekstiil', '20cm diameter', 2024, 'other', 'https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'),
      ('Tekstuurne sein', 'Mitmematerjali installatsioon', '100cm x 150cm', 2024, 'other', 'https://images.pexels.com/photos/6479546/pexels-photo-6479546.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2');
  END IF;
END $$;