import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const PaymentMethods = ({ amount, onSelectMethod, selectedMethod }) => {
  const { t } = useTranslation();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPaymentMethods();
  }, [amount]);

  const loadPaymentMethods = async () => {
    if (!amount || amount <= 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Simulate payment methods for now
      const mockMethods = [
        {
          method: 'swedbank',
          name: 'Swedbank',
          countries: ['EE'],
          min_amount: 0.01,
          max_amount: 10000
        },
        {
          method: 'seb',
          name: 'SEB',
          countries: ['EE'],
          min_amount: 0.01,
          max_amount: 10000
        },
        {
          method: 'luminor',
          name: 'Luminor',
          countries: ['EE'],
          min_amount: 0.01,
          max_amount: 10000
        },
        {
          method: 'lhv',
          name: 'LHV',
          countries: ['EE'],
          min_amount: 0.01,
          max_amount: 10000
        },
        {
          method: 'coop',
          name: 'Coop Pank',
          countries: ['EE'],
          min_amount: 0.01,
          max_amount: 10000
        }
      ];
      
      setMethods(mockMethods);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load payment methods:', err);
      setError(t('checkout.payment.methods_error'));
      setLoading(false);
    }
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
          onClick={loadPaymentMethods}
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
      </div>
    );
  }

  return (
    <div className="payment-methods">
      <h4>{t('checkout.payment.select_method')}</h4>
      
      <div className="payment-methods-list">
        {methods.map((method) => (
          <div 
            key={method.method}
            className={`payment-method ${selectedMethod === method.method ? 'selected' : ''}`}
            onClick={() => onSelectMethod(method.method)}
          >
            <div className="payment-method-logo">
              <div className="bank-name">{method.name}</div>
            </div>
            <div className="payment-method-info">
              <div className="payment-method-name">{method.name}</div>
              {method.countries && method.countries.length > 0 && (
                <div className="payment-method-country">{method.countries[0]}</div>
              )}
            </div>
            <div className="payment-method-select">
              <div className={`select-indicator ${selectedMethod === method.method ? 'active' : ''}`}></div>
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
          align-items: center;
          justify-content: center;
          margin-right: 16px;
        }

        .bank-logo {
          max-width: 100%;
          max-height: 100%;
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