import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const PaymentMethodSelector = ({ 
  formData, 
  onChange, 
  validationErrors,
  onPaymentMethodChange
}) => {
  const { t } = useTranslation();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Bank country options
  const bankCountries = [
    { code: 'ee', name: 'Eesti' },
    { code: 'lv', name: 'Läti' },
    { code: 'lt', name: 'Leedu' },
    { code: 'fi', name: 'Soome' }
  ];

  // Bank logos (placeholder paths - these should be replaced with actual logo paths)
  const bankLogos = {
    'swedbank': '/assets/banks/placeholder.svg',
    'seb': '/assets/banks/placeholder.svg',
    'lhv': '/assets/banks/placeholder.svg',
    'luminor': '/assets/banks/placeholder.svg',
    'coop': '/assets/banks/placeholder.svg',
    'citadele': '/assets/banks/placeholder.svg',
    'n26': '/assets/banks/placeholder.svg',
    'revolut': '/assets/banks/placeholder.svg',
    'wise': '/assets/banks/placeholder.svg'
  };

  // Hardcoded bank data for each country
  // In a real implementation, this would come from an API
  const banksByCountry = {
    'ee': [
      { id: 'swedbank', name: 'Swedbank' },
      { id: 'seb', name: 'SEB' },
      { id: 'lhv', name: 'LHV' },
      { id: 'luminor', name: 'Luminor' },
      { id: 'coop', name: 'Coop Pank' }
    ],
    'lv': [
      { id: 'swedbank', name: 'Swedbank' },
      { id: 'seb', name: 'SEB' },
      { id: 'citadele', name: 'Citadele' }
    ],
    'lt': [
      { id: 'swedbank', name: 'Swedbank' },
      { id: 'seb', name: 'SEB' },
      { id: 'luminor', name: 'Luminor' }
    ],
    'fi': [
      { id: 'n26', name: 'N26' },
      { id: 'revolut', name: 'Revolut' },
      { id: 'wise', name: 'Wise' }
    ]
  };

  // Update available banks when bank country changes
  useEffect(() => {
    setBanks(banksByCountry[formData.bankCountry] || []);
  }, [formData.bankCountry]);

  const handleBankCountryChange = (e) => {
    const { value } = e.target;
    onChange({
      target: {
        name: 'bankCountry',
        value
      }
    });
    
    // Reset selected payment method when country changes
    onPaymentMethodChange('');
  };

  const handleBankSelection = (bankId) => {
    onPaymentMethodChange(bankId);
  };

  return (
    <div className="payment-method-selector">
      <h3 className="section-title">{t('checkout.payment.title')}</h3>
      
      <div className="form-group">
        <label htmlFor="bankCountry">Vali panga riik</label>
        <select
          id="bankCountry"
          name="bankCountry"
          value={formData.bankCountry}
          onChange={handleBankCountryChange}
          className="form-input"
        >
          {bankCountries.map(country => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="bank-selection">
        <label className="bank-label">Vali pank</label>
        
        {loading ? (
          <div className="loading-message">{t('checkout.payment.loading_methods')}</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : banks.length === 0 ? (
          <div className="info-message">{t('checkout.payment.no_methods')}</div>
        ) : (
          <div className="banks-grid">
            {banks.map(bank => (
              <div 
                key={bank.id} 
                className={`bank-option ${formData.paymentMethod === bank.id ? 'selected' : ''}`}
                onClick={() => handleBankSelection(bank.id)}
              >
                <div className="bank-content">
                  <div className="bank-name">{bank.name}</div>
                  <div className="bank-check">✓</div>
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
        
        .banks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
        }
        
        .bank-option {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .bank-option:hover {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }
        
        .bank-option.selected {
          border-color: var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.1);
        }
        
        .bank-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .bank-name {
          font-weight: 500;
        }
        
        .bank-check {
          color: var(--color-ultramarine);
          font-weight: bold;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .bank-option.selected .bank-check {
          opacity: 1;
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
        
        @media (max-width: 768px) {
          .banks-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
          }
          
          .bank-option {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentMethodSelector;