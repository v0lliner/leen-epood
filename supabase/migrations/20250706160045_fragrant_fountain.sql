/*
  # Add homepage content management

  1. New Tables
    - `homepage_content`
      - `id` (uuid, primary key)
      - `section` (text) - section identifier (hero, value1, value2, value3)
      - `title` (text) - section title
      - `content` (text) - section content
      - `image_url` (text) - optional image URL
      - `image_path` (text) - optional storage path
      - `language` (text) - language code (et, en)
      - `display_order` (integer) - section order
      - `is_active` (boolean) - whether section is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `homepage_content` table
    - Add policy for public read access
    - Add policy for authenticated users to manage content

  3. Sample Data
    - Insert default content sections for Estonian and English
*/

-- Create homepage_content table
CREATE TABLE IF NOT EXISTS homepage_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  title text,
  content text,
  image_url text,
  image_path text,
  language text NOT NULL DEFAULT 'et',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(section, language)
);

-- Enable RLS
ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS homepage_content_section_idx ON homepage_content(section);
CREATE INDEX IF NOT EXISTS homepage_content_language_idx ON homepage_content(language);
CREATE INDEX IF NOT EXISTS homepage_content_display_order_idx ON homepage_content(display_order);
CREATE INDEX IF NOT EXISTS homepage_content_is_active_idx ON homepage_content(is_active);
CREATE INDEX IF NOT EXISTS homepage_content_section_language_idx ON homepage_content(section, language);

-- RLS policies
-- 1. Public can read active homepage content
CREATE POLICY "Enable public read access for active homepage_content"
  ON homepage_content
  FOR SELECT
  TO public
  USING (is_active = true);

-- 2. Authenticated users can manage homepage content
CREATE POLICY "Authenticated users can manage homepage content"
  ON homepage_content
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_homepage_content_updated_at
  BEFORE UPDATE ON homepage_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default content for Estonian
INSERT INTO homepage_content (section, title, content, display_order, language) VALUES
  ('hero', 'Leen Väränen', 'Keraamika ja disain, mis kannab isiklikku sõnumit.', 1, 'et'),
  ('value1', 'Praktiline esteetika', 'Iga ese on loodud kasutamiseks – esteetika tuleb lihtsusest, materjalist ja läbimõeldud vormist.', 2, 'et'),
  ('value2', 'Isikupärane käekiri', 'Looming on äratuntav detailide, materjalitunde ja tasakaaluka vormikeele kaudu.', 3, 'et'),
  ('value3', 'Visuaalne proportsioon', 'Tervik tekib siis, kui vormi osad toetavad üksteist – tasakaal on vaadeldav ja tajutav.', 4, 'et');

-- Insert default content for English
INSERT INTO homepage_content (section, title, content, display_order, language) VALUES
  ('hero', 'Leen Väränen', 'Ceramics and design that carries a personal message.', 1, 'en'),
  ('value1', 'Practical beauty', 'Each piece is made to be used – its beauty comes from simplicity, material, and thoughtful form.', 2, 'en'),
  ('value2', 'Distinctive style', 'The work is recognizable through its details, feel for materials, and balanced design language.', 3, 'en'),
  ('value3', 'Visual proportions', 'A whole emerges when the parts of a form support each other – balance is something you can see and feel.', 4, 'en');

-- Grant permissions
GRANT SELECT ON homepage_content TO anon, authenticated;