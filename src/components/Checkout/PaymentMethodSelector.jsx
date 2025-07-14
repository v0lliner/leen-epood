import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const PaymentMethodSelector = ({ 
  formData, 
  onChange, 
  validationErrors,
  onPaymentMethodChange
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); 

  // Payment method options
  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
    { id: 'google_pay', name: 'Google Pay', icon: '🔄' },
    { id: 'apple_pay', name: 'Apple Pay', icon: '🍎' }
  ];

  // Update available banks when bank country changes
  useEffect(() => {
    setLoading(false);
  }, []);

  const handlePaymentMethodSelection = (methodId) => {
    onPaymentMethodChange(methodId);
  };

  return (
    <div className="payment-method-selector">
      <h3 className="section-title">{t('checkout.payment.title')}</h3>
      
      <div className="bank-selection">
        <label className="bank-label">Makseviis</label>
        
        {loading ? (
          <div className="loading-message">{t('checkout.payment.loading_methods')}</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="payment-methods-grid">
            {paymentMethods.map(method => (
              <div 
                key={method.id} 
                className={`payment-method-option ${formData.paymentMethod === method.id ? 'selected' : ''}`}
                onClick={() => handlePaymentMethodSelection(method.id)}
              >
                <div className="payment-method-content">
                  <span className="payment-method-icon">{method.icon}</span>
                  <span className="payment-method-name">{method.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {validationErrors.paymentMethod && (
          <div className="error-message">{validationErrors.paymentMethod}</div>
        )}
      </div>

      <style jsx>{`
        .payment-method-selector {
          margin-bottom: 32px;
        }
        
        .section-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
        }
        
        .payment-disabled {
          color: #dc3545;
          font-size: 0.9rem;
          font-weight: normal;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }
        
        .form-group label {
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--color-text);
        }
        
        .form-input {
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
        
        .bank-selection {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .bank-label {
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--color-text);
        }
        
        .payment-methods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 16px;
        }
        
        .payment-method-option {
          border: none;
          border-radius: 4px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 80px;
          background-color: #f8f9fa;
        }
        
        .payment-method-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }
        
        .payment-method-option:hover {
          background-color: rgba(47, 62, 156, 0.05);
        }
        
        .payment-method-option.selected {
          border: 2px solid var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }
        
        .payment-method-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
        }
        
        .payment-method-icon {
          font-size: 1.5rem;
        }
        
        .payment-method-name {
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        .loading-message {
          font-size: 0.85rem;
          color: #666;
          font-style: italic;
        }
        
        .error-message {
          color: #dc3545;
          font-size: 0.85rem;
        }
        
        .info-message {
          font-size: 0.85rem;
          color: #666;
        }
        
        .payment-notice {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 4px;
          font-size: 0.9rem;
          text-align: center;
          margin-top: 16px;
        }
        
        .test-card {
          position: relative;
          border: 2px dashed #f0ad4e;
          background-color: rgba(240, 173, 78, 0.1);
        }
        
        .test-card-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #f0ad4e;
          color: white;
          font-size: 0.7rem;
          text-align: center;
          padding: 2px 0;
        }
        
        @media (max-width: 768px) {
          .payment-methods-grid {
            grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
            gap: 8px;
            margin-top: 8px;
          }
          
          .payment-method-option {
            padding: 6px;
            height: 60px;
          }
          
          .payment-method-icon {
            font-size: 1.25rem;
          }
          
          .payment-method-name {
            font-size: 0.75rem;
          }
        }
        
        @media (max-width: 480px) {
          .payment-methods-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }
          
          .payment-method-option {
            height: 50px;
            padding: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentMethodSelector;