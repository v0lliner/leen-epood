import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Checkout = () => {
  const { t } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [step, setStep] = useState('review');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parcelMachines, setParcelMachines] = useState([]);
  const [parcelMachinesLoading, setParcelMachinesLoading] = useState(false);
  const [omnivaShippingPrice, setOmnivaShippingPrice] = useState(3.99);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Estonia',
    deliveryMethod: 'omniva-parcel-machine',
    omnivaParcelMachineId: '',
    omnivaParcelMachineName: '',
    notes: '',
    termsAccepted: false
  });

  useEffect(() => {
    // Redirect to shop if cart is empty
    if (items.length === 0) {
      navigate('/epood');
    }
    
    // Load Omniva settings from localStorage
    const omnivaSettings = localStorage.getItem('omnivaSettings');
    if (omnivaSettings) {
      try {
        const parsedSettings = JSON.parse(omnivaSettings);
        if (parsedSettings.shipping_price) {
          setOmnivaShippingPrice(parseFloat(parsedSettings.shipping_price));
        }
      } catch (error) {
        console.error('Error parsing Omniva settings:', error);
      }
    }
    
    // Load parcel machines when delivery method is selected
    if (formData.deliveryMethod === 'omniva-parcel-machine') {
      loadParcelMachines();
    }
  }, [items, navigate, formData.deliveryMethod, formData.country]);

  const loadParcelMachines = async () => {
    setParcelMachinesLoading(true);
    setError('');
    
    try {
      // Map country names to country codes for the API
      const countryCodeMap = {
        'Estonia': 'ee',
        'Latvia': 'lv',
        'Lithuania': 'lt',
        'Finland': 'fi'
      };
      
      const countryCode = countryCodeMap[formData.country] || 'ee';
      
      const response = await fetch(`/php/get-omniva-parcel-machines.php?country=${countryCode}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load parcel machines: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setParcelMachines(data.parcelMachines || []);
      } else {
        throw new Error(data.error || 'Failed to load parcel machines');
      }
    } catch (error) {
      console.error('Error loading parcel machines:', error);
      setError(t('checkout.shipping.omniva.fetch_error'));
    } finally {
      setParcelMachinesLoading(false);
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
    
    // Special handling for parcel machine selection
    if (name === 'omnivaParcelMachineId') {
      const selectedMachine = parcelMachines.find(machine => machine.id === value);
      if (selectedMachine) {
        setFormData(prev => ({
          ...prev,
          omnivaParcelMachineName: selectedMachine.name
        }));
      }
    }
  };

  const validateForm = () => {
    // Basic validation for review step - nothing to validate
    if (step === 'review') return true;
    
    // Validation for shipping step
    if (step === 'shipping') {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        setError(t('checkout.error.required_fields'));
        return false;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError(t('checkout.error.invalid_email'));
        return false;
      }
      
      // Validate delivery method specific fields
      if (formData.deliveryMethod === 'omniva-parcel-machine' && !formData.omnivaParcelMachineId) {
        setError(t('checkout.shipping.omniva.required'));
        return false;
      }
      
      // Validate terms acceptance
      if (!formData.termsAccepted) {
        setError(t('checkout.terms.required'));
        return false;
      }
    }
    
    return true;
  };

  const handleContinue = () => {
    if (!validateForm()) return;
    
    if (step === 'review') {
      setStep('shipping');
    } else if (step === 'shipping') {
      handlePayment();
    }
  };

  const handleBack = () => {
    if (step === 'shipping') {
      setStep('review');
    }
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Prepare payment data
      const paymentData = {
        amount: (getTotalPrice() + getShippingCost()).toFixed(2),
        reference: `order-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: formData.country,
        paymentMethod: 'lhv', // Default to LHV bank
        deliveryMethod: formData.deliveryMethod,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price.replace('€', '')),
          quantity: 1
        }))
      };
      
      // Add Omniva parcel machine info if selected
      if (formData.deliveryMethod === 'omniva-parcel-machine') {
        paymentData.omnivaParcelMachineId = formData.omnivaParcelMachineId;
        paymentData.omnivaParcelMachineName = formData.omnivaParcelMachineName;
      }
      
      // Process payment through Maksekeskus
      const response = await fetch('/php/process-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        throw new Error(`Payment processing failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Redirect to payment URL
      if (result.paymentUrl) {
        // Clear cart before redirecting to payment
        clearCart();
        window.location.href = result.paymentUrl;
      } else {
        throw new Error('No payment URL returned');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || t('checkout.error.network_error'));
      setLoading(false);
    }
  };

  const getShippingCost = () => {
    if (formData.deliveryMethod === 'omniva-parcel-machine') {
      return omnivaShippingPrice;
    }
    return 0;
  };

  const getTotalWithShipping = () => {
    return getTotalPrice() + getShippingCost();
  };

  // Format price for display
  const formatPrice = (price) => {
    return `${price.toFixed(2)}€`;
  };

  if (items.length === 0) {
    return (
      <main>
        <section className="section-large">
          <div className="container">
            <div className="empty-cart">
              <h1>{t('cart.empty')}</h1>
            </div>
          </div>
        </section>
      </main>
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
              {/* Checkout Steps */}
              <div className="checkout-steps">
                <div className={`checkout-step ${step === 'review' ? 'active' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-name">{t('checkout.steps.review')}</span>
                </div>
                <div className="step-connector"></div>
                <div className={`checkout-step ${step === 'shipping' ? 'active' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-name">{t('checkout.steps.shipping')}</span>
                </div>
                <div className="step-connector"></div>
                <div className={`checkout-step ${step === 'payment' ? 'active' : ''}`}>
                  <span className="step-number">3</span>
                  <span className="step-name">{t('checkout.steps.payment')}</span>
                </div>
              </div>

              {/* Main Content */}
              <div className="checkout-content">
                {/* Review Step */}
                {step === 'review' && (
                  <div className="checkout-review">
                    <h2>{t('checkout.review.title')}</h2>
                    
                    <div className="cart-items">
                      {items.map((item) => (
                        <div key={item.id} className="cart-item">
                          <div className="item-image">
                            <img src={item.image} alt={item.title} />
                          </div>
                          <div className="item-details">
                            <h3 className="item-title">{item.title}</h3>
                            <p className="item-price">{item.price}</p>
                            <p className="item-quantity">{t('cart.quantity')}: 1</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipping Step */}
                {step === 'shipping' && (
                  <div className="checkout-shipping">
                    <h2>{t('checkout.shipping.title')}</h2>
                    
                    {error && (
                      <div className="checkout-error">
                        {error}
                      </div>
                    )}
                    
                    <div className="shipping-form">
                      {/* Contact Information */}
                      <div className="form-section">
                        <h3>{t('checkout.shipping.contact.title')}</h3>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="firstName">{t('checkout.shipping.contact.name')}</label>
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
                            <label htmlFor="lastName">{t('checkout.shipping.contact.name')}</label>
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
                            <label htmlFor="email">{t('checkout.shipping.contact.email')}</label>
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
                            <label htmlFor="phone">{t('checkout.shipping.contact.phone')}</label>
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
                      
                      {/* Delivery Method */}
                      <div className="form-section">
                        <h3>Tarneviis</h3>
                        
                        <div className="delivery-methods">
                          <div className="delivery-method active">
                            <div className="delivery-method-header">
                              <div className="delivery-method-radio">
                                <input
                                  type="radio"
                                  id="omniva"
                                  name="deliveryMethod"
                                  value="omniva-parcel-machine"
                                  checked={formData.deliveryMethod === 'omniva-parcel-machine'}
                                  onChange={handleInputChange}
                                  className="delivery-radio"
                                />
                                <label htmlFor="omniva" className="delivery-label">
                                  <span className="delivery-name">{t('checkout.shipping.omniva.title')}</span>
                                </label>
                              </div>
                              <div className="delivery-price">
                                {formatPrice(omnivaShippingPrice)}
                              </div>
                            </div>
                            
                            <div className="delivery-method-content">
                              <p className="delivery-description">{t('checkout.shipping.omniva.description')}</p>
                              
                              {formData.deliveryMethod === 'omniva-parcel-machine' && (
                                <div className="form-group">
                                  <label htmlFor="omnivaParcelMachineId">{t('checkout.shipping.omniva.select_machine')}</label>
                                  {parcelMachinesLoading ? (
                                    <div className="loading-text">{t('checkout.shipping.omniva.loading')}</div>
                                  ) : (
                                    <select
                                      id="omnivaParcelMachineId"
                                      name="omnivaParcelMachineId"
                                      value={formData.omnivaParcelMachineId}
                                      onChange={handleInputChange}
                                      className="form-input"
                                      required
                                    >
                                      <option value="">{t('checkout.shipping.omniva.select_placeholder')}</option>
                                      {parcelMachines.map(machine => (
                                        <option key={machine.id} value={machine.id}>
                                          {machine.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  
                                  {parcelMachines.length === 0 && !parcelMachinesLoading && (
                                    <div className="form-hint">
                                      {t('checkout.shipping.omniva.no_machines')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Country Selection */}
                      <div className="form-section">
                        <h3>Riik</h3>
                        
                        <div className="form-group">
                          <label htmlFor="country">{t('checkout.shipping.address.country')}</label>
                          <select
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="form-input"
                            required
                          >
                            <option value="Estonia">{t('checkout.shipping.address.countries.estonia')}</option>
                            <option value="Finland">{t('checkout.shipping.address.countries.finland')}</option>
                            <option value="Latvia">{t('checkout.shipping.address.countries.latvia')}</option>
                            <option value="Lithuania">{t('checkout.shipping.address.countries.lithuania')}</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Additional Notes */}
                      <div className="form-section">
                        <h3>{t('checkout.shipping.notes.title')}</h3>
                        
                        <div className="form-group">
                          <label htmlFor="notes">{t('checkout.shipping.notes.notes')}</label>
                          <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            placeholder={t('checkout.shipping.notes.notes_placeholder')}
                            className="form-input"
                            rows="3"
                          ></textarea>
                        </div>
                      </div>
                      
                      {/* Terms and Conditions */}
                      <div className="form-section terms-section">
                        <div className="form-group checkbox-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              name="termsAccepted"
                              checked={formData.termsAccepted}
                              onChange={handleInputChange}
                              className="form-checkbox"
                              required
                            />
                            <span>
                              {t('checkout.terms.agree')} <a href="/muugitingimused" target="_blank" rel="noopener noreferrer">{t('checkout.terms.terms_link')}</a>
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="checkout-summary">
                <div className="summary-card">
                  <h3>{t('checkout.summary.title')}</h3>
                  
                  <div className="summary-row">
                    <span>{t('checkout.summary.subtotal')}</span>
                    <span>{formatPrice(getTotalPrice())}</span>
                  </div>
                  
                  <div className="summary-row">
                    <span>{t('checkout.summary.shipping')}</span>
                    <span>{formatPrice(getShippingCost())}</span>
                  </div>
                  
                  <div className="summary-row total">
                    <span>{t('checkout.summary.total')}</span>
                    <span>{formatPrice(getTotalWithShipping())}</span>
                  </div>
                  
                  <div className="summary-actions">
                    {step === 'review' && (
                      <button 
                        onClick={handleContinue}
                        className="summary-button"
                      >
                        {t('checkout.summary.continue')}
                      </button>
                    )}
                    
                    {step === 'shipping' && (
                      <>
                        <button 
                          onClick={handleBack}
                          className="back-button"
                        >
                          {t('checkout.shipping.back')}
                        </button>
                        <button 
                          onClick={handleContinue}
                          className="summary-button"
                          disabled={loading}
                        >
                          {loading ? t('checkout.summary.processing') : t('checkout.summary.pay')}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <div className="summary-info">
                    <div className="info-item">
                      <span className="info-icon">🔒</span>
                      <span className="info-text">{t('checkout.summary.info.secure')}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">🚚</span>
                      <span className="info-text">{t('checkout.summary.info.shipping')}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">✉️</span>
                      <span className="info-text">{t('checkout.summary.info.personal')}</span>
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
          grid-template-columns: 1fr 350px;
          gap: 48px;
          margin-top: 48px;
        }

        .checkout-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 48px;
        }

        .checkout-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #f0f0f0;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .checkout-step.active .step-number {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .step-name {
          font-family: var(--font-heading);
          font-size: 0.9rem;
          color: #666;
        }

        .checkout-step.active .step-name {
          color: var(--color-ultramarine);
          font-weight: 500;
        }

        .step-connector {
          width: 64px;
          height: 1px;
          background-color: #ddd;
          margin: 0 8px;
        }

        .checkout-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .checkout-content h2 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-bottom: 32px;
        }

        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .cart-item {
          display: flex;
          gap: 16px;
          padding-bottom: 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .cart-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .item-image {
          width: 80px;
          height: 80px;
          flex-shrink: 0;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 4px;
        }

        .item-details {
          flex: 1;
        }

        .item-title {
          font-family: var(--font-heading);
          font-size: 1.125rem;
          font-weight: 400;
          margin-bottom: 8px;
          color: var(--color-text);
        }

        .item-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-bottom: 4px;
        }

        .item-quantity {
          font-size: 0.9rem;
          color: #666;
        }

        .checkout-error {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #fcc;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }

        .shipping-form {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .form-section {
          margin-bottom: 8px;
        }

        .form-section h3 {
          font-family: var(--font-heading);
          font-size: 1.125rem;
          font-weight: 500;
          color: var(--color-text);
          margin-bottom: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
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

        .form-hint {
          font-size: 0.85rem;
          color: #666;
          margin-top: 4px;
        }

        .loading-text {
          padding: 12px 16px;
          background: #f8f9fa;
          border-radius: 4px;
          color: #666;
          font-style: italic;
          font-size: 0.9rem;
        }

        .delivery-methods {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .delivery-method {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .delivery-method.active {
          border-color: var(--color-ultramarine);
          box-shadow: 0 0 0 1px var(--color-ultramarine);
        }

        .delivery-method-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #eee;
        }

        .delivery-method-radio {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .delivery-radio {
          width: 18px;
          height: 18px;
          accent-color: var(--color-ultramarine);
        }

        .delivery-label {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .delivery-name {
          font-weight: 500;
          color: var(--color-text);
        }

        .delivery-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
        }

        .delivery-method-content {
          padding: 16px;
        }

        .delivery-description {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 16px;
        }

        .checkbox-group {
          flex-direction: row;
          align-items: center;
          gap: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .form-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--color-ultramarine);
        }

        .checkbox-label a {
          color: var(--color-ultramarine);
          text-decoration: underline;
        }

        .terms-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }

        .checkout-summary {
          position: sticky;
          top: 32px;
        }

        .summary-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }

        .summary-card h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
          font-size: 1rem;
        }

        .summary-row.total {
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 1.125rem;
          color: var(--color-ultramarine);
          padding-top: 16px;
          margin-top: 8px;
          border-top: 1px solid #f0f0f0;
          border-bottom: none;
        }

        .summary-actions {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .summary-button {
          background-color: var(--color-ultramarine);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s ease;
          text-align: center;
        }

        .summary-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .summary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .back-button {
          background: none;
          border: 1px solid #ddd;
          padding: 14px 24px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          color: var(--color-text);
        }

        .back-button:hover {
          background-color: #f8f9fa;
          border-color: #ccc;
        }

        .summary-info {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #f0f0f0;
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
        }

        .info-text {
          font-size: 0.85rem;
          color: #666;
        }

        .empty-cart {
          text-align: center;
          padding: 64px 0;
        }

        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .checkout-steps {
            margin-bottom: 32px;
          }

          .step-connector {
            width: 32px;
          }

          .checkout-content {
            padding: 24px;
          }

          .checkout-content h2 {
            font-size: 1.25rem;
            margin-bottom: 24px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .checkout-summary {
            position: static;
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;