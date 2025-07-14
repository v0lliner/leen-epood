import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabase/client';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

// Import custom hook
import { useCheckoutForm } from '../hooks/useCheckoutForm';

// Import checkout components
import CartSummaryDisplay from '../components/Checkout/CartSummaryDisplay';
import ContactInfoForm from '../components/Checkout/ContactInfoForm';
import ShippingAddressForm from '../components/Checkout/ShippingAddressForm';
import OrderNotesForm from '../components/Checkout/OrderNotesForm';
import StripeWrapper from '../components/Checkout/StripeWrapper';
import OrderSummaryDisplay from '../components/Checkout/OrderSummaryDisplay';
import TermsAndConditionsCheckbox from '../components/Checkout/TermsAndConditionsCheckbox';

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status } = useParams();
  const { items: cartItems, getTotalPrice, clearCart } = useCart();
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  // State for Stripe payment
  const [paymentStep, setPaymentStep] = useState(false);
  
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
      // Only redirect if not in payment success/cancel flow
      if (!status) {
        navigate('/epood');
      }
    }
    
    // Handle payment status from URL
    if (status) {
      if (status === 'korras') {
        setPaymentStatus('success');
        // Clear cart on successful payment
        clearCart();
      } else if (status === 'katkestatud') {
        setPaymentStatus('cancelled');
      }
    }
    
    // Set page as loaded after a short delay to allow components to initialize
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [cartItems, navigate, status, clearCart]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('.has-error');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Move to payment step
    setPaymentStep(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle payment success
  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Create order in Supabase
      const payload = getPayloadForSubmission();
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_email: payload.email,
          customer_name: `${payload.firstName} ${payload.lastName}`,
          customer_phone: payload.phone,
          shipping_address: JSON.stringify({
            country: payload.country,
            parcel_machine_id: payload.omnivaParcelMachineId,
            parcel_machine_name: payload.omnivaParcelMachineName
          }),
          items: JSON.stringify(payload.items),
          subtotal: payload.subtotal,
          shipping_cost: payload.shipping_cost,
          total_amount: payload.total_amount,
          status: 'PAID',
          payment_status: 'COMPLETED',
          payment_method: 'stripe',
          payment_reference: paymentIntent?.id || 'unknown',
          notes: payload.notes
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        setError(orderError.message || 'Failed to create order');
        return;
      }
      
      // Clear cart and show success message
      clearCart();
      setPaymentStatus('success');
    } catch (err) {
      console.error('Error handling payment success:', err);
      setError(err.message || 'Failed to process order');
    }
  };
  
  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setError(error.message || 'Payment failed');
  };
  
  // Go back to shipping info
  const handleBackToShipping = () => {
    setPaymentStep(false);
  };
  
  if (cartItems.length === 0) {
    return (
      <main>
        <section className="section-large">
          <div className="container">
            {isPageLoading ? <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('admin.loading')}</p>
            </div> : null}
          </div>
        </section>
      </main>
    );
  }

  // Show success message if payment was successful
  if (paymentStatus === 'success') {
    return (
      <>
        <SEOHead page="shop" />
        <main>
          <section className="section-large">
            <div className="container">
              <FadeInSection>
                <div className="payment-success">
                  <div className="success-icon">✅</div>
                  <h1>{t('checkout.thank_you.title')}</h1>
                  <p>{t('checkout.thank_you.message')}</p>
                  <button 
                    onClick={() => navigate('/epood')}
                    className="back-to-shop-btn"
                  >
                    {t('checkout.thank_you.back_to_shop')}
                  </button>
                </div>
              </FadeInSection>
            </div>
          </section>
        </main>
        
        <style jsx>{`
          .payment-success {
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
            padding: 48px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          }
          
          .success-icon {
            font-size: 4rem;
            margin-bottom: 24px;
            color: #28a745;
          }
          
          .payment-success h1 {
            color: var(--color-ultramarine);
            margin-bottom: 24px;
          }
          
          .payment-success p {
            margin-bottom: 32px;
            font-size: 1.125rem;
            line-height: 1.6;
            color: #666;
          }
          
          .back-to-shop-btn {
            background-color: var(--color-ultramarine);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-family: var(--font-body);
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: opacity 0.2s ease;
          }
          
          .back-to-shop-btn:hover {
            opacity: 0.9;
          }
        `}</style>
      </>
    );
  }
  
  // Show cancelled message if payment was cancelled
  if (paymentStatus === 'cancelled') {
    return (
      <>
        <SEOHead page="shop" />
        <main>
          <section className="section-large">
            <div className="container">
              <FadeInSection>
                <div className="payment-cancelled">
                  <div className="cancelled-icon">❌</div>
                  <h1>{t('checkout.payment.cancelled_title')}</h1>
                  <p>{t('checkout.payment.cancelled_by_user')}</p>
                  <button 
                    onClick={() => {
                      setPaymentStatus(null);
                      navigate('/checkout');
                    }}
                    className="try-again-btn"
                  >
                    {t('checkout.payment.try_again')}
                  </button>
                </div>
              </FadeInSection>
            </div>
          </section>
        </main>
        
        <style jsx>{`
          .payment-cancelled {
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
            padding: 48px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          }
          
          .cancelled-icon {
            font-size: 4rem;
            margin-bottom: 24px;
            color: #dc3545;
          }
          
          .payment-cancelled h1 {
            color: var(--color-ultramarine);
            margin-bottom: 24px;
          }
          
          .payment-cancelled p {
            margin-bottom: 32px;
            font-size: 1.125rem;
            line-height: 1.6;
            color: #666;
          }
          
          .try-again-btn {
            background-color: var(--color-ultramarine);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-family: var(--font-body);
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: opacity 0.2s ease;
          }
          
          .try-again-btn:hover {
            opacity: 0.9;
          }
        `}</style>
      </>
    );
  }

  // Show payment step
  if (paymentStep) {
    return (
      <>
        <SEOHead page="shop" />
        <main>
          <section className="section-large">
            <div className="container">
              <FadeInSection>
                <h1 className="text-center">{t('checkout.payment.title')}</h1>
              </FadeInSection>
              
              <div className="checkout-layout">
                <div className="checkout-main">
                  {error && (
                    <div className="checkout-error">
                      <div className="error-icon">⚠️</div>
                      <div className="error-message">{error}</div>
                    </div>
                  )}
                  
                  <div className="payment-container">
                    <button 
                      onClick={handleBackToShipping}
                      className="back-button"
                    >
                      ← Tagasi tarneinfo juurde
                    </button>
                    
                    <StripeWrapper
                      amount={calculateTotal() * 100} // Stripe expects amount in cents
                      currency="eur"
                      customerEmail={formData.email}
                      customerName={`${formData.firstName} ${formData.lastName}`}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  </div>
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
          
          .payment-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 32px;
          }
          
          .back-button {
            background: none;
            border: none;
            color: var(--color-ultramarine);
            font-family: var(--font-body);
            font-weight: 500;
            font-size: 1rem;
            cursor: pointer;
            padding: 0;
            margin-bottom: 24px;
            display: inline-flex;
            align-items: center;
            transition: opacity 0.2s ease;
          }
          
          .back-button:hover {
            opacity: 0.8;
          }
          
          @media (max-width: 992px) {
            .checkout-layout {
              grid-template-columns: 1fr;
              gap: 48px;
            }
            
            .checkout-sidebar {
              position: static;
              order: -1;
            }
          }
          
          @media (max-width: 768px) {
            .checkout-layout {
              margin-top: 32px;
            }
            
            .payment-container {
              padding: 24px;
            }
          }
          
          @media (max-width: 480px) {
            .checkout-layout {
              margin-top: 24px;
              gap: 32px;
            }
            
            .payment-container {
              padding: 16px;
            }
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
                        {isSubmitting ? t('checkout.summary.processing') : 'JÄTKA MAKSEGA'}
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
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 992px) {
          .checkout-layout {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          
          .checkout-sidebar {
            position: static;
            order: -1;
          }
        }
        
        @media (max-width: 768px) {
          .checkout-layout {
            margin-top: 32px;
          }
          
          .checkout-section {
            margin-bottom: 24px;
          }
          
          .checkout-button {
            padding: 14px;
          }
        }
        
        @media (max-width: 480px) {
          .checkout-layout {
            margin-top: 24px;
            gap: 32px;
          }
          
          .checkout-section {
            margin-bottom: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default Checkout;