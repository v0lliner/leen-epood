import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Checkout = () => {
  const { t, i18n } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  
  // Step management
  const [currentStep, setCurrentStep] = useState('review');
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Estonia',
    notes: '',
    deliveryMethod: '',
    omnivaParcelMachineId: '',
    omnivaParcelMachineName: ''
  });
  
  // Omniva parcel machines
  const [omnivaParcelMachines, setOmnivaParcelMachines] = useState([]);
  const [loadingParcelMachines, setLoadingParcelMachines] = useState(false);
  const [parcelMachineError, setParcelMachineError] = useState('');
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/epood');
    }
  }, [items, navigate]);
  
  // Load Omniva parcel machines when country changes
  useEffect(() => {
    if (formData.deliveryMethod === 'omniva-parcel-machine') {
      fetchOmnivaParcelMachines();
    }
  }, [formData.country, formData.deliveryMethod]);
  
  // Fetch Omniva parcel machines
  const fetchOmnivaParcelMachines = async () => {
    setLoadingParcelMachines(true);
    setParcelMachineError('');
    
    try {
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
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOmnivaParcelMachines(data.parcelMachines || []);
      } else {
        throw new Error(data.error || t('checkout.shipping.omniva.fetch_error'));
      }
    } catch (error) {
      console.error('Error fetching Omniva parcel machines:', error);
      setParcelMachineError(t('checkout.shipping.omniva.fetch_error'));
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
    
    // Clear validation error when field is changed
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle delivery method change
  const handleDeliveryMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      deliveryMethod: method,
      // Reset parcel machine selection when changing delivery method
      omnivaParcelMachineId: '',
      omnivaParcelMachineName: ''
    }));
  };
  
  // Handle parcel machine selection
  const handleParcelMachineChange = (e) => {
    const machineId = e.target.value;
    
    if (!machineId) {
      setFormData(prev => ({
        ...prev,
        omnivaParcelMachineId: '',
        omnivaParcelMachineName: ''
      }));
      return;
    }
    
    const selectedMachine = omnivaParcelMachines.find(machine => machine.id === machineId);
    
    if (selectedMachine) {
      setFormData(prev => ({
        ...prev,
        omnivaParcelMachineId: machineId,
        omnivaParcelMachineName: `${selectedMachine.name} (${selectedMachine.address})`
      }));
      
      // Clear validation error
      if (formErrors.omnivaParcelMachineId) {
        setFormErrors(prev => ({
          ...prev,
          omnivaParcelMachineId: ''
        }));
      }
    }
  };
  
  // Validate shipping form
  const validateShippingForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.firstName.trim()) errors.firstName = t('checkout.error.required_fields');
    if (!formData.lastName.trim()) errors.lastName = t('checkout.error.required_fields');
    if (!formData.email.trim()) errors.email = t('checkout.error.required_fields');
    if (!formData.phone.trim()) errors.phone = t('checkout.error.required_fields');
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('checkout.error.invalid_email');
    }
    
    // Delivery method validation
    if (!formData.deliveryMethod) {
      errors.deliveryMethod = t('checkout.error.required_fields');
    }
    
    // Omniva parcel machine validation
    if (formData.deliveryMethod === 'omniva-parcel-machine' && !formData.omnivaParcelMachineId) {
      errors.omnivaParcelMachineId = t('checkout.shipping.omniva.required');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validate payment form
  const validatePaymentForm = () => {
    const errors = {};
    
    if (!paymentMethod) {
      errors.paymentMethod = t('checkout.payment.method_required');
    }
    
    if (!termsAccepted) {
      errors.terms = t('checkout.terms.required');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 'review') {
      setCurrentStep('shipping');
    } else if (currentStep === 'shipping') {
      if (validateShippingForm()) {
        setCurrentStep('payment');
      }
    }
  };
  
  // Handle back step
  const handleBackStep = () => {
    if (currentStep === 'shipping') {
      setCurrentStep('review');
    } else if (currentStep === 'payment') {
      setCurrentStep('shipping');
    }
  };
  
  // Process payment
  const processPayment = async () => {
    if (!validatePaymentForm()) {
      return;
    }
    
    setIsProcessing(true);
    setPaymentError('');
    
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
        deliveryMethod: formData.deliveryMethod,
        omnivaParcelMachineId: formData.omnivaParcelMachineId,
        omnivaParcelMachineName: formData.omnivaParcelMachineName,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price.replace('€', '').trim()),
          quantity: 1
        })),
        amount: getTotalPrice(),
        reference: `order-${Date.now()}`,
        paymentMethod: paymentMethod
      };
      
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
      
      // Process payment with Maksekeskus
      const response = await fetch('/php/process-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const paymentData = await response.json();
      
      if (paymentData.error) {
        throw new Error(paymentData.error);
      }
      
      // Redirect to payment URL
      if (paymentData.paymentUrl) {
        window.location.href = paymentData.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
      
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentError(error.message || t('checkout.error.network_error'));
      setIsProcessing(false);
    }
  };
  
  // Calculate shipping cost
  const getShippingCost = () => {
    if (formData.deliveryMethod === 'omniva-parcel-machine') {
      return 3.99;
    }
    return 0;
  };
  
  // Calculate total cost
  const getTotalCost = () => {
    return getTotalPrice() + getShippingCost();
  };
  
  // Render review step
  const renderReviewStep = () => (
    <div className="checkout-step">
      <h2>{t('checkout.review.title')}</h2>
      
      <div className="cart-items">
        {items.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="item-image">
              <img src={item.image} alt={item.title} />
            </div>
            <div className="item-details">
              <h4 className="item-title">{item.title}</h4>
              <p className="item-price">{item.price}</p>
              <p className="item-quantity">{t('cart.quantity')}: 1</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="checkout-actions">
        <button 
          onClick={() => navigate('/epood')}
          className="btn btn-secondary"
        >
          {t('checkout.review.back_to_shop')}
        </button>
        <button 
          onClick={handleNextStep}
          className="btn btn-primary"
        >
          {t('checkout.review.continue')}
        </button>
      </div>
    </div>
  );
  
  // Render shipping step
  const renderShippingStep = () => (
    <div className="checkout-step">
      <h2>{t('checkout.shipping.title')}</h2>
      
      <div className="shipping-form">
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
                className={`form-input ${formErrors.firstName ? 'error' : ''}`}
                placeholder={t('checkout.shipping.contact.name_placeholder')}
              />
              {formErrors.firstName && <div className="error-message">{formErrors.firstName}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">{t('checkout.shipping.contact.name')} *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`form-input ${formErrors.lastName ? 'error' : ''}`}
                placeholder={t('checkout.shipping.contact.name_placeholder')}
              />
              {formErrors.lastName && <div className="error-message">{formErrors.lastName}</div>}
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
                className={`form-input ${formErrors.email ? 'error' : ''}`}
                placeholder={t('checkout.shipping.contact.email_placeholder')}
              />
              {formErrors.email && <div className="error-message">{formErrors.email}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">{t('checkout.shipping.contact.phone')} *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`form-input ${formErrors.phone ? 'error' : ''}`}
                placeholder={t('checkout.shipping.contact.phone_placeholder')}
              />
              {formErrors.phone && <div className="error-message">{formErrors.phone}</div>}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>{t('checkout.shipping.address.title')}</h3>
          
          <div className="form-row">
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
                <option value="Finland">{t('checkout.shipping.address.countries.finland')}</option>
                <option value="Latvia">{t('checkout.shipping.address.countries.latvia')}</option>
                <option value="Lithuania">{t('checkout.shipping.address.countries.lithuania')}</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>{t('checkout.shipping.title')}</h3>
          
          {formErrors.deliveryMethod && (
            <div className="error-message delivery-error">{formErrors.deliveryMethod}</div>
          )}
          
          <div className="delivery-options">
            <div 
              className={`delivery-option ${formData.deliveryMethod === 'omniva-parcel-machine' ? 'selected' : ''}`}
              onClick={() => handleDeliveryMethodChange('omniva-parcel-machine')}
            >
              <div className="delivery-option-header">
                <div className="delivery-option-radio">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="omniva-parcel-machine"
                    checked={formData.deliveryMethod === 'omniva-parcel-machine'}
                    onChange={() => handleDeliveryMethodChange('omniva-parcel-machine')}
                  />
                </div>
                <div className="delivery-option-info">
                  <h4>{t('checkout.shipping.omniva.title')}</h4>
                  <p>{t('checkout.shipping.omniva.description')}</p>
                </div>
                <div className="delivery-option-price">
                  {t('checkout.shipping.omniva.price')}
                </div>
              </div>
              
              {formData.deliveryMethod === 'omniva-parcel-machine' && (
                <div className="delivery-option-details">
                  <div className="form-group">
                    <label htmlFor="omnivaParcelMachine">
                      {t('checkout.shipping.omniva.select_machine')}
                    </label>
                    
                    {loadingParcelMachines ? (
                      <div className="loading-text">{t('checkout.shipping.omniva.loading')}</div>
                    ) : parcelMachineError ? (
                      <div className="error-message">{parcelMachineError}</div>
                    ) : omnivaParcelMachines.length === 0 ? (
                      <div className="info-message">{t('checkout.shipping.omniva.no_machines')}</div>
                    ) : (
                      <select
                        id="omnivaParcelMachine"
                        name="omnivaParcelMachine"
                        value={formData.omnivaParcelMachineId}
                        onChange={handleParcelMachineChange}
                        className={`form-input ${formErrors.omnivaParcelMachineId ? 'error' : ''}`}
                      >
                        <option value="">{t('checkout.shipping.omniva.select_placeholder')}</option>
                        {omnivaParcelMachines.map(machine => (
                          <option key={machine.id} value={machine.id}>
                            {machine.name} ({machine.address})
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {formErrors.omnivaParcelMachineId && (
                      <div className="error-message">{formErrors.omnivaParcelMachineId}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>{t('checkout.shipping.notes.title')}</h3>
          
          <div className="form-group">
            <label htmlFor="notes">{t('checkout.shipping.notes.notes')}</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              placeholder={t('checkout.shipping.notes.notes_placeholder')}
            ></textarea>
          </div>
        </div>
      </div>
      
      <div className="checkout-actions">
        <button 
          onClick={handleBackStep}
          className="btn btn-secondary"
        >
          {t('checkout.shipping.back')}
        </button>
        <button 
          onClick={handleNextStep}
          className="btn btn-primary"
        >
          {t('checkout.shipping.continue')}
        </button>
      </div>
    </div>
  );
  
  // Render payment step
  const renderPaymentStep = () => (
    <div className="checkout-step">
      <h2>{t('checkout.payment.title')}</h2>
      
      <div className="payment-methods">
        <div className="payment-method-group">
          <h3>{t('checkout.payment.select_method')}</h3>
          
          {formErrors.paymentMethod && (
            <div className="error-message">{formErrors.paymentMethod}</div>
          )}
          
          <div className="payment-options">
            <div 
              className={`payment-option ${paymentMethod === 'swedbank' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('swedbank')}
            >
              <div className="payment-option-radio">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="swedbank"
                  checked={paymentMethod === 'swedbank'}
                  onChange={() => setPaymentMethod('swedbank')}
                />
              </div>
              <div className="payment-option-logo">
                <img src="/assets/banks/swedbank.svg" alt="Swedbank" onError={(e) => e.target.src = "/assets/banks/placeholder.svg"} />
              </div>
              <div className="payment-option-name">
                Swedbank
              </div>
            </div>
            
            <div 
              className={`payment-option ${paymentMethod === 'seb' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('seb')}
            >
              <div className="payment-option-radio">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="seb"
                  checked={paymentMethod === 'seb'}
                  onChange={() => setPaymentMethod('seb')}
                />
              </div>
              <div className="payment-option-logo">
                <img src="/assets/banks/seb.svg" alt="SEB" onError={(e) => e.target.src = "/assets/banks/placeholder.svg"} />
              </div>
              <div className="payment-option-name">
                SEB
              </div>
            </div>
            
            <div 
              className={`payment-option ${paymentMethod === 'lhv' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('lhv')}
            >
              <div className="payment-option-radio">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="lhv"
                  checked={paymentMethod === 'lhv'}
                  onChange={() => setPaymentMethod('lhv')}
                />
              </div>
              <div className="payment-option-logo">
                <img src="/assets/banks/lhv.svg" alt="LHV" onError={(e) => e.target.src = "/assets/banks/placeholder.svg"} />
              </div>
              <div className="payment-option-name">
                LHV
              </div>
            </div>
            
            <div 
              className={`payment-option ${paymentMethod === 'coop' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('coop')}
            >
              <div className="payment-option-radio">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="coop"
                  checked={paymentMethod === 'coop'}
                  onChange={() => setPaymentMethod('coop')}
                />
              </div>
              <div className="payment-option-logo">
                <img src="/assets/banks/coop.svg" alt="Coop Pank" onError={(e) => e.target.src = "/assets/banks/placeholder.svg"} />
              </div>
              <div className="payment-option-name">
                Coop Pank
              </div>
            </div>
            
            <div 
              className={`payment-option ${paymentMethod === 'luminor' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('luminor')}
            >
              <div className="payment-option-radio">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="luminor"
                  checked={paymentMethod === 'luminor'}
                  onChange={() => setPaymentMethod('luminor')}
                />
              </div>
              <div className="payment-option-logo">
                <img src="/assets/banks/luminor.svg" alt="Luminor" onError={(e) => e.target.src = "/assets/banks/placeholder.svg"} />
              </div>
              <div className="payment-option-name">
                Luminor
              </div>
            </div>
            
            <div 
              className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className="payment-option-radio">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                />
              </div>
              <div className="payment-option-logo">
                <img src="/assets/banks/card.svg" alt="Credit Card" onError={(e) => e.target.src = "/assets/banks/placeholder.svg"} />
              </div>
              <div className="payment-option-name">
                Credit Card
              </div>
            </div>
          </div>
        </div>
        
        <div className="terms-agreement">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={() => {
                setTermsAccepted(!termsAccepted);
                if (formErrors.terms) {
                  setFormErrors(prev => ({ ...prev, terms: '' }));
                }
              }}
              className={formErrors.terms ? 'error' : ''}
            />
            <span>
              {t('checkout.terms.agree')} <a href="/muugitingimused" target="_blank" rel="noopener noreferrer">{t('checkout.terms.terms_link')}</a>
            </span>
          </label>
          {formErrors.terms && <div className="error-message">{formErrors.terms}</div>}
        </div>
        
        {paymentError && (
          <div className="payment-error">
            {paymentError}
          </div>
        )}
      </div>
      
      <div className="checkout-actions">
        <button 
          onClick={handleBackStep}
          className="btn btn-secondary"
          disabled={isProcessing}
        >
          {t('checkout.shipping.back')}
        </button>
        <button 
          onClick={processPayment}
          className="btn btn-primary"
          disabled={isProcessing}
        >
          {isProcessing ? t('checkout.summary.processing') : t('checkout.summary.pay')}
        </button>
      </div>
    </div>
  );
  
  // Render order summary
  const renderOrderSummary = () => (
    <div className="order-summary">
      <h3>{t('checkout.summary.title')}</h3>
      
      <div className="summary-items">
        {items.map((item) => (
          <div key={item.id} className="summary-item">
            <span className="item-name">{item.title}</span>
            <span className="item-price">{item.price}</span>
          </div>
        ))}
      </div>
      
      <div className="summary-subtotal">
        <span>{t('checkout.summary.subtotal')}</span>
        <span>{getTotalPrice().toFixed(2)}€</span>
      </div>
      
      {currentStep !== 'review' && formData.deliveryMethod && (
        <div className="summary-shipping">
          <span>{t('checkout.summary.shipping')}</span>
          <span>{getShippingCost().toFixed(2)}€</span>
        </div>
      )}
      
      <div className="summary-total">
        <span>{t('checkout.summary.total')}</span>
        <span>{currentStep === 'review' ? getTotalPrice().toFixed(2) : getTotalCost().toFixed(2)}€</span>
      </div>
      
      <div className="summary-info">
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
  );
  
  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <h1 className="text-center">{t('checkout.title')}</h1>
            </FadeInSection>
            
            <div className="checkout-steps">
              <div className={`checkout-step-indicator ${currentStep === 'review' ? 'active' : currentStep === 'shipping' || currentStep === 'payment' ? 'completed' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-name">{t('checkout.steps.review')}</span>
              </div>
              <div className="step-connector"></div>
              <div className={`checkout-step-indicator ${currentStep === 'shipping' ? 'active' : currentStep === 'payment' ? 'completed' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-name">{t('checkout.steps.shipping')}</span>
              </div>
              <div className="step-connector"></div>
              <div className={`checkout-step-indicator ${currentStep === 'payment' ? 'active' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-name">{t('checkout.steps.payment')}</span>
              </div>
            </div>
            
            <div className="checkout-container">
              <div className="checkout-main">
                {currentStep === 'review' && renderReviewStep()}
                {currentStep === 'shipping' && renderShippingStep()}
                {currentStep === 'payment' && renderPaymentStep()}
              </div>
              
              <div className="checkout-sidebar">
                {renderOrderSummary()}
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <style jsx>{`
        .checkout-steps {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 48px 0;
        }
        
        .checkout-step-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
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
          font-weight: 600;
          margin-bottom: 8px;
          transition: all 0.3s ease;
        }
        
        .step-name {
          font-size: 0.9rem;
          color: #666;
          transition: all 0.3s ease;
        }
        
        .checkout-step-indicator.active .step-number {
          background-color: var(--color-ultramarine);
          color: white;
        }
        
        .checkout-step-indicator.active .step-name {
          color: var(--color-ultramarine);
          font-weight: 600;
        }
        
        .checkout-step-indicator.completed .step-number {
          background-color: #4CAF50;
          color: white;
        }
        
        .step-connector {
          height: 2px;
          width: 64px;
          background-color: #f0f0f0;
          margin: 0 16px;
        }
        
        .checkout-container {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 48px;
          margin-top: 48px;
        }
        
        .checkout-main {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }
        
        .checkout-sidebar {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
          height: fit-content;
          position: sticky;
          top: 100px;
        }
        
        .checkout-step h2 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 32px;
          font-size: 1.5rem;
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
          border-radius: 4px;
          overflow: hidden;
        }
        
        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .item-details {
          flex: 1;
        }
        
        .item-title {
          font-family: var(--font-heading);
          font-size: 1rem;
          margin-bottom: 8px;
        }
        
        .item-price {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .item-quantity {
          font-size: 0.9rem;
          color: #666;
        }
        
        .checkout-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #f0f0f0;
        }
        
        .btn {
          padding: 12px 24px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .btn-secondary {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background-color: #e0e0e0;
        }
        
        .order-summary h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 24px;
          font-size: 1.25rem;
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
        
        .summary-subtotal,
        .summary-shipping,
        .summary-total {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-top: 1px solid #f0f0f0;
        }
        
        .summary-total {
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--color-ultramarine);
        }
        
        .summary-info {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #f0f0f0;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 0.85rem;
          color: #666;
        }
        
        .info-icon {
          font-size: 1rem;
        }
        
        .shipping-form {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        
        .form-section {
          margin-bottom: 16px;
        }
        
        .form-section h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 16px;
          font-size: 1.1rem;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
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
        
        .form-input.error {
          border-color: #dc3545;
        }
        
        .error-message {
          color: #dc3545;
          font-size: 0.85rem;
          margin-top: 4px;
        }
        
        .delivery-error {
          margin-bottom: 16px;
        }
        
        .delivery-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .delivery-option {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .delivery-option:hover {
          border-color: var(--color-ultramarine);
        }
        
        .delivery-option.selected {
          border-color: var(--color-ultramarine);
          box-shadow: 0 0 0 1px var(--color-ultramarine);
        }
        
        .delivery-option-header {
          display: flex;
          align-items: center;
          padding: 16px;
          gap: 16px;
        }
        
        .delivery-option-radio {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .delivery-option-radio input {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        
        .delivery-option-info {
          flex: 1;
        }
        
        .delivery-option-info h4 {
          font-family: var(--font-heading);
          font-size: 1rem;
          margin-bottom: 4px;
        }
        
        .delivery-option-info p {
          font-size: 0.85rem;
          color: #666;
          margin: 0;
        }
        
        .delivery-option-price {
          font-weight: 600;
          color: var(--color-ultramarine);
        }
        
        .delivery-option-details {
          padding: 16px;
          border-top: 1px solid #f0f0f0;
          background-color: #f9f9f9;
        }
        
        .loading-text {
          font-style: italic;
          color: #666;
          font-size: 0.9rem;
          padding: 8px 0;
        }
        
        .info-message {
          background-color: #e7f3fe;
          color: #0c5460;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        
        .payment-methods {
          margin-bottom: 32px;
        }
        
        .payment-method-group {
          margin-bottom: 24px;
        }
        
        .payment-method-group h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 16px;
          font-size: 1.1rem;
        }
        
        .payment-options {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
        }
        
        .payment-option {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .payment-option:hover {
          border-color: var(--color-ultramarine);
        }
        
        .payment-option.selected {
          border-color: var(--color-ultramarine);
          box-shadow: 0 0 0 1px var(--color-ultramarine);
        }
        
        .payment-option-radio {
          align-self: flex-start;
        }
        
        .payment-option-logo {
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .payment-option-logo img {
          max-height: 100%;
          max-width: 100%;
          object-fit: contain;
        }
        
        .payment-option-name {
          font-size: 0.9rem;
          text-align: center;
        }
        
        .terms-agreement {
          margin: 24px 0;
        }
        
        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
        }
        
        .checkbox-label input {
          margin-top: 3px;
        }
        
        .checkbox-label input.error {
          outline: 1px solid #dc3545;
        }
        
        .checkbox-label span {
          font-size: 0.9rem;
        }
        
        .checkbox-label a {
          color: var(--color-ultramarine);
          text-decoration: underline;
        }
        
        .payment-error {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 4px;
          margin-top: 16px;
          font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .checkout-container {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          
          .checkout-sidebar {
            position: static;
            order: -1;
          }
          
          .checkout-steps {
            margin: 32px 0;
          }
          
          .step-connector {
            width: 32px;
          }
          
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
          
          .payment-options {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;