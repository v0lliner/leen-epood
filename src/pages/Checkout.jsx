import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const [step, setStep] = useState('review');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [parcelMachines, setParcelMachines] = useState([]);
  const [loadingParcelMachines, setLoadingParcelMachines] = useState(false);
  const [parcelMachineError, setParcelMachineError] = useState('');
  const [selectedParcelMachine, setSelectedParcelMachine] = useState('');
  const [shippingMethod, setShippingMethod] = useState('home'); // 'home' or 'parcel'
  const formRef = useRef(null);
  
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

  useEffect(() => {
    // Reset error when step changes
    setError('');
  }, [step]);

  useEffect(() => {
    // Load parcel machines when shipping method is 'parcel'
    if (shippingMethod === 'parcel') {
      loadParcelMachines();
    }
  }, [shippingMethod, formData.country]);

  const loadParcelMachines = async () => {
    setLoadingParcelMachines(true);
    setParcelMachineError('');
    
    try {
      // Get country code from country name
      const countryMap = {
        'Estonia': 'ee',
        'Latvia': 'lv',
        'Lithuania': 'lt',
        'Finland': 'fi'
      };
      
      const countryCode = countryMap[formData.country] || 'ee';
      
      const response = await fetch(`/php/get-parcel-machines.php?country=${countryCode}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.destinations) {
        setParcelMachines(data.destinations);
        // Reset selected parcel machine when country changes
        setSelectedParcelMachine('');
      } else {
        setParcelMachineError(data.error || 'Failed to load parcel machines');
      }
    } catch (error) {
      console.error('Error loading parcel machines:', error);
      setParcelMachineError('Failed to load parcel machines. Please try again.');
    } finally {
      setLoadingParcelMachines(false);
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
  };

  const handleShippingMethodChange = (method) => {
    setShippingMethod(method);
  };

  const handleParcelMachineChange = (e) => {
    setSelectedParcelMachine(e.target.value);
  };

  const validateForm = () => {
    // Basic validation
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    
    // Add address validation if shipping method is 'home'
    if (shippingMethod === 'home') {
      requiredFields.push('address', 'city', 'postalCode');
    } else if (shippingMethod === 'parcel' && !selectedParcelMachine) {
      setError(t('checkout.shipping.parcel.required'));
      return false;
    }
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(t('checkout.error.required_fields'));
        return false;
      }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('checkout.error.invalid_email'));
      return false;
    }
    
    // Terms agreement validation
    if (!formData.agreeToTerms) {
      setError(t('checkout.terms.required'));
      return false;
    }
    
    return true;
  };

  const handleContinueToShipping = () => {
    if (items.length === 0) {
      setError(t('checkout.error.empty_cart'));
      return;
    }
    
    setStep('shipping');
  };

  const handleBackToReview = () => {
    setStep('review');
  };

  const handleContinueToPayment = () => {
    if (!validateForm()) {
      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setStep('payment');
    loadPaymentMethods();
  };

  const handleBackToShipping = () => {
    setStep('shipping');
  };

  const loadPaymentMethods = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate loading payment methods
      // In a real implementation, you would fetch this from your payment provider
      setTimeout(() => {
        setPaymentMethods([
          { id: 'swedbank', name: 'Swedbank', type: 'bank' },
          { id: 'seb', name: 'SEB', type: 'bank' },
          { id: 'lhv', name: 'LHV', type: 'bank' },
          { id: 'coop', name: 'Coop Pank', type: 'bank' },
          { id: 'luminor', name: 'Luminor', type: 'bank' },
          { id: 'card', name: 'Pangakaart', type: 'card' }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setError('Failed to load payment methods');
      setLoading(false);
    }
  };

  const handlePaymentMethodChange = (methodId) => {
    setSelectedPaymentMethod(methodId);
    // Clear error when user selects a payment method
    if (error) setError('');
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!selectedPaymentMethod) {
      setError(t('checkout.payment.method_required'));
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Prepare shipping address based on shipping method
      let shippingAddress = '';
      
      if (shippingMethod === 'home') {
        shippingAddress = formData.address;
      } else if (shippingMethod === 'parcel') {
        // Find selected parcel machine
        const selectedMachine = parcelMachines.find(pm => pm.id === selectedParcelMachine);
        if (selectedMachine) {
          shippingAddress = `Pakiautomaat: ${selectedMachine.name}, ${selectedMachine.address}`;
        }
      }
      
      // Prepare payment data
      const paymentData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: shippingAddress,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        notes: formData.notes,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price.replace('€', '')),
          quantity: 1
        })),
        amount: getTotalPrice().toFixed(2),
        reference: `order-${Date.now()}`,
        paymentMethod: selectedPaymentMethod,
        return_url: `${window.location.origin}/checkout/success`,
        cancel_url: `${window.location.origin}/checkout`
      };
      
      console.log('Sending payment request:', paymentData);
      
      // Send payment request to backend
      const response = await fetch('/php/process-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log('Payment response:', result);
      
      // Store order details in localStorage for retrieval on success page
      const orderDetails = {
        orderReference: paymentData.reference,
        orderAmount: paymentData.amount,
        customerEmail: paymentData.email,
        timestamp: Date.now(),
        orderItems: paymentData.items
      };
      
      localStorage.setItem('pendingOrder', JSON.stringify(orderDetails));
      
      // Redirect to payment URL
      if (result.paymentUrl) {
        setPaymentUrl(result.paymentUrl);
        window.location.href = result.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || t('checkout.error.session_failed'));
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <>
        <SEOHead page="shop" />
        <main>
          <section className="section-large">
            <div className="container">
              <FadeInSection>
                <div className="empty-cart">
                  <h1>{t('checkout.title')}</h1>
                  <p>{t('cart.empty')}</p>
                  <button 
                    onClick={() => navigate('/epood')}
                    className="btn btn-primary"
                  >
                    {t('cart.back_to_shop')}
                  </button>
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
            padding: 48px 0;
          }

          .empty-cart h1 {
            margin-bottom: 24px;
          }

          .empty-cart p {
            margin-bottom: 32px;
            color: #666;
          }

          .btn {
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            font-family: var(--font-body);
            font-weight: 500;
            transition: opacity 0.2s ease;
            display: inline-block;
            border: none;
            cursor: pointer;
            font-size: 1rem;
          }

          .btn-primary {
            background-color: var(--color-ultramarine);
            color: white;
          }

          .btn:hover {
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
              <h1 className="checkout-title">{t('checkout.title')}</h1>
              
              {/* Checkout Steps */}
              <div className="checkout-steps">
                <div className={`step ${step === 'review' ? 'active' : ''} ${step === 'shipping' || step === 'payment' ? 'completed' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-name">{t('checkout.steps.review')}</span>
                </div>
                <div className={`step ${step === 'shipping' ? 'active' : ''} ${step === 'payment' ? 'completed' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-name">{t('checkout.steps.shipping')}</span>
                </div>
                <div className={`step ${step === 'payment' ? 'active' : ''}`}>
                  <span className="step-number">3</span>
                  <span className="step-name">{t('checkout.steps.payment')}</span>
                </div>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </FadeInSection>

            <div className="checkout-layout">
              {/* Main Content */}
              <div className="checkout-main">
                <FadeInSection>
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
                        <button 
                          onClick={() => navigate('/epood')}
                          className="btn btn-secondary"
                        >
                          {t('checkout.review.back_to_shop')}
                        </button>
                        <button 
                          onClick={handleContinueToShipping}
                          className="btn btn-primary"
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
                      
                      <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
                        {/* Contact Information */}
                        <div className="form-section">
                          <h3>{t('checkout.shipping.contact.title')}</h3>
                          
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="firstName">{t('checkout.shipping.contact.name')} *</label>
                              <div className="name-fields">
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
                                <input
                                  type="text"
                                  id="lastName"
                                  name="lastName"
                                  value={formData.lastName}
                                  onChange={handleInputChange}
                                  placeholder="Perekonnanimi"
                                  required
                                  className="form-input"
                                />
                              </div>
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
                          <h3>Tarneviis</h3>
                          
                          <div className="shipping-methods">
                            <div 
                              className={`shipping-method ${shippingMethod === 'home' ? 'active' : ''}`}
                              onClick={() => handleShippingMethodChange('home')}
                            >
                              <div className="method-radio">
                                <div className={`radio-inner ${shippingMethod === 'home' ? 'selected' : ''}`}></div>
                              </div>
                              <div className="method-info">
                                <h4>Kullerteenus</h4>
                                <p>Tarne koju või kontorisse</p>
                                <p className="method-price">5.90€</p>
                              </div>
                            </div>
                            
                            <div 
                              className={`shipping-method ${shippingMethod === 'parcel' ? 'active' : ''}`}
                              onClick={() => handleShippingMethodChange('parcel')}
                            >
                              <div className="method-radio">
                                <div className={`radio-inner ${shippingMethod === 'parcel' ? 'selected' : ''}`}></div>
                              </div>
                              <div className="method-info">
                                <h4>Pakiautomaati</h4>
                                <p>Tarne lähimasse pakiautomaati</p>
                                <p className="method-price">3.90€</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Shipping Address */}
                        <div className="form-section">
                          <h3>{t('checkout.shipping.address.title')}</h3>
                          
                          {shippingMethod === 'home' ? (
                            <>
                              <div className="form-group">
                                <label htmlFor="address">{t('checkout.shipping.address.address')} *</label>
                                <input
                                  type="text"
                                  id="address"
                                  name="address"
                                  value={formData.address}
                                  onChange={handleInputChange}
                                  placeholder={t('checkout.shipping.address.address_placeholder')}
                                  required={shippingMethod === 'home'}
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
                                    required={shippingMethod === 'home'}
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
                                    required={shippingMethod === 'home'}
                                    className="form-input"
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="form-group">
                              <label htmlFor="parcelMachine">Vali pakiautomaat *</label>
                              {loadingParcelMachines ? (
                                <div className="loading-text">Laen pakiautomaate...</div>
                              ) : parcelMachineError ? (
                                <div className="error-text">{parcelMachineError}</div>
                              ) : (
                                <select
                                  id="parcelMachine"
                                  name="parcelMachine"
                                  value={selectedParcelMachine}
                                  onChange={handleParcelMachineChange}
                                  className="form-input"
                                  required={shippingMethod === 'parcel'}
                                >
                                  <option value="">Vali pakiautomaat</option>
                                  {parcelMachines.map(machine => (
                                    <option key={machine.id} value={machine.id}>
                                      {machine.name} - {machine.address}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                          
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
                        
                        {/* Additional Information */}
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
                              rows="4"
                            ></textarea>
                          </div>
                        </div>
                        
                        {/* Terms Agreement */}
                        <div className="form-section">
                          <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                name="agreeToTerms"
                                checked={formData.agreeToTerms}
                                onChange={handleInputChange}
                                className="form-checkbox"
                              />
                              <span>
                                {t('checkout.terms.agree')} <a href="/muugitingimused" target="_blank" rel="noopener noreferrer">{t('checkout.terms.terms_link')}</a>
                              </span>
                            </label>
                          </div>
                        </div>
                        
                        <div className="shipping-actions">
                          <button 
                            onClick={handleBackToReview}
                            className="btn btn-secondary"
                          >
                            {t('checkout.shipping.back')}
                          </button>
                          <button 
                            onClick={handleContinueToPayment}
                            className="btn btn-primary"
                          >
                            {t('checkout.shipping.continue')}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Step 3: Payment */}
                  {step === 'payment' && (
                    <div className="checkout-payment">
                      <h2>{t('checkout.payment.title')}</h2>
                      
                      {loading ? (
                        <div className="loading-container">
                          <div className="loading-spinner"></div>
                          <p>{t('checkout.payment.loading_methods')}</p>
                        </div>
                      ) : error ? (
                        <div className="payment-error">
                          <p>{t('checkout.payment.methods_error')}</p>
                          <button 
                            onClick={loadPaymentMethods}
                            className="btn btn-secondary"
                          >
                            {t('checkout.payment.retry')}
                          </button>
                        </div>
                      ) : paymentMethods.length === 0 ? (
                        <div className="payment-error">
                          <p>{t('checkout.payment.no_methods')}</p>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitPayment}>
                          <div className="payment-methods-container">
                            <h3>{t('checkout.payment.select_method')}</h3>
                            
                            <div className="payment-methods-wrapper">
                              <div className="payment-methods-tabs">
                                {paymentMethods.filter(m => m.type === 'bank').map(method => (
                                  <button
                                    key={method.id}
                                    type="button"
                                    className={`payment-method-tab ${selectedPaymentMethod === method.id ? 'active' : ''}`}
                                    onClick={() => handlePaymentMethodChange(method.id)}
                                  >
                                    <span className="bank-name">{method.name}</span>
                                  </button>
                                ))}
                              </div>
                              
                              <div className="payment-methods-content">
                                <div className="payment-method-description">
                                  <p>Maksmine toimub panga turvalises keskkonnas.</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="payment-methods-other">
                              {paymentMethods.filter(m => m.type === 'card').map(method => (
                                <button
                                  key={method.id}
                                  type="button"
                                  className={`payment-method-card ${selectedPaymentMethod === method.id ? 'active' : ''}`}
                                  onClick={() => handlePaymentMethodChange(method.id)}
                                >
                                  <span className="card-name">{method.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="payment-actions">
                            <button 
                              type="button"
                              onClick={handleBackToShipping}
                              className="btn btn-secondary"
                            >
                              {t('checkout.shipping.back')}
                            </button>
                            <button 
                              type="submit"
                              className="btn btn-primary"
                              disabled={loading || !selectedPaymentMethod}
                            >
                              {loading ? t('checkout.payment.processing') : t('checkout.payment.proceed')}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </FadeInSection>
              </div>
              
              {/* Order Summary */}
              <div className="checkout-sidebar">
                <FadeInSection>
                  <div className="order-summary">
                    <h3>{t('checkout.summary.title')}</h3>
                    
                    <div className="summary-items">
                      {items.map((item) => (
                        <div key={item.id} className="summary-item">
                          <div className="summary-item-info">
                            <span className="summary-item-title">{item.title}</span>
                            <span className="summary-item-price">{item.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="summary-totals">
                      <div className="summary-row">
                        <span>{t('checkout.summary.subtotal')}</span>
                        <span>{getTotalPrice().toFixed(2)}€</span>
                      </div>
                      <div className="summary-row">
                        <span>{t('checkout.summary.shipping')}</span>
                        <span>{shippingMethod === 'home' ? '5.90€' : '3.90€'}</span>
                      </div>
                      <div className="summary-row total">
                        <span>{t('checkout.summary.total')}</span>
                        <span>
                          {(getTotalPrice() + (shippingMethod === 'home' ? 5.9 : 3.9)).toFixed(2)}€
                        </span>
                      </div>
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
                </FadeInSection>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .checkout-title {
          text-align: center;
          margin-bottom: 48px;
        }

        .checkout-steps {
          display: flex;
          justify-content: center;
          margin-bottom: 48px;
          position: relative;
        }

        .checkout-steps::before {
          content: '';
          position: absolute;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 2px;
          background-color: #e0e0e0;
          z-index: 0;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 120px;
          position: relative;
          z-index: 1;
        }

        .step-number {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #f0f0f0;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-weight: 500;
          margin-bottom: 8px;
          transition: all 0.3s ease;
        }

        .step.active .step-number {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .step.completed .step-number {
          background-color: #4caf50;
          color: white;
        }

        .step-name {
          font-family: var(--font-heading);
          font-size: 0.9rem;
          color: #666;
          transition: all 0.3s ease;
        }

        .step.active .step-name {
          color: var(--color-ultramarine);
          font-weight: 500;
        }

        .step.completed .step-name {
          color: #4caf50;
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 32px;
          text-align: center;
        }

        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 48px;
          align-items: start;
        }

        .checkout-main {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .checkout-main h2 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          color: var(--color-ultramarine);
          margin-bottom: 32px;
        }

        .checkout-main h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          color: var(--color-text);
          margin-bottom: 16px;
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

        .review-actions,
        .shipping-actions,
        .payment-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #f0f0f0;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-family: var(--font-body);
          font-weight: 500;
          transition: opacity 0.2s ease;
          display: inline-block;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn:disabled {
          opacity: 0.5;
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

        .btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .form-section {
          margin-bottom: 32px;
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

        .name-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .checkbox-group {
          display: flex;
          align-items: flex-start;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
        }

        .form-checkbox {
          margin-top: 3px;
        }

        .checkbox-label a {
          color: var(--color-ultramarine);
          text-decoration: underline;
        }

        .shipping-methods {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .shipping-method {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .shipping-method:hover {
          border-color: var(--color-ultramarine);
        }

        .shipping-method.active {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .method-radio {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .shipping-method.active .method-radio {
          border-color: var(--color-ultramarine);
        }

        .radio-inner {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: transparent;
        }

        .radio-inner.selected {
          background-color: var(--color-ultramarine);
        }

        .method-info {
          flex: 1;
        }

        .method-info h4 {
          font-family: var(--font-heading);
          font-size: 1rem;
          margin-bottom: 4px;
          color: var(--color-text);
        }

        .method-info p {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
        }

        .method-price {
          font-weight: 500;
          color: var(--color-ultramarine) !important;
          margin-top: 4px !important;
        }

        .loading-text,
        .error-text {
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

        .checkout-sidebar {
          position: sticky;
          top: 100px;
        }

        .order-summary {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }

        .order-summary h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          color: var(--color-ultramarine);
          margin-bottom: 24px;
        }

        .summary-items {
          margin-bottom: 24px;
        }

        .summary-item {
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .summary-item:last-child {
          border-bottom: none;
        }

        .summary-item-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .summary-item-title {
          font-size: 0.9rem;
          color: var(--color-text);
        }

        .summary-item-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
        }

        .summary-totals {
          margin-bottom: 24px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
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
          font-size: 1.1rem;
          color: var(--color-text);
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }

        .summary-info {
          background-color: #f8f9fa;
          padding: 16px;
          border-radius: 4px;
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

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 0;
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

        .payment-error {
          text-align: center;
          padding: 32px 0;
        }

        .payment-error p {
          margin-bottom: 16px;
          color: #666;
        }

        .payment-methods-container {
          margin-bottom: 32px;
        }

        .payment-methods-wrapper {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .payment-methods-tabs {
          display: flex;
          border-bottom: 1px solid #ddd;
          background-color: #f8f9fa;
          flex-wrap: wrap;
          max-width: 100%;
        }

        .payment-method-tab {
          padding: 12px 16px;
          background: none;
          border: none;
          border-right: 1px solid #ddd;
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 1;
          min-width: 100px;
          text-align: center;
          white-space: nowrap;
        }

        .payment-method-tab:last-child {
          border-right: none;
        }

        .payment-method-tab:hover {
          background-color: #f0f0f0;
        }

        .payment-method-tab.active {
          background-color: white;
          color: var(--color-ultramarine);
          font-weight: 500;
          box-shadow: inset 0 -2px 0 var(--color-ultramarine);
        }

        .payment-methods-content {
          padding: 24px;
        }

        .payment-method-description {
          color: #666;
          font-size: 0.9rem;
        }

        .payment-methods-other {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .payment-method-card {
          flex: 1;
          min-width: 120px;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: none;
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .payment-method-card:hover {
          border-color: var(--color-ultramarine);
        }

        .payment-method-card.active {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
          color: var(--color-ultramarine);
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .checkout-sidebar {
            position: static;
            order: -1;
          }

          .checkout-steps {
            margin-bottom: 32px;
          }

          .checkout-steps::before {
            width: 70%;
          }

          .step {
            width: 100px;
          }

          .step-number {
            width: 40px;
            height: 40px;
            font-size: 0.9rem;
          }

          .step-name {
            font-size: 0.8rem;
          }

          .checkout-main {
            padding: 24px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .name-fields {
            grid-template-columns: 1fr;
          }

          .review-actions,
          .shipping-actions,
          .payment-actions {
            flex-direction: column;
            gap: 16px;
          }

          .btn {
            width: 100%;
            text-align: center;
          }

          .payment-methods-tabs {
            overflow-x: auto;
            flex-wrap: nowrap;
            max-width: 100%;
          }

          .payment-method-tab {
            flex: 0 0 auto;
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;