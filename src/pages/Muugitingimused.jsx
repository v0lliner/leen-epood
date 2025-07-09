import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Muugitingimused = () => {
  const { t, i18n } = useTranslation();
  const isEstonian = i18n.language === 'et';

  const scrollToTop = () => {
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <SEOHead page="terms" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <h1 className="text-center">{isEstonian ? 'Müügitingimused' : 'Terms of Sale'}</h1>
            </FadeInSection>

            <FadeInSection className="terms-content">
              {isEstonian ? (
                // Estonian content
                <>
                  <div className="terms-section">
                    <h2>1. Üldinfo</h2>
                    <p>Käesolevad müügitingimused kehtivad PopLeen OÜ (edaspidi Müüja) ja e-poes leen.ee ostu sooritava kliendi (edaspidi Ostja) vahel kaupade ja teenuste ostmisel.</p>
                    
                    <h3>1.1. Ettevõtte andmed</h3>
                    <p>
                      <strong>Ettevõtte nimi:</strong> PopLeen OÜ<br />
                      <strong>Registrikood:</strong> 16501388<br />
                      <strong>Aadress:</strong> Keldrimäe, Kuku küla, 79631 Rapla vald, Rapla maakond<br />
                      <strong>E-post:</strong> leen@leen.ee<br />
                      <strong>Telefon:</strong> +372 5380 1413
                    </p>
                  </div>

                  <div className="terms-section">
                    <h2>2. Ostuprotsess ja makseviisid</h2>
                    <p>E-poes leen.ee saab tooteid osta järgmiselt:</p>
                    <ol>
                      <li>Valige soovitud tooted ja lisage need ostukorvi.</li>
                      <li>Ostukorvis saate kontrollida valitud tooteid, nende koguseid ja hindu.</li>
                      <li>Tellimuse vormistamiseks vajutage nuppu "Vormista ost".</li>
                      <li>Sisestage oma kontaktandmed ja tarneaadress.</li>
                      <li>Valige sobiv makseviis.</li>
                      <li>Kinnitage tellimus, nõustudes müügitingimustega.</li>
                    </ol>

                    <h3>2.1. Makseviisid</h3>
                    <p>E-poes leen.ee on võimalik tasuda järgmistel viisidel:</p>
                    <ul>
                      <li>Pangakaardiga (Visa, Mastercard)</li>
                      <li>Pangalingiga (Swedbank, SEB, LHV, Coop Pank, Luminor)</li>
                    </ul>
                    <p>Maksete vahendajaks on Maksekeskus AS. Maksete teostamisel edastatakse Ostja maksekeskuse turvalisse keskkonda.</p>
                  </div>

                  <div className="terms-section">
                    <h2>3. Tarneinfo</h2>
                    <p>Kõik tellimused töödeldakse ja saadetakse välja 1-3 tööpäeva jooksul pärast tellimuse kinnitamist.</p>

                    <h3>3.1. Tarneajad ja -teenused</h3>
                    <p>Kauba kättetoimetamine toimub järgmiselt:</p>
                    <ul>
                      <li>Omniva pakiautomaadid: 1-3 tööpäeva</li>
                      <li>SmartPost pakiautomaadid: 1-3 tööpäeva</li>
                      <li>DPD kulleriga koju: 1-2 tööpäeva</li>
                    </ul>
                    <p>Tarneaeg võib pikeneda erakorralistel juhtudel või kui tellimus sisaldab eritellimusi.</p>

                    <h3>3.2. Tarnekulud</h3>
                    <p>Tarnekulud sõltuvad valitud tarneviisist ja kuvatakse tellimuse vormistamise käigus enne tellimuse kinnitamist.</p>
                  </div>

                  <div className="terms-section">
                    <h2>4. Tagastuspoliitika</h2>
                    <p>Ostjal on õigus e-poest ostetud kaup tagastada 14 päeva jooksul alates kauba kättesaamisest.</p>

                    <h3>4.1. Tagastamise protsess</h3>
                    <ol>
                      <li>Teavitage meid tagastamissoovist e-posti teel aadressil leen@leen.ee.</li>
                      <li>Tagastatav toode peab olema originaalpakendis, kasutamata ja kahjustusteta.</li>
                      <li>Saatke toode tagasi koos ostudokumendiga.</li>
                      <li>Tagastamiskulud kannab Ostja, välja arvatud juhul, kui tagastamise põhjuseks on defektne või vale toode.</li>
                    </ol>

                    <h3>4.2. Raha tagastamine</h3>
                    <p>Tagastame raha 14 päeva jooksul pärast kauba tagastamist, kasutades sama makseviisi, mida kasutati ostu sooritamisel.</p>
                  </div>

                  <div className="terms-section">
                    <h2>5. Pretensioonide esitamine</h2>
                    <p>Ostjal on õigus esitada pretensioone kauba kvaliteedi kohta 2 aasta jooksul alates kauba kättesaamisest.</p>
                    <p>Pretensioonid palume saata e-posti aadressile leen@leen.ee, lisades võimalusel fotod defektidest ja ostudokumendi.</p>
                  </div>

                  <div className="terms-section">
                    <h2>6. Maksete vahendaja</h2>
                    <p>Maksete vahendajaks on Maksekeskus AS. Maksete teostamisel edastatakse Ostja maksekeskuse turvalisse keskkonda. Müüja ei oma ligipääsu Ostja pangaandmetele.</p>
                  </div>

                  <div className="terms-section">
                    <h2>7. Isikuandmete kaitse</h2>
                    <p>Müüja töötleb Ostja isikuandmeid vastavalt <Link to="/privaatsuspoliitika" className="terms-link" onClick={scrollToTop}>privaatsuspoliitikale</Link>.</p>
                  </div>

                  <div className="terms-section">
                    <h2>8. Lõppsätted</h2>
                    <p>Käesolevad müügitingimused kehtivad alates 01.07.2025.</p>
                    <p>Müüjal on õigus müügitingimusi ühepoolselt muuta, avaldades muudetud tingimused veebilehel leen.ee.</p>
                    <p>Müügitingimustega seotud küsimused palume saata e-posti aadressile leen@leen.ee.</p>
                  </div>
                </>
              ) : (
                // English content
                <>
                  <div className="terms-section">
                    <h2>1. General Information</h2>
                    <p>These terms of sale apply to the purchase of goods and services between PopLeen OÜ (hereinafter the Seller) and the customer making a purchase in the e-shop leen.ee (hereinafter the Buyer).</p>
                    
                    <h3>1.1. Company Information</h3>
                    <p>
                      <strong>Company name:</strong> PopLeen OÜ<br />
                      <strong>Registration code:</strong> 16501388<br />
                      <strong>Address:</strong> Keldrimäe, Kuku küla, 79631 Rapla vald, Rapla maakond<br />
                      <strong>Email:</strong> leen@leen.ee<br />
                      <strong>Phone:</strong> +372 5380 1413
                    </p>
                  </div>

                  <div className="terms-section">
                    <h2>2. Purchase Process and Payment Methods</h2>
                    <p>Products can be purchased in the e-shop leen.ee as follows:</p>
                    <ol>
                      <li>Select the desired products and add them to the shopping cart.</li>
                      <li>In the shopping cart, you can check the selected products, their quantities, and prices.</li>
                      <li>To complete the order, click the "Continue to checkout" button.</li>
                      <li>Enter your contact information and delivery address.</li>
                      <li>Choose a suitable payment method.</li>
                      <li>Confirm the order by agreeing to the terms of sale.</li>
                    </ol>

                    <h3>2.1. Payment Methods</h3>
                    <p>The following payment methods are available in the e-shop leen.ee:</p>
                    <ul>
                      <li>Bank card (Visa, Mastercard)</li>
                      <li>Bank link (Swedbank, SEB, LHV, Coop Bank, Luminor)</li>
                    </ul>
                    <p>Payments are processed by Maksekeskus AS. When making payments, the Buyer is redirected to the secure environment of the payment processor.</p>
                  </div>

                  <div className="terms-section">
                    <h2>3. Delivery Information</h2>
                    <p>All orders are processed and shipped within 1-3 business days after order confirmation.</p>

                    <h3>3.1. Delivery Times and Services</h3>
                    <p>Product delivery takes place as follows:</p>
                    <ul>
                      <li>Omniva parcel machines: 1-3 business days</li>
                      <li>SmartPost parcel machines: 1-3 business days</li>
                      <li>DPD courier to home: 1-2 business days</li>
                    </ul>
                    <p>Delivery time may be extended in exceptional cases or if the order contains custom orders.</p>

                    <h3>3.2. Delivery Costs</h3>
                    <p>Delivery costs depend on the chosen delivery method and are displayed during the checkout process before confirming the order.</p>
                  </div>

                  <div className="terms-section">
                    <h2>4. Return Policy</h2>
                    <p>The Buyer has the right to return products purchased from the e-shop within 14 days from the receipt of the goods.</p>

                    <h3>4.1. Return Process</h3>
                    <ol>
                      <li>Notify us of your return request by email at leen@leen.ee.</li>
                      <li>The returned product must be in its original packaging, unused, and undamaged.</li>
                      <li>Send the product back with the purchase document.</li>
                      <li>Return costs are borne by the Buyer, except in cases where the reason for return is a defective or wrong product.</li>
                    </ol>

                    <h3>4.2. Refunds</h3>
                    <p>We will refund the money within 14 days after the return of the goods, using the same payment method that was used to make the purchase.</p>
                  </div>

                  <div className="terms-section">
                    <h2>5. Filing Complaints</h2>
                    <p>The Buyer has the right to file complaints about the quality of the goods within 2 years from the receipt of the goods.</p>
                    <p>Please send complaints to the email address leen@leen.ee, including photos of defects and the purchase document if possible.</p>
                  </div>

                  <div className="terms-section">
                    <h2>6. Payment Processor</h2>
                    <p>Payments are processed by Maksekeskus AS. When making payments, the Buyer is redirected to the secure environment of the payment processor. The Seller does not have access to the Buyer's bank details.</p>
                  </div>

                  <div className="terms-section">
                    <h2>7. Personal Data Protection</h2>
                    <p>The Seller processes the Buyer's personal data in accordance with the <Link to="/privaatsuspoliitika" className="terms-link" onClick={scrollToTop}>Privacy Policy</Link>.</p>
                  </div>

                  <div className="terms-section">
                    <h2>8. Final Provisions</h2>
                    <p>These terms of sale are valid from July 1, 2025.</p>
                    <p>The Seller has the right to unilaterally change the terms of sale by publishing the amended terms on the website leen.ee.</p>
                    <p>Questions related to the terms of sale should be sent to the email address leen@leen.ee.</p>
                  </div>
                </>
              )}
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .terms-content {
          max-width: 800px;
          margin: 48px auto 0;
        }

        .terms-section {
          margin-bottom: 48px;
        }

        .terms-section h2 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-bottom: 24px;
        }

        .terms-section h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--color-text);
          margin: 24px 0 16px;
        }

        .terms-section p {
          margin-bottom: 16px;
          line-height: 1.6;
        }

        .terms-section p:last-child {
          margin-bottom: 0;
        }

        .terms-section ul,
        .terms-section ol {
          margin: 16px 0;
          padding-left: 24px;
        }

        .terms-section li {
          margin-bottom: 8px;
          line-height: 1.6;
        }

        .terms-section li:last-child {
          margin-bottom: 0;
        }

        .terms-link {
          color: var(--color-ultramarine);
          text-decoration: underline;
          transition: opacity 0.2s ease;
        }

        .terms-link:hover {
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .terms-content {
            margin-top: 32px;
          }

          .terms-section {
            margin-bottom: 32px;
          }

          .terms-section h2 {
            font-size: 1.25rem;
            margin-bottom: 16px;
          }

          .terms-section h3 {
            font-size: 1.125rem;
            margin: 16px 0 12px;
          }
        }
      `}</style>
    </>
  );
};

export default Muugitingimused;