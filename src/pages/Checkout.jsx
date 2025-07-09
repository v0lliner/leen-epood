import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Checkout = () => {
  const { t } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Estonia',
    deliveryMethod: '',
    omnivaParcelMachineId: '',
    omnivaParcelMachineName: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parcelMachines, setParcelMachines] = useState([]);
  const [loadingParcelMachines, setLoadingParcelMachines] = useState(false);
  const [parcelMachinesError, setParcelMachinesError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'bank_ee_lhv', name: 'LHV Pank', type: 'bank' },
    { id: 'bank_ee_swedbank', name: 'Swedbank', type: 'bank' },
    { id: 'bank_ee_seb', name: 'SEB Pank', type: 'bank' },
    { id: 'bank_ee_coop', name: 'Coop Pank', type: 'bank' },
    { id: 'card', name: 'Pangakaart (Visa/Mastercard)', type: 'card' }
  ]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');
  const navigate = useNavigate();

  // Get country code for Omniva API
  const getCountryCode = (country) => {
    const countryMap = {
      'Estonia': 'ee',
      'Latvia': 'lv',
      'Lithuania': 'lt',
      'Finland': 'fi'
    };
    return countryMap[country] || 'ee';
  };

  // Load parcel machines when country changes or delivery method is selected
  useEffect(() => {
    if (formData.deliveryMethod === 'omniva-parcel-machine') {
      fetchParcelMachines(getCountryCode(formData.country));
    }
  }, [formData.country, formData.deliveryMethod]);

  // Fetch parcel machines from API
  const fetchParcelMachines = async (countryCode) => {
    setLoadingParcelMachines(true);
    setParcelMachinesError('');
    
    try {
      const response = await fetch(`/php/get-omniva-parcel-machines.php?country=${countryCode}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setParcelMachines(data.parcelMachines);
      } else {
        setParcelMachinesError(data.error || t('checkout.shipping.omniva.fetch_error'));
      }
    } catch (error) {
      console.error('Error fetching parcel machines:', error);
      setParcelMachinesError(t('checkout.shipping.omniva.fetch_error'));
    } finally {
      setLoadingParcelMachines(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear related errors when field is changed
    setFormErrors(prev => ({
      ...prev,
      [name]: ''
    }));
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Special handling for certain fields
      if (name === 'deliveryMethod') {
        // Reset parcel machine selection when delivery method changes
        if (value !== 'omniva-parcel-machine') {
          setFormData(prev => ({
            ...prev,
            omnivaParcelMachineId: '',
            omnivaParcelMachineName: ''
          }));
        }
      } else if (name === 'omnivaParcelMachineId' && value) {
        // Set parcel machine name when ID is selected
        const selectedMachine = parcelMachines.find(machine => machine.id === value);
        if (selectedMachine) {
          setFormData(prev => ({
            ...prev,
            omnivaParcelMachineName: `${selectedMachine.name} (${selectedMachine.address})`
          }));
        }
      }
    }
  };

  // Handle country change
  const handleCountryChange = (e) => {
    const country = e.target.value;
    setFormData(prev => ({
      ...prev,
      country,
      // Reset parcel machine when country changes
      omnivaParcelMachineId: '',
      omnivaParcelMachineName: ''
    }));
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (methodId) => {
    setSelectedPaymentMethod(methodId);
    setPaymentError('');
  };

  // Handle terms acceptance
  const handleTermsChange = (e) => {
    setTermsAccepted(e.target.checked);
    setTermsError('');
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
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
    
    // Payment method validation
    if (!selectedPaymentMethod) {
      setPaymentError(t('checkout.payment.method_required'));
      return false;
    }
    
    // Terms acceptance validation
    if (!termsAccepted) {
      setTermsError(t('checkout.terms.required'));
      return false;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Process payment
  const processPayment = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare order data
      const orderData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        paymentMethod: selectedPaymentMethod,
        amount: getTotalPrice().toFixed(2),
        reference: `ORDER-${Date.now()}`,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price.replace('€', '')),
          quantity: 1
        })),
        deliveryMethod: formData.deliveryMethod,
        omnivaParcelMachineId: formData.omnivaParcelMachineId,
        omnivaParcelMachineName: formData.omnivaParcelMachineName,
        notes: formData.notes
      };
      
      // Call payment processing endpoint
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
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Store order info in localStorage for retrieval on success page
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
      
      // Clear cart
      clearCart();
      
      // Redirect to payment URL
      window.location.href = data.paymentUrl;
      
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentError(error.message || t('checkout.error.network_error'));
    } finally {
      setIsSubmitting(false);
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
              <h1 className="text-center">{t('checkout.title')}</h1>
            </FadeInSection>

            <div className="checkout-content">
              <div className="checkout-form">
                <h2>{t('checkout.shipping.title')}</h2>
                
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
                        className={formErrors.firstName ? 'form-input error' : 'form-input'}
                      />
                      {formErrors.firstName && <div className="error-message">{formErrors.firstName}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="lastName">Perekonnanimi</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Teie perekonnanimi"
                        className={formErrors.lastName ? 'form-input error' : 'form-input'}
                      />
                      {formErrors.lastName && <div className="error-message">{formErrors.lastName}</div>}
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
                        className={formErrors.email ? 'form-input error' : 'form-input'}
                      />
                      {formErrors.email && <div className="error-message">{formErrors.email}</div>}
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
                        className={formErrors.phone ? 'form-input error' : 'form-input'}
                      />
                      {formErrors.phone && <div className="error-message">{formErrors.phone}</div>}
                    </div>
                  </div>
                </div>
                
                {/* Country Selection */}
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="country">{t('checkout.shipping.address.country')}</label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleCountryChange}
                      className="form-input"
                    >
                      <option value="Estonia">{t('checkout.shipping.address.countries.estonia')}</option>
                      <option value="Latvia">{t('checkout.shipping.address.countries.latvia')}</option>
                      <option value="Lithuania">{t('checkout.shipping.address.countries.lithuania')}</option>
                      <option value="Finland">{t('checkout.shipping.address.countries.finland')}</option>
                    </select>
                  </div>
                </div>
                
                {/* Delivery Method */}
                <div className="form-section">
                  <h3>Tarneviis</h3>
                  
                  <div className="delivery-methods">
                    {/* Omniva Parcel Machine */}
                    <div 
                      className={`delivery-method ${formData.deliveryMethod === 'omniva-parcel-machine' ? 'selected' : ''}`}
                      onClick={() => handleInputChange({ target: { name: 'deliveryMethod', value: 'omniva-parcel-machine' } })}
                    >
                      <div className="delivery-method-header">
                        <div className="delivery-method-radio">
                          <input
                            type="radio"
                            id="omniva-parcel-machine"
                            name="deliveryMethod"
                            value="omniva-parcel-machine"
                            checked={formData.deliveryMethod === 'omniva-parcel-machine'}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="omniva-parcel-machine">Omniva pakiautomaat</label>
                        </div>
                        <div className="delivery-method-price">3.99€</div>
                      </div>
                      <div className="delivery-method-description">
                        Tarne 1-3 tööpäeva jooksul
                      </div>
                      
                      {formData.deliveryMethod === 'omniva-parcel-machine' && (
                        <div className="delivery-method-details">
                          <div className="form-group">
                            <label htmlFor="omnivaParcelMachineId">Vali pakiautomaat</label>
                            {loadingParcelMachines ? (
                              <div className="loading-text">Laadin pakiautomaate...</div>
                            ) : parcelMachinesError ? (
                              <div className="error-message">{parcelMachinesError}</div>
                            ) : parcelMachines.length === 0 ? (
                              <div className="info-message">Sellest riigist ei leitud pakiautomaate</div>
                            ) : (
                              <select
                                id="omnivaParcelMachineId"
                                name="omnivaParcelMachineId"
                                value={formData.omnivaParcelMachineId}
                                onChange={handleInputChange}
                                className={formErrors.omnivaParcelMachineId ? 'form-input error' : 'form-input'}
                              >
                                <option value="">Vali pakiautomaat...</option>
                                {parcelMachines.map(machine => (
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
                    
                    {/* SmartPost Parcel Machine */}
                    <div 
                      className={`delivery-method ${formData.deliveryMethod === 'smartpost' ? 'selected' : ''}`}
                      onClick={() => handleInputChange({ target: { name: 'deliveryMethod', value: 'smartpost' } })}
                    >
                      <div className="delivery-method-header">
                        <div className="delivery-method-radio">
                          <input
                            type="radio"
                            id="smartpost"
                            name="deliveryMethod"
                            value="smartpost"
                            checked={formData.deliveryMethod === 'smartpost'}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="smartpost">SmartPost pakiautomaat</label>
                        </div>
                        <div className="delivery-method-price">3.99€</div>
                      </div>
                      <div className="delivery-method-description">
                        Tarne 1-3 tööpäeva jooksul
                      </div>
                    </div>
                    
                    {/* DPD Courier */}
                    <div 
                      className={`delivery-method ${formData.deliveryMethod === 'courier' ? 'selected' : ''}`}
                      onClick={() => handleInputChange({ target: { name: 'deliveryMethod', value: 'courier' } })}
                    >
                      <div className="delivery-method-header">
                        <div className="delivery-method-radio">
                          <input
                            type="radio"
                            id="courier"
                            name="deliveryMethod"
                            value="courier"
                            checked={formData.deliveryMethod === 'courier'}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="courier">DPD kuller</label>
                        </div>
                        <div className="delivery-method-price">5.99€</div>
                      </div>
                      <div className="delivery-method-description">
                        Tarne 1-2 tööpäeva jooksul
                      </div>
                    </div>
                  </div>
                  
                  {formErrors.deliveryMethod && (
                    <div className="error-message delivery-method-error">{formErrors.deliveryMethod}</div>
                  )}
                </div>
                
                {/* Order Notes */}
                <div className="form-section">
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
                
                {/* Payment Method */}
                <div className="form-section">
                  <h3>{t('checkout.payment.title')}</h3>
                  
                  <div className="payment-methods">
                    {paymentMethods.map(method => (
                      <div 
                        key={method.id}
                        className={`payment-method ${selectedPaymentMethod === method.id ? 'selected' : ''}`}
                        onClick={() => handlePaymentMethodChange(method.id)}
                      >
                        <div className="payment-method-radio">
                          <input
                            type="radio"
                            id={method.id}
                            name="paymentMethod"
                            value={method.id}
                            checked={selectedPaymentMethod === method.id}
                            onChange={() => handlePaymentMethodChange(method.id)}
                          />
                          <label htmlFor={method.id}>{method.name}</label>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {paymentError && (
                    <div className="error-message payment-error">{paymentError}</div>
                  )}
                </div>
                
                {/* Terms and Conditions */}
                <div className="form-section">
                  <div className="terms-checkbox">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={handleTermsChange}
                    />
                    <label htmlFor="terms">
                      {t('checkout.terms.agree')} <a href="/muugitingimused" target="_blank">{t('checkout.terms.terms_link')}</a>
                    </label>
                  </div>
                  
                  {termsError && (
                    <div className="error-message terms-error">{termsError}</div>
                  )}
                </div>
                
                {/* Submit Button */}
                <div className="form-actions">
                  <Link to="/epood" className="btn btn-secondary">
                    {t('checkout.review.back_to_shop')}
                  </Link>
                  <button 
                    onClick={processPayment} 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('checkout.summary.processing') : t('checkout.summary.pay')}
                  </button>
                </div>
              </div>
              
              <div className="checkout-summary">
                <h2>{t('checkout.summary.title')}</h2>
                
                <div className="checkout-items">
                  {items.map((item) => (
                    <div key={item.id} className="checkout-item">
                      <div className="item-image">
                        <img src={item.image} alt={item.title} />
                      </div>
                      <div className="item-details">
                        <h3>{item.title}</h3>
                        <p className="item-price">{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="checkout-totals">
                  <div className="total-row">
                    <span>{t('checkout.summary.subtotal')}</span>
                    <span>{getTotalPrice().toFixed(2)}€</span>
                  </div>
                  <div className="total-row">
                    <span>{t('checkout.summary.shipping')}</span>
                    <span>
                      {formData.deliveryMethod === 'courier' ? '5.99€' : 
                       formData.deliveryMethod === 'omniva-parcel-machine' || formData.deliveryMethod === 'smartpost' ? '3.99€' : 
                       '0.00€'}
                    </span>
                  </div>
                  <div className="total-row total-final">
                    <span>{t('checkout.summary.total')}</span>
                    <span>
                      {(getTotalPrice() + 
                        (formData.deliveryMethod === 'courier' ? 5.99 : 
                         formData.deliveryMethod === 'omniva-parcel-machine' || formData.deliveryMethod === 'smartpost' ? 3.99 : 
                         0)).toFixed(2)}€
                    </span>
                  </div>
                </div>
                
                <div className="checkout-info">
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
        </section>
      </main>

      <style jsx>{`
        .checkout-content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 48px;
          margin-top: 48px;
        }

        .checkout-form h2, .checkout-summary h2 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
        }

        .checkout-form h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 16px;
          margin-top: 32px;
          color: var(--color-text);
        }

        .form-section {
          margin-bottom: 32px;
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

        .delivery-method-error, .payment-error, .terms-error {
          margin-top: 16px;
        }

        .loading-text, .info-message {
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 4px;
          text-align: center;
          color: #666;
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
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .delivery-method:hover {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .delivery-method.selected {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .delivery-method-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .delivery-method-radio {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .delivery-method-radio input[type="radio"] {
          margin: 0;
        }

        .delivery-method-radio label {
          font-weight: 500;
          cursor: pointer;
        }

        .delivery-method-price {
          font-weight: 600;
          color: var(--color-ultramarine);
        }

        .delivery-method-description {
          font-size: 0.9rem;
          color: #666;
        }

        .delivery-method-details {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }

        .payment-methods {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .payment-method {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .payment-method:hover {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .payment-method.selected {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .payment-method-radio {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .payment-method-radio input[type="radio"] {
          margin: 0;
        }

        .payment-method-radio label {
          font-weight: 500;
          cursor: pointer;
        }

        .terms-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .terms-checkbox input[type="checkbox"] {
          margin: 0;
        }

        .terms-checkbox label {
          font-size: 0.9rem;
        }

        .terms-checkbox a {
          color: var(--color-ultramarine);
          text-decoration: underline;
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem;
          text-decoration: none;
          display: inline-block;
          text-align: center;
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

        .checkout-summary {
          background: white;
          border-radius: 8px;
          padding: 32px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          height: fit-content;
          position: sticky;
          top: 32px;
        }

        .checkout-items {
          margin-bottom: 24px;
        }

        .checkout-item {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .item-image {
          width: 60px;
          height: 60px;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-details h3 {
          font-family: var(--font-heading);
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 4px;
          color: var(--color-text);
          margin-top: 0;
        }

        .item-price {
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--color-ultramarine);
          margin: 0;
          font-size: 0.9rem;
        }

        .checkout-totals {
          margin-top: 24px;
          border-top: 1px solid #f0f0f0;
          padding-top: 16px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .total-final {
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--color-text);
          border-top: 1px solid #f0f0f0;
          padding-top: 8px;
          margin-top: 8px;
        }

        .checkout-info {
          margin-top: 24px;
          border-top: 1px solid #f0f0f0;
          padding-top: 16px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 0.85rem;
          color: #666;
        }

        .info-icon {
          font-size: 1rem;
        }

        .info-item:last-child {
          margin-bottom: 4px;
        }

        @media (max-width: 992px) {
          .checkout-content {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .checkout-summary {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .checkout-item {
            flex-direction: column;
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