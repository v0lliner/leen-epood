import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/Layout/SEOHead';
import FadeInSection from '../../components/UI/FadeInSection';

const CheckoutCancel = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="cancel-container">
                <div className="cancel-icon">❌</div>
                <h1>{t('checkout.payment.cancelled_title')}</h1>
                <p>{t('checkout.payment.cancelled_by_user')}</p>
                <div className="cancel-actions">
                  <Link 
                    to="/epood"
                    className="back-to-shop-btn"
                  >
                    {t('checkout.payment.back_to_shop')}
                  </Link>
                  <Link 
                    to="/checkout"
                    className="try-again-btn"
                  >
                    {t('checkout.payment.try_again')}
                  </Link>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>
      
      <style jsx>{`
        .cancel-container {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          padding: 48px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        
        .cancel-icon {
          font-size: 4rem;
          margin-bottom: 24px;
          color: #dc3545;
        }
        
        .cancel-container h1 {
          color: var(--color-ultramarine);
          margin-bottom: 24px;
        }
        
        .cancel-container p {
          margin-bottom: 32px;
          font-size: 1.125rem;
          line-height: 1.6;
          color: #666;
        }
        
        .cancel-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        
        .back-to-shop-btn {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s ease;
          display: inline-block;
          text-decoration: none;
        }
        
        .try-again-btn {
          background-color: var(--color-ultramarine);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s ease;
          display: inline-block;
          text-decoration: none;
        }
        
        .back-to-shop-btn:hover,
        .try-again-btn:hover {
          opacity: 0.9;
        }
        
        @media (max-width: 480px) {
          .cancel-actions {
            flex-direction: column;
            gap: 12px;
          }
          
          .back-to-shop-btn,
          .try-again-btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default CheckoutCancel;