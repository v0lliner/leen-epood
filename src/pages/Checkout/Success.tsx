import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import SEOHead from '../../components/Layout/SEOHead';
import FadeInSection from '../../components/UI/FadeInSection';

const CheckoutSuccess = () => {
  const { t } = useTranslation();
  const { clearCart } = useCart();
  
  // Clear the cart when the success page loads
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="success-container">
                <div className="success-icon">✅</div>
                <h1>{t('checkout.thank_you.title')}</h1>
                <p>{t('checkout.thank_you.message')}</p>
                <Link 
                  to="/epood"
                  className="back-to-shop-btn"
                >
                  {t('checkout.thank_you.back_to_shop')}
                </Link>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>
      
      <style jsx>{`
        .success-container {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          padding: 48px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        
        .success-icon {
          font-size: 4rem;
          margin-bottom: 24px;
          color: #28a745;
        }
        
        .success-container h1 {
          color: var(--color-ultramarine);
          margin-bottom: 24px;
        }
        
        .success-container p {
          margin-bottom: 32px;
          font-size: 1.125rem;
          line-height: 1.6;
          color: #666;
        }
        
        .back-to-shop-btn {
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
        
        .back-to-shop-btn:hover {
          opacity: 0.9;
        }
      `}</style>
    </>
  );
};

export default CheckoutSuccess;