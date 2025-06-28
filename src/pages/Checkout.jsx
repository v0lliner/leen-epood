import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const { t } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCart();
  const [isCompleted, setIsCompleted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulate payment processing
    console.log('Order submitted:', {
      items,
      customer: formData,
      total: getTotalPrice()
    });
    
    // Clear cart and show thank you message
    clearCart();
    setIsCompleted(true);
  };

  if (items.length === 0 && !isCompleted) {
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

  if (isCompleted) {
    return (
      <>
        <SEOHead page="shop" />
        <main>
          <section className="section-large">
            <div className="container">
              <FadeInSection>
                <div className="thank-you">
                  <h1>{t('checkout.thank_you.title')}</h1>
                  <p>{t('checkout.thank_you.message')}</p>
                  <Link to="/epood" className="btn btn-primary">
                    {t('checkout.thank_you.back_to_shop')}
                  </Link>
                </div>
              </FadeInSection>
            </div>
          </section>
        </main>

        <style jsx>{`
          .thank-you {
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
          }

          .thank-you h1 {
            color: var(--color-ultramarine);
            margin-bottom: 24px;
          }

          .thank-you p {
            margin-bottom: 32px;
            color: #666;
          }
        `}</style>
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
              <FadeInSection className="checkout-form-section">
                <form onSubmit={handleSubmit} className="checkout-form">
                  <div className="form-group">
                    <label htmlFor="name">{t('checkout.form.name')}</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">{t('checkout.form.email')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="address">{t('checkout.form.address')}</label>
                    <textarea
                      id="address"
                      name="address"
                      rows="3"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    ></textarea>
                  </div>
                  
                  <button type="submit" className="btn btn-primary pay-button">
                    {t('checkout.form.pay')}
                  </button>
                </form>
              </FadeInSection>

              <FadeInSection className="order-summary-section">
                <div className="order-summary">
                  <h3>{t('checkout.summary')}</h3>
                  
                  <div className="order-items">
                    {items.map((item) => (
                      <div key={item.id} className="order-item">
                        <div className="item-info">
                          <span className="item-name">{item.title}</span>
                          <span className="item-quantity">× {item.quantity}</span>
                        </div>
                        <span className="item-price">{item.price}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="order-total">
                    <strong>{t('checkout.total')}: {getTotalPrice().toFixed(2)}€</strong>
                  </div>
                </div>
              </FadeInSection>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          margin-top: 64px;
          align-items: start;
        }

        .checkout-form {
          max-width: 500px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: var(--font-body);
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-ultramarine);
        }

        .form-input[type="textarea"] {
          resize: vertical;
          min-height: 80px;
        }

        .pay-button {
          width: 100%;
          padding: 16px;
          font-size: 1rem;
          font-weight: 500;
          text-align: center;
        }

        .order-summary {
          padding: 32px;
          border: 1px solid #f0f0f0;
          border-radius: 4px;
        }

        .order-summary h3 {
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
          .checkout-layout {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .checkout-form {
            max-width: none;
          }

          .order-summary {
            padding: 24px;
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;