import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Muugitingimused = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead page="terms" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <h1 className="text-center">Müügitingimused</h1>
            </FadeInSection>

            <FadeInSection className="terms-content">
              <div className="terms-section">
                <h2>1. Üldinfo</h2>
                <p>Käesolevad müügitingimused kehtivad PopLeen OÜ (edaspidi Müüja) ja e-poes leen.ee ostu sooritava kliendi (edaspidi Ostja) vahel kaupade ja teenuste ostmisel.</p>
                
                <h3>1.1. Ettevõtte andmed</h3>
                <p>
                  <strong>Ettevõtte nimi:</strong> PopLeen OÜ<br />
                  <strong>Registrikood:</strong> 16501388<br />
                  <strong>KMKR:</strong> EE102458454<br />
                  <strong>Aadress:</strong> Jõeääre, Märjamaa vald, Rapla maakond, 78201<br />
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
                <p>Müüja töötleb Ostja isikuandmeid vastavalt <Link to="/privaatsuspoliitika" className="terms-link">privaatsuspoliitikale</Link>.</p>
              </div>

              <div className="terms-section">
                <h2>8. Lõppsätted</h2>
                <p>Käesolevad müügitingimused kehtivad alates 01.07.2025.</p>
                <p>Müüjal on õigus müügitingimusi ühepoolselt muuta, avaldades muudetud tingimused veebilehel leen.ee.</p>
                <p>Müügitingimustega seotud küsimused palume saata e-posti aadressile leen@leen.ee.</p>
              </div>
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