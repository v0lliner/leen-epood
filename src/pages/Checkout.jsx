import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

// Import sub-components
import ContactInfoForm from '../components/Checkout/ContactInfoForm';
import ShippingAddressForm from '../components/Checkout/ShippingAddressForm';
import OmnivaPicker from '../components/Checkout/OmnivaPicker';
import PaymentMethodSelector from '../components/Checkout/PaymentMethodSelector';

// Import validation and services
import { validateCheckoutForm, hasErrors } from '../components/Checkout/ValidationUtils';
import { getOmnivaShippingPrice, processPayment } from '../components/Checkout/ShippingService';

const Checkout = () => {
  const { t } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  
  // Consolidated form state
  const [formData, setFormData] = useState({
    contact: {
      firstName: '',
      email: '',
      phone: ''
    },
    shipping: {
      street: '',
      city: '',
      postalCode: '',
      country: 'estonia',
      omnivaLocation: null
    },
    payment: {
      method: ''
    },
    notes: ''
  });
  
  // Other state
  const [deliveryMethod, setDeliveryMethod] = useState('omniva');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [omnivaShippingPrice, setOmnivaShippingPrice] = useState(3.99);
  const [reference, setReference] = useState('');
  
  // Load Omniva shipping price from database
  useEffect(() => {
    const loadOmnivaPrice = async () => {
      try {
        const price = await getOmnivaShippingPrice();
        setOmnivaShippingPrice(price);
      } catch (error) {
        console.error('Failed to load Omniva shipping price:', error);
        // Keep default price if loading fails
      }
    };
    
    loadOmnivaPrice();
  }, []);
  
  // Generate unique reference for order
  useEffect(() => {
    const generateReference = () => {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `ORD-${timestamp.slice(-6)}-${random}`;
    };
    
    setReference(generateReference());
  }, []);
  
  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/epood');
    }
  }, [items, navigate]);
  
  // Generic form field update handler
  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear related errors when field is updated
    if (errors[section]?.[field]) {
      setErrors(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: undefined
        }
      }));
    }
  };
  
  // Handle notes change (not in a section)
  const handleNotesChange = (e) => {
    setFormData(prev => ({
      ...prev,
      notes: e.target.value
    }));
  };
  
  // Handle delivery method change
  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);
    
    // Clear any shipping-related errors
    if (errors.shipping) {
      setErrors(prev => ({
        ...prev,
        shipping: {}
      }));
    }
  };
  
  // Handle Omniva location selection
  const handleOmnivaLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        omnivaLocation: location
      }
    }));
    
    // Clear Omniva location error
    if (errors.shipping?.omnivaLocation) {
      setErrors(prev => ({
        ...prev,
        shipping: {
          ...prev.shipping,
          omnivaLocation: undefined
        }
      }));
    }
  };
  
  // Handle payment method selection
  const handlePaymentMethodSelect = (method) => {
    setFormData(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        method
      }
    }));
    
    // Clear payment method error
    if (errors.payment?.method) {
      setErrors(prev => ({
        ...prev,
        payment: {
          ...prev.payment,
          method: undefined
        }
      }));
    }
  };
  
  // Handle terms agreement
  const handleTermsChange = (e) => {
    setAgreedToTerms(e.target.checked);
    
    // Clear terms error
    if (errors.terms?.terms) {
      setErrors(prev => ({
        ...prev,
        terms: {}
      }));
    }
  };
  
  // Calculate total price
  const calculateTotal = () => {
    const subtotal = getTotalPrice();
    const shipping = deliveryMethod === 'omniva' ? omnivaShippingPrice : 0;
    return subtotal + shipping;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateCheckoutForm(formData, deliveryMethod, agreedToTerms);
    
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      
      // Scroll to first error
      const firstErrorSection = Object.keys(validationErrors).find(section => 
        Object.keys(validationErrors[section]).length > 0
      );
      
      if (firstErrorSection) {
        const errorElement = document.querySelector(`.${firstErrorSection}-section .error-message`);
        errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare payment data
      const paymentData = {
        amount: calculateTotal().toFixed(2),
        reference,
        firstName: formData.contact.firstName,
        lastName: '',
        email: formData.contact.email,
        phone: formData.contact.phone,
        paymentMethod: formData.payment.method,
        deliveryMethod,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: parseFloat(item.price.replace('€', '')),
          quantity: 1
        }))
      };
      
      // Add Omniva parcel machine info if selected
      if (deliveryMethod === 'omniva' && formData.shipping.omnivaLocation) {
        paymentData.omnivaParcelMachineId = formData.shipping.omnivaLocation.id;
        paymentData.omnivaParcelMachineName = formData.shipping.omnivaLocation.name;
      }
      
      // Process payment
      const result = await processPayment(paymentData);
      
      if (result.paymentUrl) {
        // Clear cart and redirect to payment page
        clearCart();
        window.location.href = result.paymentUrl;
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setErrors({
        general: {
          message: 'Makse töötlemisel tekkis viga. Palun proovige uuesti.'
        }
      });
      setIsSubmitting(false);
    }
  };
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  if (items.length === 0) {
    return null; // Don't render anything if cart is empty (will redirect)
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

            <FadeInSection>
              <form onSubmit={handleSubmit} className="checkout-form">
                <div className="checkout-layout">
                  {/* Left Column - Form Fields */}
                  <div className="checkout-main">
                    {/* Contact Information */}
                    <div className="contact-section">
                      <ContactInfoForm 
                        contactInfo={formData.contact}
                        onChange={handleChange}
                        errors={errors.contact || {}}
                      />
                    </div>

                    {/* Delivery Method Selection */}
                    <div className="checkout-section">
                      <h3>Tarneviis</h3>
                      
                      <div className="delivery-methods">
                        <div 
                          className={`delivery-method ${deliveryMethod === 'omniva' ? 'selected' : ''}`}
                          onClick={() => handleDeliveryMethodChange('omniva')}
                        >
                          <div className="delivery-method-radio">
                            <div className={`radio-inner ${deliveryMethod === 'omniva' ? 'selected' : ''}`}></div>
                          </div>
                          <div className="delivery-method-content">
                            <div className="delivery-method-title">
                              <h4>Omniva pakiautomaat</h4>
                              <span className="delivery-method-price">{omnivaShippingPrice.toFixed(2)}€</span>
                            </div>
                            <p className="delivery-method-description">Tarne 1-3 tööpäeva jooksul</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Omniva Parcel Machine Selector */}
                    {deliveryMethod === 'omniva' && (
                      <div className="shipping-section">
                        <OmnivaPicker
                          country={formData.shipping.country}
                          selectedLocation={formData.shipping.omnivaLocation}
                          onSelect={handleOmnivaLocationSelect}
                          error={errors.shipping?.omnivaLocation}
                        />
                      </div>
                    )}

                    {/* Courier Delivery Address */}
                    {deliveryMethod === 'courier' && (
                      <div className="shipping-section">
                        <ShippingAddressForm
                          shippingInfo={formData.shipping}
                          onChange={handleChange}
                          errors={errors.shipping || {}}
                        />
                      </div>
                    )}

                    {/* Order Notes */}
                    <div className="checkout-section">
                      <h3>Lisainfo</h3>
                      <div className="form-group">
                        <label htmlFor="notes">Märkused tellimuse kohta</label>
                        <textarea
                          id="notes"
                          value={formData.notes}
                          onChange={handleNotesChange}
                          className="form-input"
                          placeholder="Soovid või märkused tellimuse kohta"
                          rows="3"
                        ></textarea>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="payment-section">
                      <PaymentMethodSelector
                        selectedMethod={formData.payment.method}
                        onSelect={handlePaymentMethodSelect}
                        error={errors.payment?.method}
                      />
                    </div>

                    {/* Terms Agreement */}
                    <div className="checkout-section terms-section">
                      <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={handleTermsChange}
                            className="form-checkbox"
                          />
                          <span>
                            Nõustun <Link to="/muugitingimused" target="_blank" className="terms-link">müügitingimustega</Link>
                          </span>
                        </label>
                        {errors.terms?.terms && (
                          <div className="error-message">{errors.terms.terms}</div>
                        )}
                      </div>
                    </div>

                    {/* General Error Message */}
                    {errors.general?.message && (
                      <div className="checkout-section error-section">
                        <div className="error-message general-error">
                          {errors.general.message}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Order Summary */}
                  <div className="checkout-sidebar">
                    <div className="order-summary">
                      <h3>Tellimuse kokkuvõte</h3>
                      
                      <div className="order-items">
                        {items.map((item) => (
                          <div key={item.id} className="order-item">
                            <div className="order-item-image">
                              <img src={item.image} alt={item.title} />
                            </div>
                            <div className="order-item-details">
                              <h4 className="order-item-title">{item.title}</h4>
                              <p className="order-item-price">{item.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="order-totals">
                        <div className="order-subtotal">
                          <span>Vahesumma:</span>
                          <span>{getTotalPrice().toFixed(2)}€</span>
                        </div>
                        
                        {deliveryMethod === 'omniva' && (
                          <div className="order-shipping">
                            <span>Tarne (Omniva):</span>
                            <span>{omnivaShippingPrice.toFixed(2)}€</span>
                          </div>
                        )}
                        
                        <div className="order-total">
                          <span>Kokku:</span>
                          <span>{calculateTotal().toFixed(2)}€</span>
                        </div>
                      </div>
                      
                      <button 
                        type="submit"
                        className="checkout-button"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Töötlemine...' : 'Vormista tellimus'}
                      </button>
                      
                      <div className="order-info">
                        <div className="info-item">
                          <span className="info-icon">🔒</span>
                          <span>Turvaline makse Maksekeskuse kaudu</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">🚚</span>
                          <span>Tarne 2-4 tööpäeva jooksul</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">✉️</span>
                          <span>Iga tellimuse juurde käib isiklik märge</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .checkout-header {
          margin-bottom: 48px;
        }

        .checkout-form {
          width: 100%;
        }

        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 64px;
          align-items: start;
        }

        .checkout-main {
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        .checkout-section {
          width: 100%;
        }

        .checkout-section h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group:last-child {
          margin-bottom: 0;
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
          background-color: var(--color-background);
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
          margin-top: 8px;
        }

        .general-error {
          padding: 12px;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          margin-bottom: 24px;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
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

        .terms-link {
          color: var(--color-ultramarine);
          text-decoration: underline;
        }

        .delivery-methods {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .delivery-method {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .delivery-method:hover {
          border-color: var(--color-ultramarine);
        }

        .delivery-method.selected {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .delivery-method-radio {
          width: 20px;
          height: 20px;
          border: 2px solid #ddd;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .delivery-method.selected .delivery-method-radio {
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

        .delivery-method-content {
          flex: 1;
        }

        .delivery-method-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .delivery-method-title h4 {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 500;
          margin: 0;
        }

        .delivery-method-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
        }

        .delivery-method-description {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
        }

        .loading-indicator {
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 4px;
          text-align: center;
          color: #666;
          font-style: italic;
        }

        .info-message {
          padding: 12px;
          background-color: #e2f0fd;
          border-radius: 4px;
          text-align: center;
          color: #0c5460;
        }

        /* Order Summary Styles */
        .checkout-sidebar {
          position: sticky;
          top: 32px;
        }

        .order-summary {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 24px;
        }

        .order-summary h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
        }

        .order-items {
          margin-bottom: 24px;
        }

        .order-item {
          display: flex;
          gap: 16px;
          padding-bottom: 16px;
          margin-bottom: 16px;
          border-bottom: 1px solid #eee;
        }

        .order-item:last-child {
          margin-bottom: 0;
          border-bottom: none;
        }

        .order-item-image {
          width: 64px;
          height: 64px;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .order-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .order-item-details {
          flex: 1;
        }

        .order-item-title {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 400;
          margin-bottom: 8px;
          color: var(--color-text);
        }

        .order-item-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
          margin: 0;
        }

        .order-totals {
          padding-top: 16px;
          border-top: 1px solid #eee;
          margin-bottom: 24px;
        }

        .order-subtotal,
        .order-shipping,
        .order-total {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .order-total {
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 1.125rem;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }

        .checkout-button {
          width: 100%;
          padding: 16px;
          background-color: var(--color-ultramarine);
          color: white;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s ease;
          margin-bottom: 24px;
        }

        .checkout-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .checkout-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
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

        /* Payment Methods Styles */
        .payment-methods {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .payment-methods.has-error {
          border: 1px solid #dc3545;
          border-radius: 4px;
          padding: 16px;
          background-color: rgba(220, 53, 69, 0.05);
        }

        .payment-method {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .payment-method:hover {
          border-color: var(--color-ultramarine);
        }

        .payment-method.selected {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .payment-method-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .payment-method-logo {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f0f0f0;
          border-radius: 4px;
        }

        .logo-placeholder {
          font-weight: bold;
          color: #666;
        }

        .payment-method-name {
          font-weight: 500;
        }

        .payment-method-check {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-ultramarine);
          font-weight: bold;
        }

        @media (max-width: 1024px) {
          .checkout-layout {
            grid-template-columns: 1fr 320px;
            gap: 32px;
          }
        }

        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .checkout-sidebar {
            position: static;
            order: -1;
          }

          .checkout-main {
            gap: 32px;
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;