import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createCheckoutSession } from '../utils/stripe';
import { parsePriceToAmount, STRIPE_CURRENCY } from '../stripe-config';

const Checkout = () => {
  const { t } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Review, 2: Shipping
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Estonia',
    notes: ''
  });

  // Pre-fill form with user data if available
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (error) setError('');
  };

  const validateForm = () => {
    // Required fields for shipping
    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      setError('Palun täitke kõik kohustuslikud väljad');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Palun sisestage korrektne e-posti aadress');
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
      // Scroll to top when changing steps
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 2) {
      if (validateForm()) {
        handleCheckout();
      }
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
    // Scroll to top when changing steps
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      setError('Ostukorv on tühi');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Prepare items for checkout
      const itemsToCheckout = items.map(item => ({
        name: item.title,
        description: item.description || '',
        amount: parsePriceToAmount(item.price), // Convert price string to cents
        quantity: 1,
        currency: STRIPE_CURRENCY,
        image: item.image // Optional image URL
      }));

      const { data, error: checkoutError } = await createCheckoutSession({
        items: itemsToCheckout,
        success_url: `${window.location.origin}/checkout/success`,
        cancel_url: `${window.location.origin}/checkout`,
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

        <style jsx>{`
          .empty-cart {
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
            padding: 64px 0;
          }

          .empty-cart h1 {
            margin-bottom: 32px;
            color: var(--color-text);
          }

          .btn-primary {
            display: inline-block;
            background-color: var(--color-ultramarine);
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: 500;
            transition: opacity 0.2s ease;
          }

          .btn-primary:hover {
            opacity: 0.9;
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
              <div className="checkout-header">
                <h1>{t('checkout.title')}</h1>
                <div className="checkout-steps">
                  <div className={`step ${step >= 1 ? 'active' : ''}`}>
                    <span className="step-number">1</span>
                    <span className="step-label">Ülevaade</span>
                  </div>
                  <div className="step-divider"></div>
                  <div className={`step ${step >= 2 ? 'active' : ''}`}>
                    <span className="step-number">2</span>
                    <span className="step-label">Tarneinfo</span>
                  </div>
                  <div className="step-divider"></div>
                  <div className="step">
                    <span className="step-number">3</span>
                    <span className="step-label">Makse</span>
                  </div>
                </div>
              </div>
            </FadeInSection>

            <div className="checkout-layout">
              {/* Main Content - Changes based on step */}
              <div className="checkout-main">
                <FadeInSection>
                  {step === 1 ? (
                    <div className="checkout-review">
                      <h2>Tellimuse ülevaade</h2>
                      
                      <div className="order-items">
                        {items.map((item) => (
                          <div key={item.id} className="order-item">
                            <div className="item-image">
                              {item.image ? (
                                <img src={item.image} alt={item.title} />
                              ) : (
                                <div className="no-image">
                                  <span>📷</span>
                                </div>
                              )}
                            </div>
                            <div className="item-details">
                              <h3 className="item-title">{item.title}</h3>
                              <div className="item-meta">
                                {item.category && (
                                  <span className="item-category">{item.category}</span>
                                )}
                                {item.dimensions && item.dimensions.height && (
                                  <span className="item-dimensions">
                                    {item.dimensions.height}×{item.dimensions.width}×{item.dimensions.depth}cm
                                  </span>
                                )}
                              </div>
                              <div className="item-price-row">
                                <span className="item-quantity">1 tk</span>
                                <span className="item-price">{item.price}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="checkout-actions">
                        <Link to="/epood" className="btn btn-secondary">
                          ← Tagasi poodi
                        </Link>
                        <button 
                          onClick={handleNextStep}
                          className="btn btn-primary"
                        >
                          Jätka tarneinfoga →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="checkout-shipping">
                      <h2>Tarneinfo</h2>
                      
                      {error && (
                        <div className="error-message">
                          {error}
                        </div>
                      )}
                      
                      <form className="shipping-form">
                        <div className="form-section">
                          <h3>Kontaktandmed</h3>
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="name">Nimi *</label>
                              <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="form-input"
                                placeholder="Teie täisnimi"
                              />
                            </div>
                          </div>
                          
                          <div className="form-row two-columns">
                            <div className="form-group">
                              <label htmlFor="email">E-post *</label>
                              <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="form-input"
                                placeholder="teie@email.ee"
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="phone">Telefon *</label>
                              <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                                className="form-input"
                                placeholder="+372 5xxx xxxx"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="form-section">
                          <h3>Tarneaadress</h3>
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="address">Aadress *</label>
                              <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                required
                                className="form-input"
                                placeholder="Tänav, maja, korter"
                              />
                            </div>
                          </div>
                          
                          <div className="form-row two-columns">
                            <div className="form-group">
                              <label htmlFor="city">Linn *</label>
                              <input
                                type="text"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                required
                                className="form-input"
                                placeholder="Linn või asula"
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="postalCode">Postiindeks *</label>
                              <input
                                type="text"
                                id="postalCode"
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={handleInputChange}
                                required
                                className="form-input"
                                placeholder="12345"
                              />
                            </div>
                          </div>
                          
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="country">Riik *</label>
                              <select
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                required
                                className="form-input"
                              >
                                <option value="Estonia">Eesti</option>
                                <option value="Finland">Soome</option>
                                <option value="Latvia">Läti</option>
                                <option value="Lithuania">Leedu</option>
                                <option value="Sweden">Rootsi</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="form-section">
                          <h3>Lisainfo</h3>
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="notes">Märkused tellimuse kohta</label>
                              <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="form-input"
                                rows="3"
                                placeholder="Soovid või märkused tellimuse kohta"
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      </form>
                      
                      <div className="checkout-actions">
                        <button 
                          onClick={handlePreviousStep}
                          className="btn btn-secondary"
                        >
                          ← Tagasi ülevaatele
                        </button>
                        <button 
                          onClick={handleNextStep}
                          disabled={isProcessing}
                          className="btn btn-primary"
                        >
                          {isProcessing ? 'Töötlemine...' : 'Jätka maksega →'}
                        </button>
                      </div>
                    </div>
                  )}
                </FadeInSection>
              </div>

              {/* Sidebar - Order Summary */}
              <FadeInSection className="checkout-sidebar">
                <div className="checkout-summary">
                  <h3>Tellimuse kokkuvõte</h3>
                  
                  <div className="summary-items">
                    {items.map((item) => (
                      <div key={item.id} className="summary-item">
                        <span className="summary-item-name">{item.title}</span>
                        <span className="summary-item-price">{item.price}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="summary-divider"></div>
                  
                  <div className="summary-row">
                    <span>Vahesumma</span>
                    <span>{getTotalPrice().toFixed(2)}€</span>
                  </div>
                  
                  <div className="summary-row">
                    <span>Tarne</span>
                    <span>0.00€</span>
                  </div>
                  
                  <div className="summary-total">
                    <span>Kokku</span>
                    <span>{getTotalPrice().toFixed(2)}€</span>
                  </div>
                  
                  {step === 1 && (
                    <button 
                      onClick={handleNextStep}
                      className="summary-checkout-btn"
                    >
                      Jätka tarneinfoga →
                    </button>
                  )}
                  
                  {step === 2 && (
                    <button 
                      onClick={handleNextStep}
                      disabled={isProcessing}
                      className="summary-checkout-btn"
                    >
                      {isProcessing ? 'Töötlemine...' : 'Jätka maksega →'}
                    </button>
                  )}
                  
                  <div className="checkout-info">
                    <div className="info-item">
                      <div className="info-icon">🔒</div>
                      <p>Turvaline makse Stripe'i kaudu</p>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">🚚</div>
                      <p>Tarne 2-4 tööpäeva jooksul</p>
                    </div>
                    <div className="info-item">
                      <div className="info-icon">💌</div>
                      <p>Iga tellimuse juurde käib isiklik märge</p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .checkout-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .checkout-header h1 {
          margin-bottom: 32px;
          color: var(--color-ultramarine);
        }

        .checkout-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #999;
          transition: color 0.3s ease;
        }

        .step.active {
          color: var(--color-ultramarine);
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .step.active .step-number {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .step-label {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .step-divider {
          flex: 1;
          height: 2px;
          background-color: #f0f0f0;
          margin: 0 16px;
          max-width: 80px;
        }

        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 64px;
          align-items: start;
        }

        .checkout-main {
          min-height: 400px;
        }

        .checkout-review h2,
        .checkout-shipping h2 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 500;
          margin-bottom: 32px;
          color: var(--color-ultramarine);
        }

        .order-items {
          margin-bottom: 32px;
        }

        .order-item {
          display: flex;
          gap: 24px;
          padding: 24px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .item-image {
          width: 100px;
          height: 100px;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-image {
          width: 100%;
          height: 100%;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 1.5rem;
        }

        .item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .item-title {
          font-family: var(--font-heading);
          font-size: 1.125rem;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--color-text);
        }

        .item-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 8px;
        }

        .item-category {
          font-size: 0.8rem;
          color: #666;
          background-color: #f0f0f0;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .item-dimensions {
          font-size: 0.8rem;
          color: #666;
        }

        .item-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .item-quantity {
          font-size: 0.9rem;
          color: #666;
        }

        .item-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
          font-size: 1.125rem;
        }

        .checkout-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 48px;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: #f0f0f0;
          color: var(--color-text);
        }

        .btn-secondary:hover {
          background-color: #e0e0e0;
        }

        .checkout-summary {
          background: white;
          border-radius: 8px;
          padding: 32px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          position: sticky;
          top: 32px;
        }

        .checkout-summary h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
        }

        .summary-items {
          margin-bottom: 24px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .summary-item-name {
          font-size: 0.9rem;
          color: var(--color-text);
          max-width: 70%;
        }

        .summary-item-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          font-size: 0.9rem;
        }

        .summary-divider {
          height: 1px;
          background-color: #f0f0f0;
          margin: 16px 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 0.9rem;
          color: #666;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          margin: 24px 0;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 1.125rem;
          color: var(--color-text);
        }

        .summary-checkout-btn {
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
          transition: all 0.2s ease;
          margin-bottom: 24px;
        }

        .summary-checkout-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .summary-checkout-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .checkout-info {
          margin-top: 24px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .info-icon {
          font-size: 1.25rem;
          color: var(--color-ultramarine);
        }

        .info-item p {
          font-size: 0.85rem;
          color: #666;
          margin: 0;
        }

        /* Shipping Form Styles */
        .shipping-form {
          margin-bottom: 32px;
        }

        .form-section {
          margin-bottom: 32px;
        }

        .form-section h3 {
          font-family: var(--font-heading);
          font-size: 1.125rem;
          font-weight: 500;
          margin-bottom: 16px;
          color: var(--color-text);
          padding-bottom: 8px;
          border-bottom: 1px solid #f0f0f0;
        }

        .form-row {
          margin-bottom: 16px;
        }

        .form-row:last-child {
          margin-bottom: 0;
        }

        .form-row.two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          font-size: 0.9rem;
        }

        .form-input {
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: var(--font-body);
          font-size: 1rem;
          transition: border-color 0.2s ease;
          background-color: var(--color-background);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-ultramarine);
          box-shadow: 0 0 0 3px rgba(47, 62, 156, 0.1);
        }

        .form-input::placeholder {
          color: #999;
        }

        textarea.form-input {
          resize: vertical;
          min-height: 80px;
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

        @media (max-width: 1024px) {
          .checkout-layout {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .checkout-sidebar {
            order: -1;
          }

          .checkout-summary {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .checkout-header {
            margin-bottom: 48px;
          }

          .checkout-steps {
            max-width: 100%;
          }

          .step-label {
            font-size: 0.8rem;
          }

          .step-divider {
            margin: 0 8px;
            max-width: 40px;
          }

          .order-item {
            gap: 16px;
          }

          .item-image {
            width: 80px;
            height: 80px;
          }

          .item-title {
            font-size: 1rem;
          }

          .checkout-actions {
            flex-direction: column;
            gap: 16px;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }

          .form-row.two-columns {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;