/*
  # About page content management

  1. New Tables
    - `about_page_content`
      - `id` (uuid, primary key)
      - `section` (text, unique) - section identifier
      - `title` (text) - section title
      - `content` (text) - section content
      - `image_url` (text) - optional image URL
      - `image_path` (text) - optional storage path
      - `display_order` (integer) - section order
      - `is_active` (boolean) - whether section is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `about_page_content` table
    - Add policy for public read access
    - Add policy for authenticated users to manage content

  3. Sample Data
    - Insert default content sections
*/

-- Loo about_page_content tabel
CREATE TABLE IF NOT EXISTS about_page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text UNIQUE NOT NULL,
  title text,
  content text,
  image_url text,
  image_path text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Luba RLS
ALTER TABLE about_page_content ENABLE ROW LEVEL SECURITY;

-- Loo indeksid
CREATE INDEX IF NOT EXISTS about_page_content_section_idx ON about_page_content(section);
CREATE INDEX IF NOT EXISTS about_page_content_display_order_idx ON about_page_content(display_order);
CREATE INDEX IF NOT EXISTS about_page_content_is_active_idx ON about_page_content(is_active);

-- Kustuta olemasolevad poliitikad kui need eksisteerivad
DROP POLICY IF EXISTS "Anyone can read about page content" ON about_page_content;
DROP POLICY IF EXISTS "Authenticated users can manage about page content" ON about_page_content;

-- RLS poliitikad
-- 1. Kõik saavad lugeda about lehe sisu
CREATE POLICY "Anyone can read about page content"
  ON about_page_content
  FOR SELECT
  TO public
  USING (is_active = true);

-- 2. Autenditud kasutajad saavad hallata about lehe sisu
CREATE POLICY "Authenticated users can manage about page content"
  ON about_page_content
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Loo updated_at trigger kui see ei eksisteeri
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_about_page_content_updated_at'
  ) THEN
    CREATE TRIGGER update_about_page_content_updated_at
      BEFORE UPDATE ON about_page_content
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Lisa vaikimisi sisu kui tabel on tühi
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM about_page_content LIMIT 1) THEN
    INSERT INTO about_page_content (section, title, content, image_url, display_order) VALUES
      ('intro', 'Sissejuhatus', 'Olen Leen Väränen – keraamik ja rõivadisainer, kelle looming sünnib südamest ja mälestustest. Minu tee keraamikani sai alguse juba lapsepõlvekodus, kus saviesemed olid alati au sees. Armastuse keraamika vastu pärisin oma emalt – see kasvas minuga koos ja jõudis lõpuks minu tööde tuumani.

Joonistan, lõikan, põletan ja õmblen – iga ese, mille loon, kannab endas midagi isiklikku. Inspiratsiooni leian loodusest, lihtsatest vormidest ja elu vahehetkedest. Mulle on olulised rahulikud jooned, puhas disain ning taimemotiivid, mis lisavad esemetele elu ja rütmi.', 'https://images.pexels.com/photos/6185765/pexels-photo-6185765.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 1),
      
      ('story', 'Minu lugu', 'Minu looming ühendab mineviku pärandi ja kaasaegse esteetika. Tulemuseks on ainulaadsed käsitöötooted, mis sobivad nii argipäeva kui ka erilisteks hetkedeks. Olgu selleks tass, millel on lapsepõlve varju, või kimono, mis jutustab loo – igas töös on midagi, mis puudutab.', NULL, 2),
      
      ('education', 'Haridus', '• Tallinna Tööstushariduskeskus
• Vana-Vigala Tehnika- ja Teeninduskool
• Täiendavad kunstikursused lastekunstikoolis ja tarbekunsti suunal', NULL, 3),
      
      ('experience', 'Kogemus', '• Pikaaegne õpetaja
• Rätsep ja rõivadisaini praktiseerija
• Aktiivselt tegutsev keraamik', NULL, 4),
      
      ('inspiration', 'Inspiratsioon', '• Taimede motiivid, varjud ja mustrid
• Vormid, värvid ja elatud mälestused
• Igapäeva ilu ja looduslike materjalide tundlikkus', NULL, 5),
      
      ('cta', 'Kutse', 'Huvitatud minu loomingust? Vaata, millised tööd on praegu saadaval.', NULL, 6);
  END IF;
END $$;