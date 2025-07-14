import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '../utils/stripe';
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
  const { status } = useParams();
  const { items: cartItems, getTotalPrice, clearCart } = useCart();
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  // Stripe state
  const [stripeError, setStripeError] = useState(null);
  const [stripeElementsComplete, setStripeElementsComplete] = useState(false);
  
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
  
  // Handle Stripe element change
  const handleStripeElementChange = (event) => {
    setStripeError(event.error ? event.error.message : null);
    setStripeElementsComplete(event.complete);
  };
  
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
    
    setIsSubmitting(true);
    setProcessingPayment(true);
    setError('');
    
    try {
      if (formData.paymentMethod === 'card') {
        // For card payments, we need to use Stripe
        if (!stripe || !elements) {
          setError('Stripe has not been properly initialized');
          setProcessingPayment(false);
          setIsSubmitting(false);
          return;
        }
        
        if (!stripeElementsComplete) {
          setError('Please enter complete card information');
          setProcessingPayment(false);
          setIsSubmitting(false);
          return;
        }
        
        // Prepare payload for submission
        const payload = getPayloadForSubmission();
        
        // Create order in Supabase
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
            status: 'PENDING',
            payment_status: 'PENDING',
            payment_method: payload.paymentMethod,
            notes: payload.notes
          })
          .select()
          .single();
        
        if (orderError) {
          throw new Error(orderError.message || 'Failed to create order');
        }
        
        // Process payment with Stripe
        const cardElement = elements.getElement(CardElement);
        
        const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: `${payload.firstName} ${payload.lastName}`,
            email: payload.email,
            phone: payload.phone
          }
        });
        
        if (stripeError) {
          throw new Error(stripeError.message || 'Payment processing failed');
        }
        
        // In a real implementation, you would now:
        // 1. Call a serverless function to create a payment intent
        // 2. Confirm the payment with the client
        // 3. Update the order status based on the payment result
        
        // For now, we'll simulate a successful payment
        console.log('Payment method created:', paymentMethod.id);
        
        // Update order status
        await supabase
          .from('orders')
          .update({
            status: 'PAID',
            payment_status: 'COMPLETED',
            payment_reference: paymentMethod.id
          })
          .eq('id', orderData.id);
        
        // Clear cart and show success
        clearCart();
        setPaymentStatus('success');
      } else if (formData.paymentMethod === 'google_pay' || formData.paymentMethod === 'apple_pay') {
        // For Google Pay and Apple Pay, we would integrate with their respective APIs
        // For now, we'll simulate the process
        
        // Prepare payload for submission
        const payload = getPayloadForSubmission();
        
        // Create order in Supabase
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
            status: 'PENDING',
            payment_status: 'PENDING',
            payment_method: payload.paymentMethod,
            notes: payload.notes
          })
          .select()
          .single();
        
        if (orderError) {
          throw new Error(orderError.message || 'Failed to create order');
        }
        
        // Simulate successful payment
        await supabase
          .from('orders')
          .update({
            status: 'PAID',
            payment_status: 'COMPLETED',
            payment_reference: `sim_${formData.paymentMethod}_${Date.now()}`
          })
          .eq('id', orderData.id);
        
        // Clear cart and show success
        clearCart();
        setPaymentStatus('success');
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err.message || t('checkout.error.session_failed'));
    } finally {
      setProcessingPayment(false);
      setIsSubmitting(false);
    }
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

  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <Elements stripe={stripePromise}>
            <div className="container">
              <FadeInSection>
                <h1 className="text-center">{t('checkout.title')}</h1>
              </FadeInSection>
              
              <div className="checkout-layout">
                <div className="checkout-main">
                  <form onSubmit={handleSubmit} className="checkout-form">
                    {/* Error message */}
                    {(error || stripeError) && (
                      <div className="checkout-error">
                        <div className="error-icon">⚠️</div>
                        <div className="error-message">{error || stripeError}</div>
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
                        onStripeElementChange={handleStripeElementChange}
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
          </Elements>
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