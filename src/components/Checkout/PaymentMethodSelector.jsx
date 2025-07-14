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

      {loading ? (
        <div className="loading-message">{t('checkout.payment.loading_methods')}</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="payment-methods">
          {/* Card payment option */}
          <div className="payment-method">
            <label className="method-label">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={formData.paymentMethod === 'card'}
                onChange={() => handlePaymentMethodSelection('card')}
                className="method-radio"
              />
              <div className="method-content">
                <div className="method-info">
                  <h4 className="method-title">{t('checkout.payment.card')}</h4>
                  <p className="method-description">Visa, Mastercard, American Express</p>
                </div>
                <div className="method-logo">
                  <img src="/assets/payment/credit-card.png" alt="Credit Card" />
                </div>
              </div>
            </label>
          </div>
          
          {/* Google Pay option */}
          <div className="payment-method">
            <label className="method-label">
              <input
                type="radio"
                name="paymentMethod"
                value="google_pay"
                checked={formData.paymentMethod === 'google_pay'}
                onChange={() => handlePaymentMethodSelection('google_pay')}
                className="method-radio"
              />
              <div className="method-content">
                <div className="method-info">
                  <h4 className="method-title">Google Pay</h4>
                  <p className="method-description">Kiire ja turvaline makse</p>
                </div>
                <div className="method-logo">
                  <img src="/assets/payment/google-pay.png" alt="Google Pay" />
                </div>
              </div>
            </label>
          </div>
          
          {/* Apple Pay option */}
          <div className="payment-method">
            <label className="method-label">
              <input
                type="radio"
                name="paymentMethod"
                value="apple_pay"
                checked={formData.paymentMethod === 'apple_pay'}
                onChange={() => handlePaymentMethodSelection('apple_pay')}
                className="method-radio"
              />
              <div className="method-content">
                <div className="method-info">
                  <h4 className="method-title">Apple Pay</h4>
                  <p className="method-description">Kiire ja turvaline makse</p>
                </div>
                <div className="method-logo">
                  <img src="/assets/payment/apple-pay.png" alt="Apple Pay" />
                </div>
              </div>
            </label>
          </div>
        </div>
      )}
      
      {validationErrors.paymentMethod && (
        <div className="error-message">{validationErrors.paymentMethod}</div>
      )}

      {/* Card payment fields */}
      {showCardFields && (
        <div className="card-payment-fields">
          <div className="card-element-container">
            <label htmlFor="card-element">Kaardi andmed</label>
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
         
         .payment-methods {
           display: flex;
           flex-direction: column;
           gap: 16px;
           margin-bottom: 24px;
         }
         
         .payment-method {
           border: 1px solid #ddd;
           border-radius: 4px;
           overflow: hidden;
           transition: border-color 0.2s ease;
         }
         
         .payment-method:hover {
           border-color: var(--color-ultramarine);
         }
         
         .method-label {
           display: flex;
           cursor: pointer;
           width: 100%;
         }
         
         .method-radio {
           margin: 16px;
         }
         
         .method-content {
           flex: 1;
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 16px;
           padding-left: 0;
         }
         
         .method-title {
           font-family: var(--font-heading);
           font-size: 1rem;
           font-weight: 500;
           margin: 0 0 4px 0;
           color: var(--color-text);
         }
         
         .method-description {
           font-size: 0.85rem;
           color: #666;
           margin: 0;
         }
         
         .method-logo {
           display: flex;
           align-items: center;
           justify-content: center;
           margin-left: 16px;
         }
         
         .method-logo img {
           height: 24px;
           width: auto;
           object-fit: contain;
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
           margin-top: 8px;
           padding: 16px;
           background: #f8f9fa;
           border-radius: 4px;
         }
         
         .card-element-container {
           display: flex;
           flex-direction: column;
           gap: 8px;
         }
         
         .card-element-container label {
           font-family: var(--font-heading);
           font-weight: 500;
           font-size: 0.9rem;
           color: var(--color-text);
         }
         
         .card-element-wrapper {
           border: 1px solid #ddd;
           border-radius: 4px;
           padding: 16px;
           background-color: white;
           transition: border-color 0.2s ease;
         }
         
         .card-element-wrapper:focus-within {
           border-color: var(--color-ultramarine);
           box-shadow: 0 0 0 1px rgba(47, 62, 156, 0.2);
         }
         
         .card-element-info {
           font-size: 0.8rem;
           color: #666;
           margin-top: 8px;
           text-align: center;
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
           padding: 8px 12px;
           background-color: #f8f9fa;
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
           .method-content {
             flex-wrap: wrap;
             gap: 8px;
           }
           
           .method-logo {
             margin-left: auto;
           }
           
           .method-info {
             flex: 1;
             min-width: 0;
           }
           
           .card-field-row {
             flex-direction: column;
             gap: 8px;
           }
           
           .card-field-placeholder.small {
             width: 100%;
           }
         }
         
         @media (max-width: 480px) {
           .method-content {
             flex-direction: column;
             align-items: flex-start;
           }
           
           .method-logo {
             align-self: flex-start;
             margin-left: 0;
             margin-top: 8px;
           }
         }
      `}</style>
    </div>
  );
};

export default PaymentMethodSelector;