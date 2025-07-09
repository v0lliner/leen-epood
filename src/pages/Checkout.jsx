import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { Link } from 'react-router-dom';

const Checkout = () => {
  const { t } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Estonia',
    deliveryMethod: 'omniva-parcel-machine',
    omnivaParcelMachineId: '',
    omnivaParcelMachineName: '',
    termsAccepted: false
  });
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [omnivaLocations, setOmnivaLocations] = useState([]);
  const [loadingOmniva, setLoadingOmniva] = useState(false);
  const [omnivaError, setOmnivaError] = useState('');
  
  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/epood');
    }
  }, [items, navigate]);
  
  // Load Omniva locations when country changes
  useEffect(() => {
    if (formData.deliveryMethod === 'omniva-parcel-machine') {
      loadOmnivaLocations();
    }
  }, [formData.country, formData.deliveryMethod]);
  
  const loadOmnivaLocations = async () => {
    try {
      setLoadingOmniva(true);
      setOmnivaError('');
      
      // Map country names to country codes
      const countryCodeMap = {
        'Estonia': 'ee',
        'Latvia': 'lv',
        'Lithuania': 'lt',
        'Finland': 'fi'
      };
      
      const countryCode = countryCodeMap[formData.country] || 'ee';
      
      const response = await fetch(`/php/get-omniva-parcel-machines.php?country=${countryCode}`);
      
      if (!response.ok) {
        throw new Error(t('checkout.shipping.omniva.fetch_error'));
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOmnivaLocations(data.parcelMachines || []);
      } else {
        throw new Error(data.error || t('checkout.shipping.omniva.fetch_error'));
      }
    } catch (error) {
      console.error('Error loading Omniva locations:', error);
      setOmnivaError(error.message);
    } finally {
      setLoadingOmniva(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
    
    // Special handling for Omniva parcel machine selection
    if (name === 'omnivaParcelMachineId') {
      const selectedMachine = omnivaLocations.find(machine => machine.id === value);
      if (selectedMachine) {
        setFormData(prev => ({
          ...prev,
          omnivaParcelMachineId: value,
          omnivaParcelMachineName: selectedMachine.name
        }));
      }
    }
  };
  
  const validateForm = () => {
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError(t('checkout.error.required_fields'));
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('checkout.error.invalid_email'));
      return false;
    }
    
    // Delivery method validation
    if (formData.deliveryMethod === 'omniva-parcel-machine' && !formData.omnivaParcelMachineId) {
      setError(t('checkout.shipping.omniva.required'));
      return false;
    }
    
    // Terms acceptance validation
    if (!formData.termsAccepted) {
      setError(t('checkout.terms.required'));
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Generate a unique reference for this order
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const reference = `order-${timestamp}-${randomString}`;
      
      // Prepare payment data
      const paymentData = {
        amount: getTotalPrice().toFixed(2),
        reference,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: formData.country,
        paymentMethod: 'lhv', // Default to LHV bank
        deliveryMethod: formData.deliveryMethod,
        omnivaParcelMachineId: formData.omnivaParcelMachineId,
        omnivaParcelMachineName: formData.omnivaParcelMachineName,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price.replace('€', '')),
          quantity: 1
        }))
      };
      
      console.log('Sending payment request with data:', paymentData);
      
      // Send request to payment processor
      const response = await fetch('/php/process-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment processing error:', errorText);
        throw new Error(t('checkout.error.session_failed'));
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Redirect to payment URL
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        throw new Error('No payment URL returned');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.message || t('checkout.error.network_error'));
      setIsSubmitting(false);
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Calculate shipping cost
  const getShippingCost = () => {
    switch (formData.deliveryMethod) {
      case 'omniva-parcel-machine':
        return 3.99;
      case 'smartpost-parcel-machine':
        return 3.99;
      case 'courier':
        return 5.99;
      default:
        return 0;
    }
  };
  
  // Calculate total with shipping
  const getTotalWithShipping = () => {
    return getTotalPrice() + getShippingCost();
  };
  
  if (items.length === 0) {
    return (
      <>
        <SEOHead page="shop" />
        <main>
          <section className="section-large">
            <div className="container">
              <div className="empty-cart">
                <h1>{t('cart.empty')}</h1>
                <Link to="/epood" className="btn btn-primary" onClick={scrollToTop}>
                  {t('cart.back_to_shop')}
                </Link>
              </div>
            </div>
          </section>
        </main>
        <style jsx>{`
          .empty-cart {
            text-align: center;
            padding: 64px 0;
          }
          
          .empty-cart h1 {
            margin-bottom: 32px;
          }
          
          .btn-primary {
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
              <h1 className="text-center">{t('checkout.title')}</h1>
            </FadeInSection>

            <div className="checkout-layout">
              {/* Checkout Form */}
              <div className="checkout-form-section">
                <form onSubmit={handleSubmit} className="checkout-form">
                  {/* Contact Information */}
                  <div className="form-section">
                    <h2>{t('checkout.shipping.contact.title')}</h2>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="firstName">{t('checkout.shipping.contact.name')} *</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder={t('checkout.shipping.contact.name_placeholder')}
                          required
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="lastName">{t('checkout.shipping.contact.name')} *</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder={t('checkout.shipping.contact.name_placeholder')}
                          required
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="email">{t('checkout.shipping.contact.email')} *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder={t('checkout.shipping.contact.email_placeholder')}
                          required
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="phone">{t('checkout.shipping.contact.phone')} *</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder={t('checkout.shipping.contact.phone_placeholder')}
                          required
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Shipping Method */}
                  <div className="form-section">
                    <h2>{t('checkout.shipping.title')}</h2>
                    
                    <div className="shipping-methods">
                      <div className="shipping-method">
                        <label className="shipping-method-label">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value="omniva-parcel-machine"
                            checked={formData.deliveryMethod === 'omniva-parcel-machine'}
                            onChange={handleInputChange}
                            className="shipping-method-input"
                          />
                          <div className="shipping-method-content">
                            <div className="shipping-method-info">
                              <h3>{t('checkout.shipping.omniva.title')}</h3>
                              <p>{t('checkout.shipping.omniva.description')}</p>
                            </div>
                            <div className="shipping-method-price">
                              {t('checkout.shipping.omniva.price')}
                            </div>
                          </div>
                        </label>
                        
                        {formData.deliveryMethod === 'omniva-parcel-machine' && (
                          <div className="shipping-method-details">
                            <div className="form-group">
                              <label htmlFor="country">{t('checkout.shipping.address.country')}</label>
                              <select
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                className="form-input"
                              >
                                <option value="Estonia">{t('checkout.shipping.address.countries.estonia')}</option>
                                <option value="Latvia">{t('checkout.shipping.address.countries.latvia')}</option>
                                <option value="Lithuania">{t('checkout.shipping.address.countries.lithuania')}</option>
                                <option value="Finland">{t('checkout.shipping.address.countries.finland')}</option>
                              </select>
                            </div>
                            
                            <div className="form-group">
                              <label htmlFor="omnivaParcelMachineId">{t('checkout.shipping.omniva.select_machine')} *</label>
                              {loadingOmniva ? (
                                <div className="loading-text">{t('checkout.shipping.omniva.loading')}</div>
                              ) : omnivaError ? (
                                <div className="error-text">{omnivaError}</div>
                              ) : omnivaLocations.length === 0 ? (
                                <div className="info-text">{t('checkout.shipping.omniva.no_machines')}</div>
                              ) : (
                                <select
                                  id="omnivaParcelMachineId"
                                  name="omnivaParcelMachineId"
                                  value={formData.omnivaParcelMachineId}
                                  onChange={handleInputChange}
                                  className="form-input"
                                  required={formData.deliveryMethod === 'omniva-parcel-machine'}
                                >
                                  <option value="">{t('checkout.shipping.omniva.select_placeholder')}</option>
                                  {omnivaLocations.map(machine => (
                                    <option key={machine.id} value={machine.id}>
                                      {machine.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Terms and Conditions */}
                  <div className="form-section">
                    <div className="form-group terms-group">
                      <label className="terms-label">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={handleInputChange}
                          className="terms-checkbox"
                          required
                        />
                        <span>
                          {t('checkout.terms.agree')} <Link to="/muugitingimused" target="_blank" className="terms-link">{t('checkout.terms.terms_link')}</Link>
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  {error && (
                    <div className="error-message">
                      {error}
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <div className="form-actions">
                    <Link to="/epood" className="btn btn-secondary" onClick={scrollToTop}>
                      {t('checkout.review.back_to_shop')}
                    </Link>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                    >
                      {isSubmitting ? t('checkout.summary.processing') : t('checkout.summary.pay')}
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Order Summary */}
              <div className="order-summary-section">
                <div className="order-summary">
                  <h2>{t('checkout.summary.title')}</h2>
                  
                  <div className="order-items">
                    {items.map((item) => (
                      <div key={item.id} className="order-item">
                        <div className="item-image">
                          <img src={item.image} alt={item.title} />
                        </div>
                        <div className="item-details">
                          <h3 className="item-title">{item.title}</h3>
                          <p className="item-price">{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="order-totals">
                    <div className="total-row">
                      <span>{t('checkout.summary.subtotal')}</span>
                      <span>{getTotalPrice().toFixed(2)}€</span>
                    </div>
                    <div className="total-row">
                      <span>{t('checkout.summary.shipping')}</span>
                      <span>{getShippingCost().toFixed(2)}€</span>
                    </div>
                    <div className="total-row grand-total">
                      <span>{t('checkout.summary.total')}</span>
                      <span>{getTotalWithShipping().toFixed(2)}€</span>
                    </div>
                  </div>
                  
                  <div className="order-info">
                    <div className="info-item">
                      <span className="info-icon">🔒</span>
                      <span>{t('checkout.summary.info.secure')}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">🚚</span>
                      <span>{t('checkout.summary.info.shipping')}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">✉️</span>
                      <span>{t('checkout.summary.info.personal')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 48px;
          margin-top: 48px;
        }
        
        .checkout-form-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 32px;
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
        
        .form-section h2 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-bottom: 24px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }
        
        .form-group:last-child {
          margin-bottom: 0;
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
        }
        
        .form-input:focus {
          outline: none;
          border-color: var(--color-ultramarine);
          box-shadow: 0 0 0 3px rgba(47, 62, 156, 0.1);
        }
        
        .shipping-methods {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .shipping-method {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }
        
        .shipping-method:hover {
          border-color: var(--color-ultramarine);
        }
        
        .shipping-method-label {
          display: flex;
          cursor: pointer;
          width: 100%;
        }
        
        .shipping-method-input {
          position: absolute;
          opacity: 0;
        }
        
        .shipping-method-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          width: 100%;
          background-color: #f8f9fa;
          transition: background-color 0.2s ease;
        }
        
        .shipping-method-input:checked + .shipping-method-content {
          background-color: rgba(47, 62, 156, 0.1);
        }
        
        .shipping-method-info {
          flex: 1;
        }
        
        .shipping-method-info h3 {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 500;
          color: var(--color-text);
          margin-bottom: 4px;
        }
        
        .shipping-method-info p {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
        }
        
        .shipping-method-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
        }
        
        .shipping-method-details {
          padding: 16px;
          border-top: 1px solid #eee;
          background-color: white;
        }
        
        .loading-text,
        .error-text,
        .info-text {
          padding: 12px;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        
        .loading-text {
          background-color: #f8f9fa;
          color: #666;
        }
        
        .error-text {
          background-color: #fee;
          color: #c33;
        }
        
        .info-text {
          background-color: #e6f7ff;
          color: #0c5460;
        }
        
        .terms-group {
          margin-bottom: 0;
        }
        
        .terms-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
        }
        
        .terms-checkbox {
          margin-top: 3px;
        }
        
        .terms-link {
          color: var(--color-ultramarine);
          text-decoration: underline;
          transition: opacity 0.2s ease;
        }
        
        .terms-link:hover {
          opacity: 0.8;
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
        
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .btn {
          padding: 12px 24px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          transition: opacity 0.2s ease;
          text-decoration: none;
          display: inline-block;
          text-align: center;
          border: none;
          cursor: pointer;
        }
        
        .btn:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        
        .order-summary-section {
          align-self: start;
          position: sticky;
          top: 32px;
        }
        
        .order-summary {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }
        
        .order-summary h2 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .order-items {
          margin-bottom: 24px;
          max-height: 320px;
          overflow-y: auto;
          padding-right: 8px;
        }
        
        .order-item {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .order-item:last-child {
          border-bottom: none;
        }
        
        .item-image {
          width: 64px;
          height: 64px;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .item-details {
          flex: 1;
          min-width: 0;
        }
        
        .item-title {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 400;
          color: var(--color-text);
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .item-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
          margin: 0;
        }
        
        .order-totals {
          padding: 24px 0;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 24px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 0.95rem;
        }
        
        .total-row:last-child {
          margin-bottom: 0;
        }
        
        .grand-total {
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 1.125rem;
          color: var(--color-ultramarine);
          padding-top: 12px;
          margin-top: 12px;
          border-top: 1px solid #f0f0f0;
        }
        
        .order-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #666;
        }
        
        .info-icon {
          font-size: 1rem;
        }
        
        @media (max-width: 1024px) {
          .checkout-layout {
            grid-template-columns: 1fr 350px;
            gap: 32px;
          }
        }
        
        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          
          .order-summary-section {
            position: static;
            order: -1;
          }
          
          .form-row {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }
          
          .form-actions {
            flex-direction: column;
            gap: 16px;
          }
          
          .btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;