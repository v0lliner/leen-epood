import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { shippingSettingsService } from '../utils/supabase/shippingSettings';

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const [step, setStep] = useState('review');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [parcelMachines, setParcelMachines] = useState([]);
  const [loadingParcelMachines, setLoadingParcelMachines] = useState(false);
  const [parcelMachineError, setParcelMachineError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState('');
  const [shippingPrice, setShippingPrice] = useState(3.99);
  const [loadingShippingPrice, setLoadingShippingPrice] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Estonia',
    deliveryMethod: 'omniva-parcel-machine',
    omnivaParcelMachineId: '',
    omnivaParcelMachineName: '',
    paymentMethod: '',
    termsAccepted: false
  });

  // Load shipping price from database
  useEffect(() => {
    const loadShippingPrice = async () => {
      setLoadingShippingPrice(true);
      try {
        const { data, error } = await shippingSettingsService.getOmnivaShippingSettings();
        if (error) {
          console.error('Error loading shipping price:', error);
        } else if (data) {
          setShippingPrice(parseFloat(data.price));
        }
      } catch (err) {
        console.error('Error in loadShippingPrice:', err);
      } finally {
        setLoadingShippingPrice(false);
      }
    };

    loadShippingPrice();
  }, []);

  // Load parcel machines when country changes
  useEffect(() => {
    if (formData.deliveryMethod === 'omniva-parcel-machine') {
      loadParcelMachines();
    }
  }, [formData.country, formData.deliveryMethod]);

  const loadParcelMachines = async () => {
    setLoadingParcelMachines(true);
    setParcelMachineError('');
    
    try {
      // Map country names to country codes
      const countryMap = {
        'Estonia': 'ee',
        'Latvia': 'lv',
        'Lithuania': 'lt',
        'Finland': 'fi'
      };
      
      const countryCode = countryMap[formData.country] || 'ee';
      
      const response = await fetch(`/php/get-omniva-parcel-machines.php?country=${countryCode}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setParcelMachines(data.parcelMachines || []);
      } else {
        setParcelMachineError(data.error || t('checkout.shipping.omniva.fetch_error'));
      }
    } catch (error) {
      console.error('Error loading parcel machines:', error);
      setParcelMachineError(t('checkout.shipping.omniva.fetch_error'));
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

  const handleParcelMachineChange = (e) => {
    const selectedId = e.target.value;
    const selectedMachine = parcelMachines.find(machine => machine.id === selectedId);
    
    setFormData(prev => ({
      ...prev,
      omnivaParcelMachineId: selectedId,
      omnivaParcelMachineName: selectedMachine ? selectedMachine.name : ''
    }));
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
    
    // Payment method validation
    if (!formData.paymentMethod) {
      setError(t('checkout.payment.method_required'));
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
        amount: (getTotalPrice() + shippingPrice).toFixed(2),
        reference,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: formData.country,
        paymentMethod: formData.paymentMethod,
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
      
      // Send payment request to backend
      const response = await fetch('/php/process-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Redirect to payment URL
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || t('checkout.error.network_error'));
      setIsSubmitting(false);
    }
  };

  // Load payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      setLoadingPaymentMethods(true);
      setPaymentMethodsError('');
      
      try {
        // Simulate loading payment methods
        // In a real app, this would be fetched from your payment provider
        setTimeout(() => {
          setPaymentMethods([
            { id: 'swedbank', name: 'Swedbank', type: 'bank' },
            { id: 'seb', name: 'SEB', type: 'bank' },
            { id: 'lhv', name: 'LHV', type: 'bank' },
            { id: 'luminor', name: 'Luminor', type: 'bank' },
            { id: 'coop', name: 'Coop Pank', type: 'bank' }
          ]);
          setLoadingPaymentMethods(false);
        }, 500);
      } catch (error) {
        console.error('Error loading payment methods:', error);
        setPaymentMethodsError(t('checkout.payment.methods_error'));
        setLoadingPaymentMethods(false);
      }
    };
    
    loadPaymentMethods();
  }, [t]);

  // Check if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/epood');
    }
  }, [items, navigate]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render different steps
  const renderStep = () => {
    switch (step) {
      case 'review':
        return (
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
                  </div>
                </div>
              ))}
            </div>
            
            <div className="checkout-actions">
              <Link to="/epood" className="btn btn-secondary" onClick={scrollToTop}>
                {t('checkout.review.back_to_shop')}
              </Link>
              <button 
                onClick={() => setStep('shipping')} 
                className="btn btn-primary"
              >
                {t('checkout.review.continue')}
              </button>
            </div>
          </div>
        );
      
      case 'shipping':
        return (
          <div className="checkout-shipping">
            <h2>{t('checkout.shipping.title')}</h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              setStep('payment');
              scrollToTop();
            }}>
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
              
              {/* Shipping Method */}
              <div className="form-section">
                <h3>Tarneviis</h3>
                
                <div className="shipping-methods">
                  <div className="shipping-method">
                    <input
                      type="radio"
                      id="omniva"
                      name="deliveryMethod"
                      value="omniva-parcel-machine"
                      checked={formData.deliveryMethod === 'omniva-parcel-machine'}
                      onChange={handleInputChange}
                      className="shipping-radio"
                    />
                    <label htmlFor="omniva" className="shipping-label">
                      <div className="shipping-info">
                        <div className="shipping-title">{t('checkout.shipping.omniva.title')}</div>
                        <div className="shipping-description">{t('checkout.shipping.omniva.description')}</div>
                      </div>
                      <div className="shipping-price">
                        {loadingShippingPrice ? '...' : `${shippingPrice.toFixed(2)}€`}
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Omniva Parcel Machine Selector */}
                {formData.deliveryMethod === 'omniva-parcel-machine' && (
                  <div className="parcel-machine-selector">
                    <div className="form-group">
                      <label htmlFor="country">Riik</label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="form-input"
                      >
                        <option value="Estonia">Eesti</option>
                        <option value="Latvia">Läti</option>
                        <option value="Lithuania">Leedu</option>
                        <option value="Finland">Soome</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="omnivaParcelMachineId">{t('checkout.shipping.omniva.select_machine')}</label>
                      {loadingParcelMachines ? (
                        <div className="loading-text">{t('checkout.shipping.omniva.loading')}</div>
                      ) : parcelMachineError ? (
                        <div className="error-text">{parcelMachineError}</div>
                      ) : parcelMachines.length === 0 ? (
                        <div className="error-text">{t('checkout.shipping.omniva.no_machines')}</div>
                      ) : (
                        <select
                          id="omnivaParcelMachineId"
                          name="omnivaParcelMachineId"
                          value={formData.omnivaParcelMachineId}
                          onChange={handleParcelMachineChange}
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
                    </div>
                  </div>
                )}
              </div>
              
              <div className="checkout-actions">
                <button 
                  type="button"
                  onClick={() => setStep('review')}
                  className="btn btn-secondary"
                >
                  {t('checkout.shipping.back')}
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                >
                  {t('checkout.shipping.continue')}
                </button>
              </div>
            </form>
          </div>
        );
      
      case 'payment':
        return (
          <div className="checkout-payment">
            <h2>{t('checkout.payment.title')}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>{t('checkout.payment.select_method')}</h3>
                
                {loadingPaymentMethods ? (
                  <div className="loading-text">{t('checkout.payment.loading_methods')}</div>
                ) : paymentMethodsError ? (
                  <div className="payment-error">
                    <p>{paymentMethodsError}</p>
                    <button 
                      type="button"
                      onClick={() => window.location.reload()}
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
                  <div className="payment-methods">
                    {paymentMethods.map(method => (
                      <div key={method.id} className="payment-method">
                        <input
                          type="radio"
                          id={method.id}
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={handleInputChange}
                          className="payment-radio"
                        />
                        <label htmlFor={method.id} className="payment-label">
                          <div className="payment-info">
                            <div className="payment-name">{method.name}</div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="terms-section">
                <label className="terms-label">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                    className="terms-checkbox"
                  />
                  <span>
                    {t('checkout.terms.agree')} <Link to="/muugitingimused" target="_blank" className="terms-link">{t('checkout.terms.terms_link')}</Link>
                  </span>
                </label>
              </div>
              
              {error && (
                <div className="checkout-error">
                  {error}
                </div>
              )}
              
              <div className="checkout-actions">
                <button 
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  {t('checkout.shipping.back')}
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('checkout.summary.processing') : t('checkout.payment.proceed')}
                </button>
              </div>
            </form>
          </div>
        );
      
      default:
        return null;
    }
  };

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
              <div className="checkout-main">
                {/* Checkout Steps */}
                <div className="checkout-steps">
                  <div className={`checkout-step ${step === 'review' ? 'active' : ''} ${step === 'shipping' || step === 'payment' ? 'completed' : ''}`}>
                    <div className="step-number">1</div>
                    <div className="step-label">{t('checkout.steps.review')}</div>
                  </div>
                  <div className="step-connector"></div>
                  <div className={`checkout-step ${step === 'shipping' ? 'active' : ''} ${step === 'payment' ? 'completed' : ''}`}>
                    <div className="step-number">2</div>
                    <div className="step-label">{t('checkout.steps.shipping')}</div>
                  </div>
                  <div className="step-connector"></div>
                  <div className={`checkout-step ${step === 'payment' ? 'active' : ''}`}>
                    <div className="step-number">3</div>
                    <div className="step-label">{t('checkout.steps.payment')}</div>
                  </div>
                </div>

                {/* Render current step */}
                {renderStep()}
              </div>

              {/* Order Summary */}
              <div className="checkout-sidebar">
                <div className="order-summary">
                  <h3>{t('checkout.summary.title')}</h3>
                  
                  <div className="summary-items">
                    {items.map((item) => (
                      <div key={item.id} className="summary-item">
                        <div className="summary-item-name">{item.title}</div>
                        <div className="summary-item-price">{item.price}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="summary-totals">
                    <div className="summary-row">
                      <div className="summary-label">{t('checkout.summary.subtotal')}</div>
                      <div className="summary-value">{getTotalPrice().toFixed(2)}€</div>
                    </div>
                    
                    <div className="summary-row">
                      <div className="summary-label">{t('checkout.summary.shipping')}</div>
                      <div className="summary-value">
                        {loadingShippingPrice ? '...' : `${shippingPrice.toFixed(2)}€`}
                      </div>
                    </div>
                    
                    <div className="summary-row summary-total">
                      <div className="summary-label">{t('checkout.summary.total')}</div>
                      <div className="summary-value">
                        {loadingShippingPrice 
                          ? '...' 
                          : `${(getTotalPrice() + shippingPrice).toFixed(2)}€`
                        }
                      </div>
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
          margin-bottom: 48px;
        }

        .checkout-step {
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

        .checkout-step.active .step-number {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .checkout-step.completed .step-number {
          background-color: #4CAF50;
          color: white;
        }

        .step-label {
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
        }

        .checkout-step.active .step-label {
          color: var(--color-ultramarine);
          font-weight: 600;
        }

        .step-connector {
          flex: 1;
          height: 2px;
          background-color: #f0f0f0;
          margin: 0 16px;
          margin-bottom: 24px;
        }

        .checkout-review,
        .checkout-shipping,
        .checkout-payment {
          margin-bottom: 48px;
        }

        .checkout-review h2,
        .checkout-shipping h2,
        .checkout-payment h2 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          color: var(--color-ultramarine);
          margin-bottom: 32px;
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
          margin-bottom: 8px;
        }

        .item-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
        }

        .checkout-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-size: 1rem;
          text-decoration: none;
        }

        .btn:disabled {
          opacity: 0.7;
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

        .form-section {
          margin-bottom: 32px;
        }

        .form-section h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          color: var(--color-text);
          margin-bottom: 24px;
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

        .shipping-methods {
          margin-bottom: 24px;
        }

        .shipping-method {
          margin-bottom: 16px;
        }

        .shipping-radio {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .shipping-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .shipping-radio:checked + .shipping-label {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .shipping-info {
          flex: 1;
        }

        .shipping-title {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .shipping-description {
          font-size: 0.9rem;
          color: #666;
        }

        .shipping-price {
          font-weight: 600;
          color: var(--color-ultramarine);
        }

        .parcel-machine-selector {
          margin-top: 16px;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f9f9f9;
        }

        .loading-text {
          padding: 12px;
          color: #666;
          font-style: italic;
        }

        .error-text {
          padding: 12px;
          color: #c33;
          font-style: italic;
        }

        .payment-methods {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .payment-method {
          margin-bottom: 16px;
        }

        .payment-radio {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .payment-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          height: 100%;
        }

        .payment-radio:checked + .payment-label {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .payment-info {
          flex: 1;
          text-align: center;
        }

        .payment-name {
          font-weight: 500;
        }

        .payment-error {
          padding: 16px;
          background-color: #fee;
          border: 1px solid #fcc;
          border-radius: 4px;
          margin-bottom: 24px;
          text-align: center;
        }

        .payment-error p {
          margin-bottom: 16px;
          color: #c33;
        }

        .terms-section {
          margin-bottom: 24px;
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
        }

        .checkout-error {
          padding: 16px;
          background-color: #fee;
          color: #c33;
          border-radius: 4px;
          margin-bottom: 24px;
        }

        .order-summary {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 24px;
          position: sticky;
          top: 100px;
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
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 0.95rem;
        }

        .summary-item-name {
          flex: 1;
          padding-right: 16px;
        }

        .summary-totals {
          border-top: 1px solid #e0e0e0;
          padding-top: 16px;
          margin-bottom: 24px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .summary-total {
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--color-ultramarine);
          border-top: 1px solid #e0e0e0;
          padding-top: 12px;
        }

        .summary-info {
          background-color: #f0f4ff;
          padding: 16px;
          border-radius: 4px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .info-icon {
          font-size: 1.1rem;
        }

        .info-text {
          color: #555;
        }

        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .checkout-steps {
            margin-bottom: 32px;
          }

          .step-number {
            width: 28px;
            height: 28px;
            font-size: 0.9rem;
          }

          .step-label {
            font-size: 0.8rem;
          }

          .step-connector {
            margin: 0 8px;
            margin-bottom: 24px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .payment-methods {
            grid-template-columns: 1fr;
          }

          .checkout-actions {
            flex-direction: column;
            gap: 16px;
          }

          .checkout-actions .btn {
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