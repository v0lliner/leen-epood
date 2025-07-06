import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { useLocation } from 'react-router-dom';

const CheckoutSuccess = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  // Extract order details from location state if available
  const orderDetails = location.state?.orderDetails || {};
  const { deliveryMethod, selectedTerminal } = orderDetails;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="success-content">
                <div className="success-icon">✅</div>
                <h1>Aitäh teie ostu eest!</h1>
                <p>Teie tellimus on edukalt vormistatud.</p>
                
                <div className="order-info">
                  <p>Saadame teile peagi tellimuse kinnituse e-kirja{deliveryMethod === 'smartpost' && selectedTerminal ? 
                    ` ja teavitame, kui teie tellimus on jõudnud valitud Smartposti pakiautomaati.` : 
                    `.`}</p>
                </div>

                <div className="success-actions">
                  <Link to="/epood" className="btn btn-primary" onClick={scrollToTop}>
                    Jätka ostlemist
                  </Link>
                  <Link to="/" className="btn btn-secondary" onClick={scrollToTop}>
                    Tagasi avalehele
                  </Link>
                </div>

                <div className="contact-info">
                  <h4>Küsimused?</h4>
                  <p>Kui teil on küsimusi tellimuse kohta, võtke meiega ühendust:</p>
                  <p>
                    <a href="mailto:leen@leen.ee" className="contact-link">leen@leen.ee</a> või 
                    <a href="tel:+37253801413" className="contact-link">+372 5380 1413</a>
                  </p>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .success-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .success-icon {
          font-size: 4rem;
          margin-bottom: 24px;
        }

        .success-content h1 {
          color: var(--color-ultramarine);
          margin-bottom: 16px;
        }

        .success-content > p {
          margin-bottom: 32px;
          color: #666;
          font-size: 1.125rem;
        }

        .order-info {
          background: #f8f9fa;
          padding: 24px;
          border-radius: 8px;
          margin: 32px 0;
        }

        .order-info p {
          color: #666;
          font-size: 1rem;
          margin: 0;
        }

        .success-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin: 48px 0;
          flex-wrap: wrap;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-family: var(--font-body);
          font-weight: 500;
          transition: opacity 0.2s ease;
          display: inline-block;
        }

        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn:hover {
          opacity: 0.9;
        }

        .contact-info {
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid #f0f0f0;
        }

        .contact-info h4 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 16px;
          font-size: 1.125rem;
        }

        .contact-info p {
          color: #666;
          margin-bottom: 8px;
          line-height: 1.6;
        }

        .contact-link {
          color: var(--color-ultramarine);
          text-decoration: none;
          font-weight: 500;
          margin: 0 4px;
        }

        .contact-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .success-actions {
            flex-direction: column;
            align-items: center;
          }

          .btn {
            width: 200px;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
};

export default CheckoutSuccess;