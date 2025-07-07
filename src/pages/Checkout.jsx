import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

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
    address: '',
    city: '',
    postalCode: '',
    country: 'Estonia',
    notes: ''
  });
  
  // Delivery method state
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [omnivaParcelMachines, setOmnivaParcelMachines] = useState([]);
  const [selectedParcelMachine, setSelectedParcelMachine] = useState('');
  const [loadingParcelMachines, setLoadingParcelMachines] = useState(false);
  const [parcelMachineError, setParcelMachineError] = useState('');
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState('');
  
  // Process state
  const [step, setStep] = useState('review');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Country code mapping for Omniva API
  const countryCodeMap = {
    'Estonia': 'ee',
    'Latvia': 'lv',
    'Lithuania': 'lt',
    'Finland': 'fi'
  };
  
  // Get country code for API calls
  const getCountryCode = (country) => {
    return countryCodeMap[country] || 'ee'; // Default to Estonia if not found
  };
  
  // Load Omniva parcel machines when delivery method changes
  useEffect(() => {
    if (deliveryMethod === 'omniva-parcel-machine') {
      loadOmnivaParcelMachines();
    }
  }, [deliveryMethod, formData.country]);
  
  // Load Omniva parcel machines
  const loadOmnivaParcelMachines = async () => {
    setLoadingParcelMachines(true);
    setParcelMachineError('');
    setSelectedParcelMachine('');
    
    try {
      const countryCode = getCountryCode(formData.country);
      const response = await fetch(`/php/get-omniva-parcel-machines.php?country=${countryCode}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.parcelMachines && data.parcelMachines.length > 0) {
        setOmnivaParcelMachines(data.parcelMachines);
      } else {
        setParcelMachineError(t('checkout.shipping.omniva.no_machines'));
        setOmnivaParcelMachines([]);
      }
    } catch (error) {
      console.error('Error loading parcel machines:', error);
      setParcelMachineError(t('checkout.shipping.omniva.error'));
      setOmnivaParcelMachines([]);
    } finally {
      setLoadingParcelMachines(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };
  
  // Handle delivery method change
  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);
    
    // Reset parcel machine selection when changing delivery method
    if (method !== 'omniva-parcel-machine') {
      setSelectedParcelMachine('');
    }
  };
  
  // Handle parcel machine selection
  const handleParcelMachineChange = (e) => {
    const machineId = e.target.value;
    setSelectedParcelMachine(machineId);
    
    // Clear error when user selects a parcel machine
    if (error) setError('');
  };
  
  // Get selected parcel machine name
  const getSelectedParcelMachineName = () => {
    if (!selectedParcelMachine) return '';
    
    const machine = omnivaParcelMachines.find(m => m.id === selectedParcelMachine);
    return machine ? machine.name : '';
  };
  
  // Validate form
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
    if (deliveryMethod === 'omniva-parcel-machine' && !selectedParcelMachine) {
      setError(t('checkout.shipping.omniva.required'));
      return false;
    }
    
    // Address validation for standard delivery
    if (deliveryMethod === 'standard' && (!formData.address || !formData.city || !formData.postalCode)) {
      setError(t('checkout.error.required_fields'));
      return false;
    }
    
    // Terms acceptance validation
    if (!termsAccepted) {
      setError(t('checkout.terms.required'));
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Prepare order data
      const orderData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        notes: formData.notes,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price.replace('€', '').trim()),
          quantity: 1
        })),
        amount: getTotalPrice(),
        reference: `ORD-${Date.now()}`,
        deliveryMethod: deliveryMethod
      };
      
      // Add Omniva parcel machine details if selected
      if (deliveryMethod === 'omniva-parcel-machine' && selectedParcelMachine) {
        orderData.omnivaParcelMachineId = selectedParcelMachine;
        orderData.omnivaParcelMachineName = getSelectedParcelMachineName();
      }
      
      // Store pending order in localStorage for retrieval on success page
      localStorage.setItem('pendingOrder', JSON.stringify({
        orderReference: orderData.reference,
        orderAmount: orderData.amount,
        customerEmail: orderData.email,
        customerName: `${orderData.firstName} ${orderData.lastName}`,
        customerPhone: orderData.phone,
        omnivaParcelMachineId: orderData.omnivaParcelMachineId,
        omnivaParcelMachineName: orderData.omnivaParcelMachineName,
        timestamp: Date.now(),
        orderItems: orderData.items
      }));
      
      // Process payment
      const response = await fetch('/php/process-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.paymentUrl) {
        // Redirect to payment page
        window.location.href = data.paymentUrl;
      } else {
        setError(data.error || t('checkout.error.session_failed'));
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setError(t('checkout.error.network_error'));
      setIsSubmitting(false);
    }
  };
  
  // Navigate between steps
  const goToStep = (newStep) => {
    setStep(newStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Calculate shipping cost
  const getShippingCost = () => {
    // For now, shipping is free
    return 0;
  };
  
  // Get total cost
  const getTotalCost = () => {
    return getTotalPrice() + getShippingCost();
  };
  
  // Format price
  const formatPrice = (price) => {
    return `${price.toFixed(2)}€`;
  };
  
  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // If cart is empty, redirect to shop
  useEffect(() => {
    if (items.length === 0) {
      navigate('/epood');
    }
  }, [items, navigate]);
  
  if (items.length === 0) {
    return null;
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
                <div className="step-divider"></div>
                <div className={`checkout-step ${step === 'shipping' ? 'active' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-name">{t('checkout.steps.shipping')}</span>
                </div>
                <div className="step-divider"></div>
                <div className={`checkout-step ${step === 'payment' ? 'active' : ''}`}>
                  <span className="step-number">3</span>
                  <span className="step-name">{t('checkout.steps.payment')}</span>
                </div>
              </div>

              {/* Main Content */}
              <div className="checkout-content">
                <form onSubmit={handleSubmit}>
                  {/* Step 1: Review */}
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
                      
                      <div className="review-actions">
                        <Link to="/epood" className="btn btn-secondary" onClick={scrollToTop}>
                          {t('checkout.review.back_to_shop')}
                        </Link>
                        <button 
                          type="button" 
                          className="btn btn-primary"
                          onClick={() => goToStep('shipping')}
                        >
                          {t('checkout.review.continue')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Shipping */}
                  {step === 'shipping' && (
                    <div className="checkout-shipping">
                      <h2>{t('checkout.shipping.title')}</h2>
                      
                      {/* Contact Information */}
                      <div className="form-section">
                        <h3>{t('checkout.shipping.contact.title')}</h3>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="firstName">{t('checkout.shipping.contact.name')} *</label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              required
                              className="form-input"
                              placeholder={t('checkout.shipping.contact.name_placeholder')}
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
                              required
                              className="form-input"
                              placeholder={t('checkout.shipping.contact.name_placeholder')}
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
                              required
                              className="form-input"
                              placeholder={t('checkout.shipping.contact.email_placeholder')}
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
                              required
                              className="form-input"
                              placeholder={t('checkout.shipping.contact.phone_placeholder')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Delivery Method */}
                      <div className="form-section">
                        <h3>{t('checkout.shipping.delivery.title')}</h3>
                        
                        <div className="delivery-methods">
                          <div className="delivery-method">
                            <label className="method-label">
                              <input
                                type="radio"
                                name="deliveryMethod"
                                value="standard"
                                checked={deliveryMethod === 'standard'}
                                onChange={() => handleDeliveryMethodChange('standard')}
                                className="method-radio"
                              />
                              <div className="method-content">
                                <div className="method-info">
                                  <span className="method-name">{t('checkout.shipping.delivery.standard')}</span>
                                  <span className="method-price">{formatPrice(getShippingCost())}</span>
                                </div>
                                <span className="method-description">{t('checkout.shipping.delivery.standard_desc')}</span>
                              </div>
                            </label>
                          </div>
                          
                          <div className="delivery-method">
                            <label className="method-label">
                              <input
                                type="radio"
                                name="deliveryMethod"
                                value="omniva-parcel-machine"
                                checked={deliveryMethod === 'omniva-parcel-machine'}
                                onChange={() => handleDeliveryMethodChange('omniva-parcel-machine')}
                                className="method-radio"
                              />
                              <div className="method-content">
                                <div className="method-info">
                                  <span className="method-name">{t('checkout.shipping.delivery.omniva')}</span>
                                  <span className="method-price">{formatPrice(getShippingCost())}</span>
                                </div>
                                <span className="method-description">{t('checkout.shipping.delivery.omniva_desc')}</span>
                              </div>
                            </label>
                          </div>
                        </div>
                        
                        {/* Omniva Parcel Machine Selection */}
                        {deliveryMethod === 'omniva-parcel-machine' && (
                          <div className="parcel-machine-selection">
                            <div className="form-group">
                              <label htmlFor="parcelMachine">{t('checkout.shipping.delivery.select_machine')} *</label>
                              {loadingParcelMachines ? (
                                <div className="loading-text">{t('checkout.shipping.delivery.loading_machines')}</div>
                              ) : parcelMachineError ? (
                                <div className="error-text">{parcelMachineError}</div>
                              ) : (
                                <select
                                  id="parcelMachine"
                                  name="parcelMachine"
                                  value={selectedParcelMachine}
                                  onChange={handleParcelMachineChange}
                                  required={deliveryMethod === 'omniva-parcel-machine'}
                                  className="form-input"
                                >
                                  <option value="">{t('checkout.shipping.delivery.select_machine_placeholder')}</option>
                                  {omnivaParcelMachines.map((machine) => (
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
                      
                      {/* Shipping Address - Only show for standard delivery */}
                      {deliveryMethod === 'standard' && (
                        <div className="form-section">
                          <h3>{t('checkout.shipping.address.title')}</h3>
                          
                          <div className="form-group">
                            <label htmlFor="address">{t('checkout.shipping.address.address')} *</label>
                            <input
                              type="text"
                              id="address"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              required={deliveryMethod === 'standard'}
                              className="form-input"
                              placeholder={t('checkout.shipping.address.address_placeholder')}
                            />
                          </div>
                          
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="city">{t('checkout.shipping.address.city')} *</label>
                              <input
                                type="text"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                required={deliveryMethod === 'standard'}
                                className="form-input"
                                placeholder={t('checkout.shipping.address.city_placeholder')}
                              />
                            </div>
                            
                            <div className="form-group">
                              <label htmlFor="postalCode">{t('checkout.shipping.address.postal_code')} *</label>
                              <input
                                type="text"
                                id="postalCode"
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={handleInputChange}
                                required={deliveryMethod === 'standard'}
                                className="form-input"
                                placeholder={t('checkout.shipping.address.postal_code_placeholder')}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Country Selection - Always show */}
                      <div className="form-section">
                        <div className="form-group">
                          <label htmlFor="country">{t('checkout.shipping.address.country')} *</label>
                          <select
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            required
                            className="form-input"
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
                            rows="4"
                            className="form-input"
                            placeholder={t('checkout.shipping.notes.notes_placeholder')}
                          ></textarea>
                        </div>
                      </div>
                      
                      {/* Terms and Conditions */}
                      <div className="form-section">
                        <div className="form-group terms-group">
                          <label className="terms-label">
                            <input
                              type="checkbox"
                              checked={termsAccepted}
                              onChange={() => setTermsAccepted(!termsAccepted)}
                              className="terms-checkbox"
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
                      
                      <div className="shipping-actions">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => goToStep('review')}
                        >
                          {t('checkout.shipping.back')}
                        </button>
                        <button 
                          type="submit"
                          className="btn btn-primary"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? t('checkout.summary.processing') : t('checkout.shipping.continue')}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Order Summary */}
              <div className="checkout-summary">
                <div className="summary-card">
                  <h3>{t('checkout.summary.title')}</h3>
                  
                  <div className="summary-items">
                    {items.map((item) => (
                      <div key={item.id} className="summary-item">
                        <span className="item-name">{item.title}</span>
                        <span className="item-price">{item.price}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="summary-totals">
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
                      <span>{formatPrice(getTotalCost())}</span>
                    </div>
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

        .step-divider {
          width: 64px;
          height: 1px;
          background-color: #e0e0e0;
          margin: 0 16px;
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
          margin-bottom: 32px;
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
          font-size: 1rem;
          font-weight: 400;
          margin-bottom: 4px;
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

        .review-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
        }

        .form-section {
          margin-bottom: 32px;
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
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          font-size: 0.9rem;
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

        .delivery-methods {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .delivery-method {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .delivery-method:hover {
          border-color: var(--color-ultramarine);
        }

        .method-label {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          cursor: pointer;
          width: 100%;
        }

        .method-radio {
          margin-top: 4px;
          accent-color: var(--color-ultramarine);
        }

        .method-content {
          flex: 1;
        }

        .method-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .method-name {
          font-weight: 500;
          color: var(--color-text);
        }

        .method-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
        }

        .method-description {
          font-size: 0.9rem;
          color: #666;
        }

        .parcel-machine-selection {
          margin-top: 16px;
        }

        .loading-text {
          padding: 12px 16px;
          background: #f8f9fa;
          border-radius: 4px;
          color: #666;
          font-style: italic;
        }

        .error-text {
          padding: 12px 16px;
          background: #fff5f5;
          border-radius: 4px;
          color: #c53030;
          font-size: 0.9rem;
        }

        .terms-group {
          margin-top: 24px;
        }

        .terms-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
        }

        .terms-checkbox {
          margin-top: 3px;
          accent-color: var(--color-ultramarine);
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
          background-color: #fff5f5;
          color: #c53030;
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }

        .shipping-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
        }

        .checkout-summary {
          position: sticky;
          top: 32px;
          align-self: start;
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
        }

        .summary-items {
          margin-bottom: 24px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 0.9rem;
        }

        .item-name {
          color: var(--color-text);
          max-width: 70%;
        }

        .summary-totals {
          border-top: 1px solid #f0f0f0;
          padding-top: 16px;
          margin-bottom: 24px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 0.9rem;
          color: #666;
        }

        .summary-row.total {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          font-size: 1.1rem;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }

        .summary-info {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 0.85rem;
          color: #666;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .info-icon {
          font-size: 1rem;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          transition: opacity 0.2s ease;
          display: inline-block;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          border: none;
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

        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .checkout-steps {
            margin-bottom: 32px;
          }

          .step-divider {
            width: 32px;
          }

          .checkout-content {
            padding: 24px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .review-actions,
          .shipping-actions {
            flex-direction: column;
            gap: 16px;
          }

          .btn {
            width: 100%;
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