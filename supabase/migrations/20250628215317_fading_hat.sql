/*
  # Kakskeelse "Minust" lehe sisu haldus

  1. Uuendused
    - Lisa keele väli (language) about_page_content tabelisse
    - Muuda unique constraint et toetada erinevaid keeli
    - Uuenda indekseid ja poliitikaid

  2. Andmed
    - Lisa eestikeelne ja ingliskeelne sisu
    - Säilita olemasolev struktuur

  3. Turvalisus
    - Uuenda RLS poliitikaid
    - Säilita ligipääsu kontroll
*/

-- Lisa language väli kui see ei eksisteeri
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'about_page_content' AND column_name = 'language'
  ) THEN
    ALTER TABLE about_page_content ADD COLUMN language text DEFAULT 'et';
  END IF;
END $$;

-- Kustuta vana unique constraint
ALTER TABLE about_page_content DROP CONSTRAINT IF EXISTS about_page_content_section_key;

-- Lisa uus unique constraint mis arvestab keelt
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'about_page_content_section_language_key'
  ) THEN
    ALTER TABLE about_page_content 
    ADD CONSTRAINT about_page_content_section_language_key 
    UNIQUE (section, language);
  END IF;
END $$;

-- Loo uued indeksid
CREATE INDEX IF NOT EXISTS about_page_content_language_idx ON about_page_content(language);
CREATE INDEX IF NOT EXISTS about_page_content_section_language_idx ON about_page_content(section, language);

-- Uuenda olemasolevad kirjed et neil oleks keel määratud
UPDATE about_page_content SET language = 'et' WHERE language IS NULL;

-- Lisa ingliskeelne sisu
INSERT INTO about_page_content (section, language, title, content, image_url, display_order) VALUES
  ('intro', 'en', 'Introduction', 'I am Leen Väränen – a ceramicist and clothing designer whose work is born from the heart and memories. My journey to ceramics began in my childhood home, where clay objects were always held in high regard. I inherited my love for ceramics from my mother – it grew with me and eventually became the core of my work.

I draw, cut, fire and sew – every object I create carries something personal within it. I find inspiration in nature, simple forms and life''s fleeting moments. What matters to me are calm lines, clean design and plant motifs that add life and rhythm to objects.', 'https://images.pexels.com/photos/6185765/pexels-photo-6185765.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 1),
  
  ('story', 'en', 'My Story', 'My work combines the heritage of the past with contemporary aesthetics. The result is unique handcrafted products that suit both everyday life and special moments. Whether it''s a cup that carries childhood shadows or a kimono that tells a story – there''s something touching in every piece.', NULL, 2),
  
  ('education', 'en', 'Education', '• Tallinn Industrial Education Centre
• Vana-Vigala Technical and Service School
• Additional art courses at children''s art school and applied arts', NULL, 3),
  
  ('experience', 'en', 'Experience', '• Long-time teacher
• Tailor and clothing design practitioner
• Actively working ceramicist', NULL, 4),
  
  ('inspiration', 'en', 'Inspiration', '• Plant motifs, shadows and patterns
• Forms, colors and lived memories
• Everyday beauty and sensitivity of natural materials', NULL, 5),
  
  ('cta', 'en', 'Call to Action', 'Interested in my work? See what pieces are currently available.', NULL, 6)
ON CONFLICT (section, language) DO NOTHING;