import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { useCart } from '../context/CartContext';
import { createPayment } from '../utils/maksekeskus';
import { parsePriceToAmount, formatPrice } from '../maksekeskus-config';
import PaymentMethods from '../components/Checkout/PaymentMethods';
import PaymentMethodLogos from '../components/Checkout/PaymentMethodLogos';

const Checkout = () => {
  const { t } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [totalPrice, setTotalPrice] = useState('0.00');
  const [formattedTotalPrice, setFormattedTotalPrice] = useState('0.00');
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
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsError, setTermsError] = useState('');

  // Update total price whenever cart items change
  useEffect(() => {
    const total = getTotalPrice();
    setTotalPrice(total.toFixed(2));
    setFormattedTotalPrice(formatPrice(total));
  }, [items, getTotalPrice]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (error) setError('');
  };

  const handleTermsChange = (e) => {
    setTermsAgreed(e.target.checked);
    if (e.target.checked) {
      setTermsError('');
    }
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

    // Check terms agreement
    if (!termsAgreed) {
      setTermsError(t('checkout.terms.required'));
      return false;
    }
    
    // Check if payment method is selected
    if (!selectedPaymentMethod) {
      setError(t('checkout.payment.method_required'));
      return false;
    }
    
    return true;
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      setError('Ostukorv on tühi');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Create payment
      const { success, payment_url, error: paymentError } = await createPayment(
        {  
          ...formData,
          items: items.map(item => ({
            id: item.id,
            title: item.title,
            price: parsePriceToAmount(item.price),
            quantity: 1
          }))
        },
        selectedPaymentMethod
      );

      if (!success || paymentError) {
        setError(paymentError || 'Maksesessiooni loomine ebaõnnestus');
        setIsProcessing(false);
        return;
      }

      if (payment_url) {
        // Clear cart before redirecting
        await clearCart();
                
        // Redirect after a short delay to ensure cart is cleared
        setTimeout(() => {
          window.location.href = payment_url;
        }, 500);
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
              </div>
            </FadeInSection>

            <div className="checkout-layout">
              {/* Main Content */}
              <div className="checkout-main">
                <FadeInSection>
                  <div className="checkout-form-container">
                    {error && (
                      <div className="error-message">
                        {error}
                      </div>
                    )}
                    
                    <form className="checkout-form">
                      {/* Order Items */}
                      <div className="form-section">
                        <h3>Tellimuse ülevaade</h3>
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
                                <h4 className="item-title">{item.title}</h4>
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
                      </div>
                      
                      {/* Contact Information */}
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
                      
                      {/* Shipping Address */}
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
                      
                      {/* Additional Notes */}
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
                      
                      {/* Payment Methods */}
                      <div className="form-section">
                        <h3>{t('checkout.payment.title')}</h3>
                        <PaymentMethods 
                          amount={parseFloat(totalPrice) || 0.01}
                          onSelectMethod={setSelectedPaymentMethod}
                          selectedMethod={selectedPaymentMethod}
                        />
                        {error && error === t('checkout.payment.method_required') && (
                          <div className="payment-method-error">
                            {error}
                          </div>
                        )}
                      </div>

                      {/* Terms Agreement */}
                      <div className="form-section">
                        <div className="form-row">
                          <div className="form-group terms-checkbox-group">
                            <label className="terms-checkbox-label">
                              <input
                                type="checkbox"
                                checked={termsAgreed}
                                onChange={handleTermsChange}
                                className="terms-checkbox"
                              />
                              <span className="terms-text">
                                {t('checkout.terms.agree')} <Link to="/muugitingimused" target="_blank" className="terms-link">{t('checkout.terms.terms_link')}</Link>
                              </span>
                            </label>
                            {termsError && (
                              <div className="terms-error">
                                {termsError}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Submit Button */}
                      <div className="form-actions">
                        <Link to="/epood" className="btn btn-secondary">
                          ← Tagasi poodi
                        </Link>
                        <button 
                          type="button"
                          onClick={handleCheckout}
                          disabled={isProcessing}
                          className="btn btn-primary"
                        >
                          {isProcessing ? 'Töötlemine...' : 'Vormista tellimus'}
                        </button>
                      </div>
                    </form>
                  </div>
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
                    <span>{formattedTotalPrice}</span>
                  </div>
                  
                  <div className="summary-row">
                    <span>Tarne</span>
                    <span>0.00€</span>
                  </div>
                  
                  <div className="summary-total">
                    <span>Kokku</span>
                    <span>{formattedTotalPrice}</span>
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="summary-checkout-btn"
                  >
                    {isProcessing ? 'Töötlemine...' : 'Vormista tellimus'}
                  </button>
                  
                  <div className="checkout-info">
                    <div className="info-item">
                      <div className="info-icon">🔒</div>
                      <p>Turvaline makse Maksekeskuse kaudu</p>
                    </div>
                    <PaymentMethodLogos />
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
          margin-bottom: 48px;
        }

        .checkout-header h1 {
          color: var(--color-ultramarine);
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

        .checkout-form-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 32px;
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

        .form-section {
          margin-bottom: 32px;
          padding-bottom: 32px;
          border-bottom: 1px solid #f0f0f0;
        }

        .form-section:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .form-section h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
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

        .order-items {
          margin-bottom: 16px;
        }

        .order-item {
          display: flex;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .item-image {
          width: 80px;
          height: 80px;
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
          font-size: 1rem;
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

        .terms-checkbox-group {
          margin-top: 8px;
        }

        .terms-checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
        }

        .terms-checkbox {
          margin-top: 3px;
          width: 18px;
          height: 18px;
          accent-color: var(--color-ultramarine);
        }

        .terms-text {
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .terms-link {
          color: var(--color-ultramarine);
          text-decoration: underline;
          transition: opacity 0.2s ease;
        }

        .terms-link:hover {
          opacity: 0.8;
        }

        .terms-error {
          color: #c33;
          font-size: 0.85rem;
          margin-top: 8px;
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
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
        
        .payment-method-error {
          color: #c33;
          font-size: 0.85rem;
          margin-top: 8px;
          padding: 8px 12px;
          background-color: #fee;
          border-radius: 4px;
          border: 1px solid #fcc;
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
            margin-bottom: 32px;
          }

          .checkout-form-container {
            padding: 24px;
          }

          .form-row.two-columns {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .form-actions {
            flex-direction: column;
            gap: 16px;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }

          .order-item {
            flex-direction: column;
            gap: 12px;
          }

          .item-image {
            width: 100%;
            height: 160px;
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;