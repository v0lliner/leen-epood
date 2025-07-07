import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import OmnivaLogo from '../components/Icons/OmnivaLogo';
import ShopIcon from '../components/Icons/ShopIcon';

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
    notes: '',
    agreeToTerms: false
  });
  
  // Checkout process state
  const [step, setStep] = useState('review'); // review, shipping, payment
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup'); // pickup, omniva-parcel-machine
  const [paymentMethod, setPaymentMethod] = useState('');
  const [omnivaParcelMachines, setOmnivaParcelMachines] = useState([]);
  const [selectedOmnivaParcelMachine, setSelectedOmnivaParcelMachine] = useState(null);
  const [loadingParcelMachines, setLoadingParcelMachines] = useState(false);
  const [parcelMachineError, setParcelMachineError] = useState('');

  // Country code mapping for API requests
  const countryCodeMap = {
    'Estonia': 'ee',
    'Latvia': 'lv',
    'Lithuania': 'lt',
    'Finland': 'fi'
  };

  // Load parcel machines when delivery method is set to omniva and country changes
  useEffect(() => {
    if (deliveryMethod === 'omniva-parcel-machine') {
      loadOmnivaParcelMachines();
    }
  }, [deliveryMethod, formData.country]);

  // Load Omniva parcel machines
  const loadOmnivaParcelMachines = async () => {
    setLoadingParcelMachines(true);
    setParcelMachineError('');
    setOmnivaParcelMachines([]);
    setSelectedOmnivaParcelMachine(null);
    
    try {
      // Get country code from mapping
      const countryCode = countryCodeMap[formData.country] || 'ee';
      console.log('Loading Omniva parcel machines for country:', countryCode);
      
      const response = await fetch(`/php/get-omniva-parcel-machines.php?country=${countryCode}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Omniva parcel machines response:', data);
      
      if (data.success && data.parcelMachines && data.parcelMachines.length > 0) {
        setOmnivaParcelMachines(data.parcelMachines);
      } else {
        setParcelMachineError(t('checkout.shipping.omniva.no_machines'));
      }
    } catch (error) {
      console.error('Error loading Omniva parcel machines:', error);
      setParcelMachineError(t('checkout.shipping.omniva.fetch_error'));
    } finally {
      setLoadingParcelMachines(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle delivery method change
  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);
    
    // Reset selected parcel machine when changing delivery method
    if (method !== 'omniva-parcel-machine') {
      setSelectedOmnivaParcelMachine(null);
    }
  };

  // Handle parcel machine selection
  const handleParcelMachineChange = (e) => {
    const machineId = e.target.value;
    if (!machineId) {
      setSelectedOmnivaParcelMachine(null);
      return;
    }
    
    const machine = omnivaParcelMachines.find(m => m.id === machineId);
    if (machine) {
      setSelectedOmnivaParcelMachine(machine);
    }
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
    
    // Delivery method specific validation
    if (deliveryMethod === 'omniva-parcel-machine' && !selectedOmnivaParcelMachine) {
      setError(t('checkout.shipping.omniva.required'));
      return false;
    }
    
    if (deliveryMethod === 'courier' && (!formData.address || !formData.city || !formData.postalCode)) {
      setError(t('checkout.error.required_fields'));
      return false;
    }
    
    // Terms agreement validation
    if (!formData.agreeToTerms) {
      setError(t('checkout.terms.required'));
      return false;
    }
    
    return true;
  };

  // Handle checkout
  const handleCheckout = async (e) => {
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
        country: formData.country,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price.replace('€', '')),
          quantity: 1
        })),
        amount: getTotalPrice(),
        reference: `ORD-${Date.now()}`,
        deliveryMethod: deliveryMethod,
        return_url: `${window.location.origin}/checkout/success`,
        cancel_url: `${window.location.origin}/checkout`
      };
      
      // Add delivery method specific data
      if (deliveryMethod === 'courier') {
        orderData.address = formData.address;
        orderData.city = formData.city;
        orderData.postalCode = formData.postalCode;
      } else if (deliveryMethod === 'omniva-parcel-machine' && selectedOmnivaParcelMachine) {
        orderData.omnivaParcelMachineId = selectedOmnivaParcelMachine.id;
        orderData.omnivaParcelMachineName = selectedOmnivaParcelMachine.name;
      }
      
      // Add notes if provided
      if (formData.notes) {
        orderData.notes = formData.notes;
      }
      
      console.log('Sending order data:', orderData);
      
      // Process payment
      const response = await fetch('/php/process-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const paymentData = await response.json();
      console.log('Payment response:', paymentData);
      
      if (paymentData.error) {
        throw new Error(paymentData.error);
      }
      
      // Store order details in localStorage for retrieval on success page
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
      
      // Redirect to payment URL
      if (paymentData.paymentUrl) {
        window.location.href = paymentData.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.message || t('checkout.error.network_error'));
      setIsSubmitting(false);
    }
  };

  // Calculate shipping cost
  const getShippingCost = () => {
    switch (deliveryMethod) {
      case 'omniva-parcel-machine':
        return 3.99;
      case 'courier':
        return 5.99;
      case 'pickup':
      default:
        return 0;
    }
  };

  // Calculate total cost
  const getTotalCost = () => {
    return getTotalPrice() + getShippingCost();
  };

  // If cart is empty, redirect to shop
  useEffect(() => {
    if (items.length === 0) {
      navigate('/epood');
    }
  }, [items, navigate]);

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
                <div className={`step ${step === 'review' ? 'active' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">{t('checkout.steps.review')}</span>
                </div>
                <div className="step-connector"></div>
                <div className={`step ${step === 'shipping' ? 'active' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">{t('checkout.steps.shipping')}</span>
                </div>
                <div className="step-connector"></div>
                <div className={`step ${step === 'payment' ? 'active' : ''}`}>
                  <span className="step-number">3</span>
                  <span className="step-label">{t('checkout.steps.payment')}</span>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="checkout-form">
                {/* Step 1: Review */}
                {step === 'review' && (
                  <div className="checkout-step-content">
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
                    
                    <div className="step-actions">
                      <Link to="/epood" className="btn btn-secondary">
                        {t('checkout.review.back_to_shop')}
                      </Link>
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={() => setStep('shipping')}
                      >
                        {t('checkout.review.continue')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Shipping */}
                {step === 'shipping' && (
                  <div className="checkout-step-content">
                    <h2>{t('checkout.shipping.title')}</h2>
                    
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
                    
                    <div className="form-section">
                      <h3>{t('checkout.shipping.address.title')}</h3>
                      
                      <div className="form-row">
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
                            <option value="Latvia">{t('checkout.shipping.address.countries.latvia')}</option>
                            <option value="Lithuania">{t('checkout.shipping.address.countries.lithuania')}</option>
                            <option value="Finland">{t('checkout.shipping.address.countries.finland')}</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="delivery-methods">
                        <div 
                          className={`delivery-method ${deliveryMethod === 'pickup' ? 'active' : ''}`}
                          onClick={() => handleDeliveryMethodChange('pickup')}
                        >
                          <div className="delivery-method-header">
                            <div className="delivery-method-radio">
                              <input 
                                type="radio" 
                                name="deliveryMethod" 
                                checked={deliveryMethod === 'pickup'} 
                                onChange={() => handleDeliveryMethodChange('pickup')}
                              />
                            </div>
                            <div className="delivery-method-icon">
                              <ShopIcon width={24} height={24} />
                            </div>
                            <div className="delivery-method-title">
                              <h4>Tulen ise järele</h4>
                              <p>Tasuta</p>
                            </div>
                          </div>
                        </div>
                        
                        <div 
                          className={`delivery-method ${deliveryMethod === 'omniva-parcel-machine' ? 'active' : ''}`}
                          onClick={() => handleDeliveryMethodChange('omniva-parcel-machine')}
                        >
                          <div className="delivery-method-header">
                            <div className="delivery-method-radio">
                              <input 
                                type="radio" 
                                name="deliveryMethod" 
                                checked={deliveryMethod === 'omniva-parcel-machine'} 
                                onChange={() => handleDeliveryMethodChange('omniva-parcel-machine')}
                              />
                            </div>
                            <div className="delivery-method-icon">
                              <OmnivaLogo width={24} height={24} />
                            </div>
                            <div className="delivery-method-title">
                              <h4>{t('checkout.shipping.omniva.title')}</h4>
                              <p>{t('checkout.shipping.omniva.price')}</p>
                            </div>
                          </div>
                          
                          {deliveryMethod === 'omniva-parcel-machine' && (
                            <div className="delivery-method-content">
                              <p className="delivery-method-description">
                                {t('checkout.shipping.omniva.description')}
                              </p>
                              
                              <div className="form-group">
                                <label htmlFor="omnivaParcelMachine">
                                  {t('checkout.shipping.omniva.select_machine')} *
                                </label>
                                
                                {loadingParcelMachines ? (
                                  <div className="loading-parcel-machines">
                                    <div className="loading-spinner-small"></div>
                                    <span>{t('checkout.shipping.omniva.loading')}</span>
                                  </div>
                                ) : parcelMachineError ? (
                                  <div className="parcel-machine-error">
                                    {parcelMachineError}
                                  </div>
                                ) : (
                                  <select
                                    id="omnivaParcelMachine"
                                    name="omnivaParcelMachine"
                                    value={selectedOmnivaParcelMachine?.id || ''}
                                    onChange={handleParcelMachineChange}
                                    className="form-input"
                                    required={deliveryMethod === 'omniva-parcel-machine'}
                                  >
                                    <option value="">{t('checkout.shipping.omniva.select_placeholder')}</option>
                                    {omnivaParcelMachines.map(machine => (
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
                        
                        <div 
                          className={`delivery-method ${deliveryMethod === 'courier' ? 'active' : ''}`}
                          onClick={() => handleDeliveryMethodChange('courier')}
                        >
                          <div className="delivery-method-header">
                            <div className="delivery-method-radio">
                              <input 
                                type="radio" 
                                name="deliveryMethod" 
                                checked={deliveryMethod === 'courier'} 
                                onChange={() => handleDeliveryMethodChange('courier')}
                              />
                            </div>
                            <div className="delivery-method-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3H8.5L10.5 12H18.5L21 6H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10 16.5C10 17.3284 9.32843 18 8.5 18C7.67157 18 7 17.3284 7 16.5C7 15.6716 7.67157 15 8.5 15C9.32843 15 10 15.6716 10 16.5Z" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M21 16.5C21 17.3284 20.3284 18 19.5 18C18.6716 18 18 17.3284 18 16.5C18 15.6716 18.6716 15 19.5 15C20.3284 15 21 15.6716 21 16.5Z" stroke="currentColor" strokeWidth="1.5"/>
                              </svg>
                            </div>
                            <div className="delivery-method-title">
                              <h4>{t('checkout.shipping.courier.title')}</h4>
                              <p>{t('checkout.shipping.courier.price')}</p>
                            </div>
                          </div>
                          
                          {deliveryMethod === 'courier' && (
                            <div className="delivery-method-content">
                              <p className="delivery-method-description">
                                {t('checkout.shipping.courier.description')}
                              </p>
                              
                              <div className="form-group">
                                <label htmlFor="address">{t('checkout.shipping.courier.address')} *</label>
                                <input
                                  type="text"
                                  id="address"
                                  name="address"
                                  value={formData.address}
                                  onChange={handleInputChange}
                                  placeholder={t('checkout.shipping.courier.address_placeholder')}
                                  required={deliveryMethod === 'courier'}
                                  className="form-input"
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
                                    placeholder={t('checkout.shipping.address.city_placeholder')}
                                    required={deliveryMethod === 'courier'}
                                    className="form-input"
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
                                    placeholder={t('checkout.shipping.address.postal_code_placeholder')}
                                    required={deliveryMethod === 'courier'}
                                    className="form-input"
                                  />
                                </div>
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
                          placeholder={t('checkout.shipping.notes.notes_placeholder')}
                          className="form-input"
                          rows="3"
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="form-section">
                      <div className="form-group checkbox-group">
                        <input
                          type="checkbox"
                          id="agreeToTerms"
                          name="agreeToTerms"
                          checked={formData.agreeToTerms}
                          onChange={handleInputChange}
                          className="form-checkbox"
                        />
                        <label htmlFor="agreeToTerms" className="checkbox-label">
                          {t('checkout.terms.agree')} <Link to="/muugitingimused" target="_blank" className="terms-link">{t('checkout.terms.terms_link')}</Link>
                        </label>
                      </div>
                    </div>
                    
                    {error && (
                      <div className="form-error">
                        {error}
                      </div>
                    )}
                    
                    <div className="step-actions">
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setStep('review')}
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

              {/* Order Summary */}
              <div className="order-summary">
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
                  
                  <div className="summary-subtotal">
                    <span>{t('checkout.summary.subtotal')}</span>
                    <span>{getTotalPrice().toFixed(2)}€</span>
                  </div>
                  
                  <div className="summary-shipping">
                    <span>{t('checkout.summary.shipping')}</span>
                    <span>{getShippingCost().toFixed(2)}€</span>
                  </div>
                  
                  <div className="summary-total">
                    <span>{t('checkout.summary.total')}</span>
                    <span>{getTotalCost().toFixed(2)}€</span>
                  </div>
                  
                  <div className="summary-info">
                    <div className="info-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{t('checkout.summary.info.secure')}</span>
                    </div>
                    <div className="info-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{t('checkout.summary.info.shipping')}</span>
                    </div>
                    <div className="info-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
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
          grid-template-columns: 1fr 350px;
          gap: 48px;
          margin-top: 48px;
        }

        .checkout-steps {
          display: flex;
          align-items: center;
          margin-bottom: 48px;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #f0f0f0;
          color: #666;
          font-weight: 600;
          font-family: var(--font-heading);
        }

        .step.active .step-number {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .step-label {
          font-weight: 500;
          color: #666;
        }

        .step.active .step-label {
          color: var(--color-ultramarine);
          font-weight: 600;
        }

        .step-connector {
          flex: 1;
          height: 2px;
          background-color: #f0f0f0;
          margin: 0 16px;
        }

        .checkout-step-content {
          margin-bottom: 32px;
        }

        .checkout-step-content h2 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 500;
          margin-bottom: 32px;
          color: var(--color-ultramarine);
        }

        .cart-items {
          margin-bottom: 32px;
        }

        .cart-item {
          display: flex;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .cart-item:last-child {
          border-bottom: none;
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

        .step-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
        }

        .form-section {
          margin-bottom: 32px;
        }

        .form-section h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-text);
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

        .checkbox-group {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .form-checkbox {
          margin-top: 4px;
        }

        .checkbox-label {
          font-weight: normal;
        }

        .terms-link {
          color: var(--color-ultramarine);
          text-decoration: underline;
        }

        .form-error {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }

        .delivery-methods {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 24px;
        }

        .delivery-method {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.2s ease;
          cursor: pointer;
        }

        .delivery-method.active {
          border-color: var(--color-ultramarine);
        }

        .delivery-method-header {
          display: flex;
          align-items: center;
          padding: 16px;
          gap: 16px;
          background-color: #f9f9f9;
        }

        .delivery-method.active .delivery-method-header {
          background-color: rgba(47, 62, 156, 0.05);
        }

        .delivery-method-radio {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delivery-method-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background-color: white;
          border-radius: 4px;
          color: var(--color-ultramarine);
        }

        .delivery-method-title {
          flex: 1;
        }

        .delivery-method-title h4 {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 4px;
          color: var(--color-text);
        }

        .delivery-method-title p {
          font-size: 0.9rem;
          color: var(--color-ultramarine);
          font-weight: 500;
          margin: 0;
        }

        .delivery-method-content {
          padding: 16px;
          border-top: 1px solid #f0f0f0;
        }

        .delivery-method-description {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 16px;
        }

        .loading-parcel-machines {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 0;
          color: #666;
        }

        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid var(--color-ultramarine);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .parcel-machine-error {
          color: #c33;
          font-size: 0.9rem;
          margin-bottom: 8px;
        }

        .order-summary {
          position: sticky;
          top: 32px;
          align-self: flex-start;
        }

        .summary-card {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 24px;
        }

        .summary-card h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-text);
        }

        .summary-items {
          margin-bottom: 24px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .item-name {
          font-size: 0.9rem;
          color: var(--color-text);
        }

        .item-price {
          font-weight: 500;
          color: var(--color-text);
        }

        .summary-subtotal,
        .summary-shipping {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-top: 1px solid #eee;
          font-size: 0.9rem;
          color: #666;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          padding: 16px 0;
          border-top: 1px solid #eee;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 1.125rem;
          color: var(--color-text);
          margin-bottom: 24px;
        }

        .summary-info {
          background-color: #f0f4ff;
          padding: 16px;
          border-radius: 8px;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 0.85rem;
          color: #666;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .info-item svg {
          margin-top: 2px;
          flex-shrink: 0;
          color: var(--color-ultramarine);
        }

        .btn {
          padding: 12px 24px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
          border: none;
          font-size: 1rem;
          text-decoration: none;
          display: inline-block;
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

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .checkout-steps {
            margin-bottom: 32px;
          }

          .step-label {
            font-size: 0.9rem;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .step-actions {
            flex-direction: column;
            gap: 16px;
          }

          .step-actions .btn {
            width: 100%;
          }

          .order-summary {
            position: static;
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;