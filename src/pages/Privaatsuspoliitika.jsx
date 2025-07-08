import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Privaatsuspoliitika = () => {
  const { t, i18n } = useTranslation();
  const isEstonian = i18n.language === 'et';

  return (
    <>
      <SEOHead page="privacy" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <h1 className="text-center">{isEstonian ? 'Privaatsuspoliitika' : 'Privacy Policy'}</h1>
            </FadeInSection>

            <FadeInSection className="privacy-content">
              {isEstonian ? (
                // Estonian content
                <>
                  <div className="privacy-section">
                    <h2>1. Üldinfo</h2>
                    <p>Käesolev privaatsuspoliitika selgitab, kuidas PopLeen OÜ (edaspidi Müüja) kogub, kasutab ja kaitseb Ostja isikuandmeid e-poes leen.ee.</p>
                    <p>Müüja austab Ostja privaatsust ja töötleb isikuandmeid vastavalt kehtivatele õigusaktidele, sealhulgas Euroopa Liidu isikuandmete kaitse üldmäärusele (GDPR).</p>
                  </div>

                  <div className="privacy-section">
                    <h2>2. Isikuandmete kogumine</h2>
                    <p>Müüja võib koguda järgmisi isikuandmeid:</p>
                    <ul>
                      <li>Nimi</li>
                      <li>Kontaktandmed (e-post, telefon)</li>
                      <li>Tarneaadress</li>
                      <li>Ostuajalugu</li>
                      <li>IP-aadress ja küpsiste andmed</li>
                    </ul>
                    <p>Isikuandmeid kogutakse Ostjalt otse tellimuse vormistamise käigus või veebilehe kasutamise käigus.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>3. Isikuandmete kasutamine</h2>
                    <p>Müüja kasutab isikuandmeid järgmistel eesmärkidel:</p>
                    <ul>
                      <li>Tellimuste töötlemine ja täitmine</li>
                      <li>Klienditeenindus ja suhtlus</li>
                      <li>Toodete ja teenuste pakkumine ja parendamine</li>
                      <li>Seadusest tulenevate kohustuste täitmine</li>
                    </ul>
                  </div>

                  <div className="privacy-section">
                    <h2>4. Isikuandmete jagamine</h2>
                    <p>Müüja võib jagada Ostja isikuandmeid järgmiste kolmandate osapooltega:</p>
                    <ul>
                      <li>Tarneettevõtted (tellimuse kättetoimetamiseks)</li>
                      <li>Maksekeskus (maksete töötlemiseks)</li>
                      <li>IT-teenuste pakkujad (veebilehe ja andmete haldamiseks)</li>
                    </ul>
                    <p>Müüja jagab isikuandmeid kolmandate osapooltega ainult ulatuses, mis on vajalik teenuse osutamiseks või seadusest tulenevate kohustuste täitmiseks.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>5. Maksekeskuse roll</h2>
                    <p>Maksete töötlemiseks kasutab Müüja Maksekeskus AS teenuseid. Maksete teostamisel edastatakse Ostja maksekeskuse turvalisse keskkonda, kus toimub makse töötlemine.</p>
                    <p>Maksekeskus töötleb järgmisi andmeid:</p>
                    <ul>
                      <li>Ostja nimi</li>
                      <li>Kontaktandmed (e-post, telefon)</li>
                      <li>Makseandmed</li>
                      <li>Tellimuse summa ja sisu</li>
                    </ul>
                    <p>Maksekeskus töötleb isikuandmeid vastavalt oma privaatsuspoliitikale, mis on kättesaadav aadressil <a href="https://maksekeskus.ee/privacy-policy/" target="_blank" rel="noopener noreferrer" className="privacy-link">https://maksekeskus.ee/privacy-policy/</a>.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>6. Isikuandmete säilitamine</h2>
                    <p>Müüja säilitab isikuandmeid ainult nii kaua, kui see on vajalik eesmärkide saavutamiseks, milleks andmeid koguti, või seadusest tulenevate kohustuste täitmiseks.</p>
                    <p>Raamatupidamisdokumente säilitatakse vastavalt seadusele 7 aastat.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>7. Ostja õigused</h2>
                    <p>Ostjal on järgmised õigused seoses oma isikuandmetega:</p>
                    <ul>
                      <li>Õigus tutvuda oma isikuandmetega</li>
                      <li>Õigus nõuda ebaõigete isikuandmete parandamist</li>
                      <li>Õigus nõuda isikuandmete kustutamist</li>
                      <li>Õigus piirata isikuandmete töötlemist</li>
                      <li>Õigus esitada vastuväiteid isikuandmete töötlemisele</li>
                      <li>Õigus andmete ülekandmisele</li>
                    </ul>
                    <p>Oma õiguste teostamiseks palume pöörduda e-posti aadressil leen@leen.ee.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>8. Küpsised</h2>
                    <p>Veebileht leen.ee kasutab küpsiseid, et pakkuda paremat kasutajakogemust ja analüüsida veebilehe kasutust.</p>
                    <p>Küpsised on väikesed tekstifailid, mis salvestatakse Ostja seadmesse veebilehe külastamise ajal.</p>
                    <p>Ostjal on õigus keelduda küpsiste kasutamisest, muutes oma veebilehitseja seadeid, kuid see võib mõjutada veebilehe funktsionaalsust.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>9. Turvalisus</h2>
                    <p>Müüja rakendab asjakohaseid tehnilisi ja organisatsioonilisi meetmeid, et kaitsta isikuandmeid juhusliku või ebaseadusliku hävitamise, kaotsimineku, muutmise, loata avalikustamise või juurdepääsu eest.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>10. Muudatused privaatsuspoliitikas</h2>
                    <p>Müüjal on õigus privaatsuspoliitikat ühepoolselt muuta, avaldades muudetud tingimused veebilehel leen.ee.</p>
                    <p>Käesolev privaatsuspoliitika kehtib alates 01.07.2025.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>11. Kontakt</h2>
                    <p>Privaatsuspoliitikaga seotud küsimused palume saata e-posti aadressile leen@leen.ee.</p>
                  </div>
                </>
              ) : (
                // English content
                <>
                  <div className="privacy-section">
                    <h2>1. General Information</h2>
                    <p>This privacy policy explains how PopLeen OÜ (hereinafter the Seller) collects, uses, and protects the Buyer's personal data in the e-shop leen.ee.</p>
                    <p>The Seller respects the Buyer's privacy and processes personal data in accordance with applicable legislation, including the European Union General Data Protection Regulation (GDPR).</p>
                  </div>

                  <div className="privacy-section">
                    <h2>2. Collection of Personal Data</h2>
                    <p>The Seller may collect the following personal data:</p>
                    <ul>
                      <li>Name</li>
                      <li>Contact details (email, phone)</li>
                      <li>Delivery address</li>
                      <li>Purchase history</li>
                      <li>IP address and cookie data</li>
                    </ul>
                    <p>Personal data is collected directly from the Buyer during the checkout process or during website usage.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>3. Use of Personal Data</h2>
                    <p>The Seller uses personal data for the following purposes:</p>
                    <ul>
                      <li>Processing and fulfilling orders</li>
                      <li>Customer service and communication</li>
                      <li>Offering and improving products and services</li>
                      <li>Fulfilling legal obligations</li>
                    </ul>
                  </div>

                  <div className="privacy-section">
                    <h2>4. Sharing of Personal Data</h2>
                    <p>The Seller may share the Buyer's personal data with the following third parties:</p>
                    <ul>
                      <li>Delivery companies (for order delivery)</li>
                      <li>Maksekeskus (for payment processing)</li>
                      <li>IT service providers (for website and data management)</li>
                    </ul>
                    <p>The Seller shares personal data with third parties only to the extent necessary to provide the service or to fulfill legal obligations.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>5. Role of Maksekeskus</h2>
                    <p>For payment processing, the Seller uses the services of Maksekeskus AS. When making payments, the Buyer is redirected to the secure environment of the payment processor, where the payment is processed.</p>
                    <p>Maksekeskus processes the following data:</p>
                    <ul>
                      <li>Buyer's name</li>
                      <li>Contact details (email, phone)</li>
                      <li>Payment details</li>
                      <li>Order amount and content</li>
                    </ul>
                    <p>Maksekeskus processes personal data in accordance with its privacy policy, which is available at <a href="https://maksekeskus.ee/privacy-policy/" target="_blank" rel="noopener noreferrer" className="privacy-link">https://maksekeskus.ee/privacy-policy/</a>.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>6. Retention of Personal Data</h2>
                    <p>The Seller retains personal data only for as long as necessary to achieve the purposes for which the data was collected or to fulfill legal obligations.</p>
                    <p>Accounting documents are retained for 7 years in accordance with the law.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>7. Buyer's Rights</h2>
                    <p>The Buyer has the following rights regarding their personal data:</p>
                    <ul>
                      <li>Right to access their personal data</li>
                      <li>Right to request correction of incorrect personal data</li>
                      <li>Right to request deletion of personal data</li>
                      <li>Right to restrict the processing of personal data</li>
                      <li>Right to object to the processing of personal data</li>
                      <li>Right to data portability</li>
                    </ul>
                    <p>To exercise these rights, please contact us at leen@leen.ee.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>8. Cookies</h2>
                    <p>The website leen.ee uses cookies to provide a better user experience and analyze website usage.</p>
                    <p>Cookies are small text files that are stored on the Buyer's device when visiting the website.</p>
                    <p>The Buyer has the right to refuse the use of cookies by changing their browser settings, but this may affect the functionality of the website.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>9. Security</h2>
                    <p>The Seller implements appropriate technical and organizational measures to protect personal data against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>10. Changes to the Privacy Policy</h2>
                    <p>The Seller has the right to unilaterally change the privacy policy by publishing the amended terms on the website leen.ee.</p>
                    <p>This privacy policy is valid from July 1, 2025.</p>
                  </div>

                  <div className="privacy-section">
                    <h2>11. Contact</h2>
                    <p>Questions related to the privacy policy should be sent to the email address leen@leen.ee.</p>
                  </div>
                </>
              )}
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .privacy-content {
          max-width: 800px;
          margin: 48px auto 0;
        }

        .privacy-section {
          margin-bottom: 48px;
        }

        .privacy-section h2 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-bottom: 24px;
        }

        .privacy-section p {
          margin-bottom: 16px;
          line-height: 1.6;
        }

        .privacy-section p:last-child {
          margin-bottom: 0;
        }

        .privacy-section ul {
          margin: 16px 0;
          padding-left: 24px;
        }

        .privacy-section li {
          margin-bottom: 8px;
          line-height: 1.6;
        }

        .privacy-section li:last-child {
          margin-bottom: 0;
        }

        .privacy-link {
          color: var(--color-ultramarine);
          text-decoration: underline;
          transition: opacity 0.2s ease;
        }

        .privacy-link:hover {
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .privacy-content {
            margin-top: 32px;
          }

          .privacy-section {
            margin-bottom: 32px;
          }

          .privacy-section h2 {
            font-size: 1.25rem;
            margin-bottom: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default Privaatsuspoliitika;