import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const PaymentCancelled = () => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  useEffect(() => {
    // Get status from URL
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    
    // Map status to reason
    const reasonMap = {
      'cancelled': t('checkout.payment.cancelled_by_user'),
      'expired': t('checkout.payment.expired'),
      'failed': t('checkout.payment.failed')
    };
    
    setReason(reasonMap[status] || t('checkout.payment.cancelled_unknown'));
  }, [t]);

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
              <div className="cancelled-content">
                <div className="cancelled-icon">❌</div>
                <h1>{t('checkout.payment.cancelled_title')}</h1>
                <p>{reason}</p>
                
                <div className="cancelled-actions">
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
        .cancelled-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .cancelled-icon {
          font-size: 4rem;
          margin-bottom: 24px;
          color: #dc3545;
        }

        .cancelled-content h1 {
          color: var(--color-text);
          margin-bottom: 16px;
        }

        .cancelled-content > p {
          margin-bottom: 32px;
          color: #666;
          font-size: 1.125rem;
        }

        .cancelled-actions {
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
          .cancelled-actions {
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

export default PaymentCancelled;