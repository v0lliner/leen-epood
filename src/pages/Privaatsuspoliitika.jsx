import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Privaatsuspoliitika = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead page="privacy" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <h1 className="text-center">Privaatsuspoliitika</h1>
            </FadeInSection>

            <FadeInSection className="privacy-content">
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
                  <li>Makseteenuse pakkujad (maksete töötlemiseks)</li>
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