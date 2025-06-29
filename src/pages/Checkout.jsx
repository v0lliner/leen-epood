import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createCheckoutSession } from '../utils/stripe';
import { getStripeProductByPriceId } from '../stripe-config';

const Checkout = () => {
  const { t } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admin/login?redirect=/checkout', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/admin/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      setError('Ostukorv on tühi');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // For now, we'll handle single item checkout
      // In a real implementation, you might want to create a single checkout session
      // with multiple line items or handle each item separately
      const firstItem = items[0];
      
      // Find the corresponding Stripe product
      const stripeProduct = getStripeProductByPriceId(firstItem.priceId);
      
      if (!stripeProduct) {
        setError('Toode ei ole saadaval makseks');
        setIsProcessing(false);
        return;
      }

      const { data, error: checkoutError } = await createCheckoutSession({
        priceId: stripeProduct.priceId,
        mode: stripeProduct.mode,
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout`,
      });

      if (checkoutError) {
        setError(checkoutError);
        setIsProcessing(false);
        return;
      }

      if (data?.url) {
        // Clear cart before redirecting
        await clearCart();
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        setError('Maksesessiooni loomine ebaõnnestus');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Maksesessiooni loomine ebaõnnestus');
      setIsProcessing(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <>
        <SEOHead page="shop" />
        <main>
          <section className="section-large">
            <div className="container">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Laadin...</p>
              </div>
            </div>
          </section>
        </main>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <SEOHead page="shop" />
        <main>
          <section className="section-large">
            <div className="container">
              <FadeInSection>
                <div className="empty-cart">
                  <h1>{t('cart.empty')}</h1>
                  <Link to="/epood" className="btn btn-primary">
                    {t('cart.back_to_shop')}
                  </Link>
                </div>
              </FadeInSection>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <h1 className="text-center">{t('checkout.title')}</h1>
            </FadeInSection>

            <div className="checkout-layout">
              <FadeInSection className="checkout-summary-section">
                <div className="checkout-summary">
                  <h3>{t('checkout.summary')}</h3>
                  
                  <div className="order-items">
                    {items.map((item) => (
                      <div key={item.id} className="order-item">
                        <div className="item-info">
                          <span className="item-name">{item.title}</span>
                          <span className="item-quantity">× 1</span>
                        </div>
                        <span className="item-price">{item.price}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="order-total">
                    <strong>{t('checkout.total')}: {getTotalPrice().toFixed(2)}€</strong>
                  </div>

                  {error && (
                    <div className="error-message">
                      {error}
                    </div>
                  )}

                  <button 
                    onClick={handleCheckout}
                    disabled={isProcessing || items.length === 0}
                    className="checkout-button"
                  >
                    {isProcessing ? 'Töötlemine...' : t('checkout.form.pay')}
                  </button>

                  <div className="checkout-info">
                    <p>Teid suunatakse turvalisele Stripe makseleheküljele.</p>
                  </div>
                </div>
              </FadeInSection>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--color-ultramarine);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .checkout-layout {
          display: flex;
          justify-content: center;
          margin-top: 64px;
        }

        .checkout-summary {
          max-width: 500px;
          padding: 32px;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          background: white;
        }

        .checkout-summary h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
        }

        .order-items {
          margin-bottom: 24px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-name {
          font-weight: 500;
          color: var(--color-text);
        }

        .item-quantity {
          font-size: 0.9rem;
          color: #666;
        }

        .item-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
        }

        .order-total {
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
          font-family: var(--font-heading);
          font-size: 1.125rem;
          text-align: right;
          color: var(--color-text);
          margin-bottom: 24px;
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #fcc;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }

        .checkout-button {
          width: 100%;
          padding: 16px;
          background-color: var(--color-ultramarine);
          color: white;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s ease;
          margin-bottom: 16px;
        }

        .checkout-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .checkout-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .checkout-info {
          text-align: center;
        }

        .checkout-info p {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .empty-cart {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .empty-cart h1 {
          margin-bottom: 32px;
          color: var(--color-text);
        }

        @media (max-width: 768px) {
          .checkout-summary {
            padding: 24px;
            margin: 0 16px;
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;