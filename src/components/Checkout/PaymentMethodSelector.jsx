import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CardElement } from '@stripe/react-stripe-js';

const PaymentMethodSelector = ({ 
  formData, 
  onChange, 
  validationErrors,
  onPaymentMethodChange
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); 
  const [showCardFields, setShowCardFields] = useState(false);

  // Payment method options with official logos
  const paymentMethods = [
    { 
      id: 'card', 
      name: t('checkout.payment.card'), 
      logo: '/assets/payment/credit-card.png' 
    },
    { 
      id: 'google_pay', 
      name: 'Google Pay', 
      logo: '/assets/payment/google-pay.png' 
    },
    { 
      id: 'apple_pay', 
      name: 'Apple Pay', 
      logo: '/assets/payment/apple-pay.png' 
    }
  ];

  // Update available payment methods
  useEffect(() => {
    setLoading(false);
    
    // Show card fields if card is selected
    if (formData.paymentMethod === 'card') {
      setShowCardFields(true);
    } else {
      setShowCardFields(false);
    }
  }, [formData.paymentMethod]);

  const handlePaymentMethodSelection = (methodId) => {
    onPaymentMethodChange(methodId);
  };

  return (
    <div className="payment-method-selector">
      <h3 className="section-title">{t('checkout.payment.title')}</h3>
      
      <div className="payment-selection">
        <label htmlFor="paymentMethod" className="payment-label">Makseviis</label>
        
        {loading ? (
          <div className="loading-message">{t('checkout.payment.loading_methods')}</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="payment-methods-grid">
            {paymentMethods.map(method => (
              <div 
                key={method.id} 
                className={`payment-method-option ${formData.paymentMethod === method.id ? 'selected' : ''} ${method.id === 'card' ? 'card-method' : ''}`}
                onClick={() => handlePaymentMethodSelection(method.id)}
              >
                <div className="payment-method-content">
                  {method.logo ? (
                    <img 
                      src={method.logo} 
                      alt={method.name} 
                      className="payment-method-logo"
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : (
                    <span className="payment-method-icon">{method.icon}</span>
                  )}
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

      {/* Card payment fields */}
      {showCardFields && (
        <div className="card-payment-fields">
          <div className="card-element-container">
            <label htmlFor="card-element" className="payment-label">Kaardi andmed</label>
            <div className="card-element-wrapper">
              {/* This is a placeholder for the Stripe CardElement */}
              <div className="card-element-placeholder">
                <div className="card-field-placeholder">
                  <span>Kaardi number</span>
                  <div className="card-icons">
                    <img src="/assets/payment/visa.png" alt="Visa" className="card-brand-icon" />
                    <img src="/assets/payment/mastercard.png" alt="Mastercard" className="card-brand-icon" />
                  </div>
                </div>
                <div className="card-field-row">
                  <div className="card-field-placeholder small">Aegumiskuupäev</div>
                  <div className="card-field-placeholder small">CVC</div>
                </div>
              </div>
            </div>
            <div className="card-element-info">
              Maksed töödeldakse turvaliselt Stripe'i kaudu
            </div>
          </div>
        </div>
      )}

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
        
        .payment-selection {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .payment-label {
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
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 80px;
          background-color: white;
        }
        
        .payment-method-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }
        
        .payment-method-option:hover {
          border-color: var(--color-ultramarine);
        }
        
        .payment-method-option.selected {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }
        
        .payment-method-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
          width: 100%;
        }
        
        .payment-method-logo {
          height: 24px;
          width: auto;
          object-fit: contain;
        }
        
        .payment-method-icon {
          font-size: 1.5rem;
          display: none;
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
        
        /* Card payment fields */
        .card-payment-fields {
          margin-top: 24px;
          padding: 16px 0;
        }
        
        .card-element-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .card-element-wrapper {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          background-color: white;
          transition: border-color 0.2s ease;
        }
        
        .card-element-wrapper:focus-within {
          border-color: var(--color-ultramarine);
        }
        
        .card-element-info {
          font-size: 0.8rem;
          color: #666;
          margin-top: 8px;
        }
        
        /* Placeholder for Stripe CardElement */
        .card-element-placeholder {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .card-field-placeholder {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          color: #aaa;
          font-size: 0.9rem;
        }
        
        .card-field-placeholder.small {
          width: 48%;
        }
        
        .card-field-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        
        .card-icons {
          display: flex;
          gap: 8px;
        }
        
        .card-brand-icon {
          height: 20px;
          width: auto;
        }
        
        @media (max-width: 768px) {
          .payment-methods-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          
          .payment-method-option {
            padding: 12px;
            height: 70px;
          }
          
          .payment-method-logo {
            height: 20px;
          }
          
          .payment-method-name {
            font-size: 0.75rem;
          }
        }
        
        @media (max-width: 480px) {
          .payment-methods-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          
          .payment-method-option {
            height: 60px;
            padding: 8px;
          }
          
          .card-field-row {
            flex-direction: column;
            gap: 8px;
          }
          
          .card-field-placeholder.small {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentMethodSelector;