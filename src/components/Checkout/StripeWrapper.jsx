import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm';

// Load Stripe outside of a component's render to avoid recreating the Stripe object on every render
// Use the test publishable key for development
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51NXeQXCkBk2NVHVDnOvikOVVfSQs9ydBFnvMCJ3awZwRh5TGgkQMdDJA1oTgKT1mzLLHJQmiWvGQeKZL1Lhd4Rkw00QLcMFLFP');

const StripeWrapper = ({ 
  amount, 
  currency = 'eur', 
  customerEmail, 
  customerName,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real implementation, this would call your backend to create a payment intent
    // For this frontend-only implementation, we'll simulate it
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate a client secret
        // In a real implementation, this would come from your backend
        const simulatedClientSecret = `pi_${Math.random().toString(36).substring(2)}_secret_${Math.random().toString(36).substring(2)}`;
        
        setClientSecret(simulatedClientSecret);
        setLoading(false);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Maksesessiooni loomine ebaõnnestus. Palun proovige hiljem uuesti.');
        setLoading(false);
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, currency, customerEmail, customerName]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2f3e9c', // Match the site's ultramarine color
      colorBackground: '#ffffff',
      colorText: '#111111',
      colorDanger: '#dc3545',
      fontFamily: 'Urbanist, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px',
    },
    rules: {
      '.Label': {
        fontFamily: 'Roboto Mono, monospace',
        fontSize: '0.9rem',
      },
      '.Input': {
        padding: '12px',
      },
      '.Tab': {
        padding: '10px 16px',
        borderRadius: '4px',
      },
      '.Tab:hover': {
        backgroundColor: 'rgba(47, 62, 156, 0.05)',
      },
      '.Tab--selected': {
        backgroundColor: 'rgba(47, 62, 156, 0.1)',
        borderColor: '#2f3e9c',
      },
    },
  };

  const options = {
    clientSecret,
    appearance,
    locale: 'et',
  };

  if (loading) {
    return (
      <div className="stripe-loading">
        <div className="loading-spinner"></div>
        <p>Maksesessiooni loomine...</p>
        
        <style jsx>{`
          .stripe-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 32px;
            gap: 16px;
          }
          
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid var(--color-ultramarine);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stripe-error">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Proovi uuesti
        </button>
        
        <style jsx>{`
          .stripe-error {
            text-align: center;
            padding: 24px;
            background-color: #fff5f5;
            border-radius: 8px;
            border: 1px solid #fed7d7;
            color: #c53030;
          }
          
          .retry-button {
            margin-top: 16px;
            padding: 8px 16px;
            background-color: var(--color-ultramarine);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--font-body);
            font-weight: 500;
            transition: opacity 0.2s ease;
          }
          
          .retry-button:hover {
            opacity: 0.9;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="stripe-wrapper">
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <StripePaymentForm 
            clientSecret={clientSecret}
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

export default StripeWrapper;