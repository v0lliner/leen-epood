import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

// Import custom hook
import { useCheckoutForm } from '../hooks/useCheckoutForm';

// Import checkout components
import CartSummaryDisplay from '../components/Checkout/CartSummaryDisplay';
import ContactInfoForm from '../components/Checkout/ContactInfoForm';
import ShippingAddressForm from '../components/Checkout/ShippingAddressForm';
import OrderNotesForm from '../components/Checkout/OrderNotesForm';
import PaymentMethodSelector from '../components/Checkout/PaymentMethodSelector';
import OrderSummaryDisplay from '../components/Checkout/OrderSummaryDisplay';
import TermsAndConditionsCheckbox from '../components/Checkout/TermsAndConditionsCheckbox';

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items: cartItems, getTotalPrice, clearCart } = useCart();
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Get cart total
  const cartTotal = getTotalPrice();
  
  // Use the custom checkout form hook
  const {
    formData,
    validationErrors,
    handleInputChange,
    handleShippingMethodChange,
    handleParcelMachineSelect,
    handlePaymentMethodChange,
    validateForm,
    getPayloadForSubmission,
    getShippingCost,
    calculateTotal,
    omnivaShippingPrice,
    isSubmitting,
    setIsSubmitting
  } = useCheckoutForm(cartItems, cartTotal);
  
  // Redirect to shop if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/epood');
    }
  }, [cartItems, navigate]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    
    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('.has-error');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Set loading state
    setIsSubmitting(true);
    setProcessingPayment(true);
    
    try {
      // Get payload for submission
      const payload = getPayloadForSubmission();
      
      // Send request to payment processing endpoint
      const response = await fetch('/php/process-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // If successful, redirect to payment URL
      if (data.paymentUrl) {
        // Clear cart before redirecting
        clearCart();
        
        // Redirect to payment provider
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No payment URL returned from server');
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err.message || t('checkout.error.session_failed'));
      setProcessingPayment(false);
      
      // Scroll to error message
      const errorElement = document.querySelector('.checkout-error');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (cartItems.length === 0) {
    return (
      <main>
        <section className="section-large">
          <div className="container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('admin.loading')}</p>
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
              <div className="checkout-main">
                <form onSubmit={handleSubmit} className="checkout-form">
                  {/* Error message */}
                  {error && (
                    <div className="checkout-error">
                      <div className="error-icon">⚠️</div>
                      <div className="error-message">{error}</div>
                    </div>
                  )}
                  
                  {/* Cart Summary */}
                  <div className="checkout-section">
                    <CartSummaryDisplay cartItems={cartItems} />
                  </div>
                  
                  {/* Shipping Method */}
                  <div className="checkout-section">
                    <ShippingAddressForm
                      formData={formData}
                      onChange={handleInputChange}
                      validationErrors={validationErrors}
                      onShippingMethodChange={handleShippingMethodChange}
                      onParcelMachineSelect={handleParcelMachineSelect}
                      omnivaShippingPrice={omnivaShippingPrice}
                    />
                  </div>
                  
                  {/* Contact Information */}
                  <div className="checkout-section">
                    <ContactInfoForm
                      formData={formData}
                      onChange={handleInputChange}
                      validationErrors={validationErrors}
                    />
                  </div>
                  
                  {/* Order Notes */}
                  <div className="checkout-section">
                    <OrderNotesForm
                      formData={formData}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  {/* Payment Method */}
                  <div className="checkout-section">
                    <PaymentMethodSelector
                      formData={formData}
                      onChange={handleInputChange}
                      validationErrors={validationErrors}
                      onPaymentMethodChange={handlePaymentMethodChange}
                    />
                  </div>
                  
                  {/* Terms and Conditions */}
                  <div className="checkout-section">
                    <div className="terms-and-submit">
                      <TermsAndConditionsCheckbox
                        checked={formData.termsAccepted}
                        onChange={handleInputChange}
                        validationError={validationErrors.termsAccepted}
                      />
                      
                      <button 
                        type="submit"
                        className="checkout-button"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? t('checkout.summary.processing') : 'VORMISTA OST'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="checkout-sidebar">
                <OrderSummaryDisplay
                  itemSubtotal={cartTotal}
                  deliveryCost={getShippingCost()}
                  totalAmount={calculateTotal()}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Payment Processing Overlay */}
      {processingPayment && (
        <div className="payment-overlay">
          <div className="payment-processing">
            <div className="processing-spinner"></div>
            <p>{t('checkout.summary.processing')}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 48px;
          margin-top: 48px;
        }
        
        .checkout-main {
          flex: 1;
        }
        
        .checkout-sidebar {
          position: sticky;
          top: 100px;
          height: fit-content;
        }
        
        .checkout-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .checkout-section {
          margin-bottom: 16px;
        }
        
        .checkout-button {
          width: 100%;
          padding: 16px;
          margin-top: 16px;
          background-color: var(--color-ultramarine);
          color: white;
          border: none;
          border-radius: 4px;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        
        .terms-and-submit {
          margin-top: 16px;
        }
        
        .checkout-button:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .checkout-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .checkout-error {
          background-color: #f8d7da;
          color: #721c24;
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 24px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .error-icon {
          font-size: 1.25rem;
        }
        
        .error-message {
          flex: 1;
        }
        
        .payment-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .payment-processing {
          background: white;
          padding: 32px;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        
        .processing-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--color-ultramarine);
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
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
        
        @media (max-width: 992px) {
          .checkout-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          
          .checkout-sidebar {
            position: static;
            order: -1;
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;