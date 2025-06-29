/*
  # Create FAQ system with bilingual support

  1. New Tables
    - `faq_items`
      - `id` (uuid, primary key)
      - `question` (text, required)
      - `answer` (text, required)
      - `language` (text, default 'et')
      - `display_order` (integer, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `faq_items` table
    - Add policy for public to read active FAQ items
    - Add policy for authenticated users to manage FAQ items

  3. Indexes
    - Index on language and display_order for efficient querying
    - Index on is_active for filtering
    - Index on language for language-specific queries

  4. Triggers
    - Auto-update updated_at timestamp on changes
*/

CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  language text NOT NULL DEFAULT 'et',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read active FAQ items"
  ON faq_items
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage FAQ items"
  ON faq_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS faq_items_language_display_order_idx 
  ON faq_items (language, display_order);

CREATE INDEX IF NOT EXISTS faq_items_is_active_idx 
  ON faq_items (is_active);

CREATE INDEX IF NOT EXISTS faq_items_language_idx 
  ON faq_items (language);

-- Update trigger
CREATE OR REPLACE FUNCTION update_faq_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON faq_items
  FOR EACH ROW
  EXECUTE FUNCTION update_faq_items_updated_at();

-- Insert default FAQ items in both languages
INSERT INTO faq_items (question, answer, language, display_order, is_active) VALUES
-- Estonian FAQ items
('Kuidas toimub tellimuste saatmine ja kui kiiresti jõuab tellimus kohale?', 'Saadan kõik tellimused Eesti Posti kaudu 1-3 tööpäeva jooksul pärast tellimuse kinnitamist. Eestis jõuab tellimus tavaliselt kohale 2-4 tööpäeva jooksul. Iga tellimuse juurde panen alati väikese isikliku märkme – see on minu viis öelda aitäh, et valisite käsitöö.

Suuremad keraamikatooted pakendatakse eriti hoolikalt, et need tervena kohale jõuaksid. Kasutan alati taaskasutatud pakendeid, sest jätkusuutlikkus on mulle oluline.', 'et', 1, true),

('Kas iga toode on tõesti ainulaadne? Miks ei saa täpselt sama toodet uuesti tellida?', 'Jah, iga minu loodud ese on tõepoolest ainulaadne! Kuna teen kõike käsitsi, ei ole võimalik luua kahte täpselt ühesugust toodet. Savi käitub iga kord natuke teisiti, glasuurid annavad erinevaid tulemusi ja ka minu käed ei liigu kunagi täpselt samamoodi.

See ongi käsitöö ilu – iga ese kannab endas hetke, mil see sündis. Kui näete midagi, mis teile meeldib, soovitan kohe otsustada, sest täpselt sama enam ei tule.', 'et', 2, true),

('Milliseid materjale kasutate ja kust need pärinevad?', 'Kasutan ainult kvaliteetseid ja võimalikult looduslähedaseid materjale. Keraamika jaoks kasutan kohalikku savi ja looduslikke glasuure. Rõivaste puhul eelistangi lina, puuvilla ja villa – materjale, mis hingavad ja aja jooksul ainult ilusamaks muutuvad.

Püüan alati leida materjale võimalikult lähedalt. Eesti käsitöötraditsioonid on rikkalikud ja tahan neid edasi kanda. Iga materjali valin hoolikalt, mõeldes sellele, kuidas see aja jooksul vananeb ja kas see sobib kokku minu väärtustega.', 'et', 3, true),

('Kuidas hooldada keraamikat ja rõivaid, et need kaua kestaksid?', 'Keraamika on üsna vastupidav – enamikku tooteid saab pesta nõudepesumasinas, kuid käsitsi pesemine on alati õrnem. Vältige järske temperatuurimuutusi ja löömist kõvade pindade vastu.

Rõivaid soovitan pesta käsitsi või õrnas režiimis külmas vees. Looduslikud materjalid armastavad õhku, seega kuivatage alati varjus. Triikida saab madalal temperatuuril. Õige hooldusega kestavad minu rõivad aastaid ja muutuvad aja jooksul ainult ilusamaks – nagu hea vein.', 'et', 4, true),

('Kas teete ka tellimustöid? Saab tellida midagi spetsiaalset?', 'Jah, teen hea meelega tellimustöid! Eriti meeldib mulle luua midagi, millel on isiklik tähendus – näiteks pulmakingi või mälestusese. Tellimustöö puhul arutame koos läbi teie soovid ja võimalused.

Tellimustöö võtab tavaliselt 4-8 nädalat, sõltuvalt keerukusest. Hind sõltub materjalist, suurusest ja töömahust. Võtke julgelt ühendust ja räägime teie ideedest – vahel sünnivad kõige ilusamad asjad just sellisest koostööst!', 'et', 5, true),

('Millised makseviisid on võimalikud ja kas saab ka järelmaksu?', 'Praegu saan vastu võtta pangaülekandeid ja sularaha (kui tulete kohale). Töötan selle kallal, et peagi oleksid võimalikud ka kaardimaksed otse e-poes.

Suurema tellimuse puhul saame kokku leppida ka osalistes maksetes – näiteks pool raha ette ja pool valmimise järel. Minu jaoks on oluline, et ilus käsitöö oleks kättesaadav ka siis, kui eelarve on piiratud. Räägime alati kokku!', 'et', 6, true),

('Kui kaua võtab aega uue toote valmimise ja millal tulevad uued asjad müüki?', 'Keraamika valmimiseks kulub tavaliselt 2-3 nädalat – savi peab aeglaselt kuivama, siis tuleb esimene põletamine, glasuuri kandmine ja teine põletamine. Rõivaste puhul sõltub kõik keerukusest, aga tavaliselt 1-2 nädalat.

Uusi tooteid lisan e-poodi ebaregulaarselt – siis, kui inspiratsioon tuleb ja käed valmis saavad. Parim viis kursis olla on jälgida minu Facebooki lehte või külastada e-poodi aeg-ajalt. Iga uus asi on väike sündmus!', 'et', 7, true),

-- English FAQ items
('How does order shipping work and how quickly will my order arrive?', 'I send all orders via Estonian Post within 1-3 working days after order confirmation. In Estonia, orders usually arrive within 2-4 working days. I always include a small personal note with each order – it''s my way of saying thank you for choosing handcraft.

Larger ceramic products are packed with extra care to ensure they arrive safely. I always use recycled packaging because sustainability is important to me.', 'en', 1, true),

('Is each product truly unique? Why can''t I order exactly the same product again?', 'Yes, every piece I create is truly unique! Since I make everything by hand, it''s impossible to create two exactly identical products. Clay behaves slightly differently each time, glazes give different results, and my hands never move exactly the same way.

This is the beauty of handcraft – each piece carries the moment when it was born. If you see something you like, I recommend deciding quickly, because exactly the same will never come again.', 'en', 2, true),

('What materials do you use and where do they come from?', 'I only use quality and as natural materials as possible. For ceramics, I use local clay and natural glazes. For clothing, I prefer linen, cotton and wool – materials that breathe and only become more beautiful over time.

I always try to find materials as close as possible. Estonian craft traditions are rich and I want to carry them forward. I choose each material carefully, thinking about how it ages over time and whether it fits with my values.', 'en', 3, true),

('How to care for ceramics and clothing so they last long?', 'Ceramics are quite durable – most products can be washed in the dishwasher, but hand washing is always gentler. Avoid sudden temperature changes and hitting against hard surfaces.

I recommend washing clothes by hand or in gentle mode in cold water. Natural materials love air, so always dry in shade. You can iron at low temperature. With proper care, my clothes last for years and only become more beautiful over time – like good wine.', 'en', 4, true),

('Do you also do custom work? Can I order something special?', 'Yes, I''m happy to do custom work! I especially enjoy creating something with personal meaning – like a wedding gift or memorial piece. For custom work, we''ll discuss your wishes and possibilities together.

Custom work usually takes 4-8 weeks, depending on complexity. Price depends on material, size and workload. Feel free to get in touch and let''s talk about your ideas – sometimes the most beautiful things are born from such collaboration!', 'en', 5, true),

('What payment methods are available and is installment payment possible?', 'Currently I can accept bank transfers and cash (if you come in person). I''m working on making card payments directly in the e-shop possible soon.

For larger orders, we can also agree on partial payments – for example, half upfront and half upon completion. For me, it''s important that beautiful handcraft is accessible even when the budget is limited. We''ll always agree!', 'en', 6, true),

('How long does it take to make a new product and when do new items come for sale?', 'Ceramics usually takes 2-3 weeks to complete – clay must dry slowly, then comes the first firing, glaze application and second firing. For clothing, it depends on complexity, but usually 1-2 weeks.

I add new products to the e-shop irregularly – when inspiration comes and hands get them ready. The best way to stay updated is to follow my Facebook page or visit the e-shop from time to time. Each new item is a small event!', 'en', 7, true)

ON CONFLICT DO NOTHING;