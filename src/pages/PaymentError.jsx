import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const PaymentError = () => {
  const { t } = useTranslation();

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
              <div className="error-content">
                <div className="error-icon">⚠️</div>
                <h1>{t('checkout.payment.error_title')}</h1>
                <p>{t('checkout.payment.error_message')}</p>
                
                <div className="error-actions">
                  <Link to="/checkout" className="btn btn-primary" onClick={scrollToTop}>
                    {t('checkout.payment.try_again')}
                  </Link>
                  <Link to="/epood" className="btn btn-secondary" onClick={scrollToTop}>
                    {t('checkout.payment.back_to_shop')}
                  </Link>
                </div>

                <div className="contact-info">
                  <h4>{t('checkout.payment.questions')}</h4>
                  <p>{t('checkout.payment.contact_text')}</p>
                  <p>
                    <a href="mailto:leen@leen.ee" className="contact-link">leen@leen.ee</a> {t('checkout.payment.or')} 
                    <a href="tel:+37253801413" className="contact-link">+372 5380 1413</a>
                  </p>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .error-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 24px;
          color: #ffc107;
        }

        .error-content h1 {
          color: var(--color-text);
          margin-bottom: 16px;
        }

        .error-content > p {
          margin-bottom: 32px;
          color: #666;
          font-size: 1.125rem;
        }

        .error-actions {
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
          .error-actions {
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

export default PaymentError;