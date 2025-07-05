import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Helper function to get logo URL for a payment method
const getPaymentMethodLogo = (method) => {
  return `https://static.maksekeskus.ee/img/channel/lnd/${method}.png`;
};

const PaymentMethods = ({ amount, onSelectMethod, selectedMethod }) => {
  const { t } = useTranslation();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (amount) {
      loadPaymentMethods();
      console.log('PaymentMethods initialized with amount:', amount, typeof amount);
    }
  }, [amount, retryCount]);

  const loadPaymentMethods = async () => {
    if (!amount) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Ensure amount is a valid number greater than zero
      let numericAmount = 0;
      
      if (typeof amount === 'number') {
        numericAmount = amount;
      } else if (typeof amount === 'string') {
        // Parse string to number, handling both dot and comma as decimal separator
        numericAmount = parseFloat(amount.replace(',', '.'));
      } else {
        throw new Error(`Unsupported amount type: ${typeof amount}`);
      }
      
      // For zero or very small amounts, use a minimum value to avoid validation errors
      if (isNaN(numericAmount) || numericAmount <= 0) {
        console.log('Amount is invalid, using minimum value of 0.01');
        numericAmount = 0.01;
      }
      
      // Add a timestamp to prevent caching issues
      const timestamp = Date.now();
      
      // Fetch payment methods from the API
      const response = await fetch(`/api/payment-methods?amount=${numericAmount.toFixed(2)}&_=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load payment methods (${response.status})`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Payment service unavailable');
      }
      
      if (!data.methods || !Array.isArray(data.methods) || data.methods.length === 0) {
        throw new Error('No payment methods available');
      }
      
      setMethods(data.methods);
    } catch (err) {
      console.error('Failed to load payment methods:', err);
      setError(t('checkout.payment.methods_error'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="payment-methods-loading">
        <div className="loading-spinner"></div>
        <p>{t('checkout.payment.loading_methods')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-methods-error">
        <p>{error}</p>
        <button 
          onClick={handleRetry}
          className="retry-button"
        >
          {t('checkout.payment.retry')}
        </button>
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="payment-methods-empty">
        <p>{t('checkout.payment.no_methods')}</p>
        <button 
          onClick={handleRetry}
          className="retry-button"
        >
          {t('checkout.payment.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="payment-methods">
      <h4>{t('checkout.payment.select_method')}</h4>
      
      <div className="payment-methods-list">
        {methods.map((method) => (
          <div 
            key={method.channel}
            className={`payment-method ${selectedMethod === method.channel ? 'selected' : ''}`}
            onClick={() => onSelectMethod(method.channel)}
          >
            <div className="payment-method-logo">
              <img 
                src={getPaymentMethodLogo(method.channel)} 
                alt={method.name} 
                className="bank-logo"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = `<div class="bank-name">${method.name}</div>`;
                }}
              />
            </div>
            <div className="payment-method-info">
              <div className="payment-method-name">{method.display_name || method.name}</div>
              {method.countries && method.countries.length > 0 && (
                <div className="payment-method-country">{method.countries[0].toUpperCase()}</div>
              )}
            </div>
            <div className="payment-method-select">
              <div className={`select-indicator ${selectedMethod === method.channel ? 'active' : ''}`}></div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .payment-methods {
          margin-bottom: 32px;
        }

        .payment-methods h4 {
          font-family: var(--font-heading);
          font-size: 1.125rem;
          font-weight: 500;
          margin-bottom: 16px;
          color: var(--color-text);
        }

        .payment-methods-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .payment-method {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .payment-method:hover {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }

        .payment-method.selected {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.1);
        }

        .payment-method-logo {
          width: 80px;
          height: 40px;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          margin-right: 16px;
        }

        .bank-logo {
          height: 40px;
          width: auto;
          object-fit: contain;
        }

        .bank-name {
          font-weight: 600;
          color: var(--color-text);
        }

        .payment-method-info {
          flex: 1;
        }

        .payment-method-name {
          font-weight: 500;
          color: var(--color-text);
          margin-bottom: 4px;
        }

        .payment-method-country {
          font-size: 0.85rem;
          color: #666;
        }

        .payment-method-select {
          width: 24px;
          height: 24px;
          margin-left: 16px;
        }

        .select-indicator {
          width: 24px;
          height: 24px;
          border: 2px solid #ddd;
          border-radius: 50%;
          position: relative;
          transition: all 0.2s ease;
        }

        .select-indicator.active {
          border-color: var(--color-ultramarine);
        }

        .select-indicator.active:after {
          content: '';
          position: absolute;
          top: 4px;
          left: 4px;
          width: 12px;
          height: 12px;
          background-color: var(--color-ultramarine);
          border-radius: 50%;
        }

        .payment-methods-loading,
        .payment-methods-error,
        .payment-methods-empty {
          padding: 24px;
          text-align: center;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--color-ultramarine);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .retry-button {
          margin-top: 16px;
          padding: 8px 16px;
          background-color: var(--color-ultramarine);
          color: white;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .retry-button:hover {
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .payment-method {
            padding: 12px;
          }

          .payment-method-logo {
            width: 60px;
            height: 30px;
            margin-right: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentMethods;