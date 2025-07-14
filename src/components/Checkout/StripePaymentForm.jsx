import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
  LinkAuthenticationElement,
  AddressElement
} from '@stripe/react-stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51NXgBXLVBbJ3P2LKofFkMPcTAMezaO0g9jKIEhfnBcJBkrwqY3LnO0VmNnFQlmJolOHRQk5THORLpHYeYkhQyYB800MLBjPmZV');

// Wrapper component that provides Stripe context
export const StripePaymentWrapper = ({ clientSecret, onPaymentSuccess, onPaymentError }) => {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2f3e9c', // Match site's ultramarine color
        colorBackground: '#ffffff',
        colorText: '#111111',
        colorDanger: '#dc3545',
        fontFamily: 'Urbanist, sans-serif',
        borderRadius: '4px',
      },
    },
  };

  return (
    <div className="stripe-wrapper">
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <StripePaymentForm 
            onPaymentSuccess={onPaymentSuccess} 
            onPaymentError={onPaymentError} 
          />
        </Elements>
      )}
      
      <style jsx>{`
        .stripe-wrapper {
          width: 100%;
        }
      `}</style>
    </div>
  );
};

// The actual payment form component
const StripePaymentForm = ({ onPaymentSuccess, onPaymentError }) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/makse/korras`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || t('checkout.payment.error_message'));
        onPaymentError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent);
      } else {
        // Payment requires additional actions, handled by redirect
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage(t('checkout.payment.error_message'));
      onPaymentError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <div className="payment-element-container">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="payment-error">
          {errorMessage}
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="payment-button"
      >
        {isLoading ? (
          <span className="loading-spinner-container">
            <span className="loading-spinner"></span>
            {t('checkout.summary.processing')}
          </span>
        ) : (
          t('checkout.form.pay')
        )}
      </button>
      
      <div className="payment-info">
        <div className="info-item">
          <span className="info-icon">🔒</span>
          <span className="info-text">{t('checkout.summary.info.secure').replace('Maksekeskus', 'Stripe')}</span>
        </div>
      </div>
      
      <style jsx>{`
        .stripe-payment-form {
          width: 100%;
          margin-top: 24px;
        }
        
        .payment-element-container {
          margin-bottom: 24px;
        }
        
        .payment-error {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 0.9rem;
        }
        
        .payment-button {
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
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .payment-button:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .payment-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .loading-spinner-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .payment-info {
          margin-top: 16px;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #666;
        }
      `}</style>
    </form>
  );
};

export default StripePaymentForm;