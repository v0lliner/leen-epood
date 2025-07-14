import { useState } from 'react';
import { useStripeCheckout } from '../../hooks/useStripeCheckout';

interface StripeCheckoutButtonProps {
  priceId: string;
  mode: 'payment' | 'subscription';
  className?: string;
  children?: React.ReactNode;
  successPath?: string;
  cancelPath?: string;
}

const StripeCheckoutButton = ({
  priceId,
  mode,
  className = '',
  children = 'Checkout',
  successPath = '/checkout/success',
  cancelPath = '/checkout/cancel'
}: StripeCheckoutButtonProps) => {
  const { createCheckoutSession, loading, error } = useStripeCheckout();
  const [showError, setShowError] = useState(false);

  const handleCheckout = async () => {
    setShowError(false);
    await createCheckoutSession(priceId, mode, successPath, cancelPath);
    if (error) {
      setShowError(true);
    }
  };

  return (
    <div className="stripe-checkout-container">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`stripe-checkout-button ${className} ${loading ? 'loading' : ''}`}
      >
        {loading ? 'Processing...' : children}
      </button>
      
      {showError && error && (
        <div className="stripe-checkout-error">
          {error}
        </div>
      )}

      <style jsx>{`
        .stripe-checkout-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .stripe-checkout-button {
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
        
        .stripe-checkout-button:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .stripe-checkout-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .stripe-checkout-button.loading {
          position: relative;
          color: transparent;
        }
        
        .stripe-checkout-button.loading::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 20px;
          margin: -10px 0 0 -10px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: stripe-button-spinner 0.8s linear infinite;
        }
        
        @keyframes stripe-button-spinner {
          to {
            transform: rotate(360deg);
          }
        }
        
        .stripe-checkout-error {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 4px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default StripeCheckoutButton;