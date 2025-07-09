import React, { useState, useEffect } from 'react';

/**
 * Payment method selector component
 * 
 * @param {Object} props
 * @param {string} props.selectedMethod - Currently selected payment method
 * @param {Function} props.onSelect - Selection handler function
 * @param {Object} props.error - Validation error
 */
const PaymentMethodSelector = ({ selectedMethod, onSelect, error }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  
  // Simulated payment methods - in a real app, these would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPaymentMethods([
        { id: 'swed', name: 'Swedbank', type: 'bank', logo: '/assets/banks/placeholder.svg' },
        { id: 'seb', name: 'SEB', type: 'bank', logo: '/assets/banks/placeholder.svg' },
        { id: 'lhv', name: 'LHV Pank', type: 'bank', logo: '/assets/banks/placeholder.svg' },
        { id: 'coop', name: 'Coop Pank', type: 'bank', logo: '/assets/banks/placeholder.svg' },
        { id: 'luminor', name: 'Luminor', type: 'bank', logo: '/assets/banks/placeholder.svg' },
        { id: 'card', name: 'Pangakaart', type: 'card', logo: '/assets/banks/placeholder.svg' }
      ]);
      setLoading(false);
    }, 500);
  }, []);
  
  return (
    <div className="payment-method-selector">
      <h3>Makseviis</h3>
      
      {loading ? (
        <div className="loading-indicator">Laadin maksevõimalusi...</div>
      ) : fetchError ? (
        <div className="error-message">{fetchError}</div>
      ) : paymentMethods.length === 0 ? (
        <div className="info-message">Maksevõimalusi ei leitud</div>
      ) : (
        <div className={`payment-methods ${error ? 'has-error' : ''}`}>
          {paymentMethods.map(method => (
            <div 
              key={method.id}
              className={`payment-method ${selectedMethod === method.id ? 'selected' : ''}`}
              onClick={() => onSelect(method.id)}
            >
              <div className="payment-method-content">
                <div className="payment-method-logo">
                  {/* Placeholder for logo */}
                  <div className="logo-placeholder">{method.name.charAt(0)}</div>
                </div>
                <div className="payment-method-name">{method.name}</div>
              </div>
              <div className="payment-method-check">
                {selectedMethod === method.id && <span>✓</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default PaymentMethodSelector;