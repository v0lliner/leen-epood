import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Bank logos URL format from Maksekeskus
const BANK_LOGO_URL = 'https://static.maksekeskus.ee/img/channel/lnd/';

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
    'swedbank': `${BANK_LOGO_URL}swedbank.png`,
    'seb': `${BANK_LOGO_URL}seb.png`,
    'lhv': `${BANK_LOGO_URL}lhv.png`,
    'luminor': `${BANK_LOGO_URL}luminor.png`,
    'coop': `${BANK_LOGO_URL}coop.png`,
    'citadele': `${BANK_LOGO_URL}citadele.png`,
    'n26': `${BANK_LOGO_URL}n26.png`,
    'revolut': `${BANK_LOGO_URL}revolut.png`,
    'wise': `${BANK_LOGO_URL}wise.png`,
    'knik': `${BANK_LOGO_URL}knik.png`,
    'pis': `${BANK_LOGO_URL}pis.png`,
    'pangalink': `${BANK_LOGO_URL}pangalink.png`
  };

  // Hardcoded bank data for each country
  // In a real implementation, this would come from an API
  const banksByCountry = {
    'ee': [
      { id: 'swedbank', name: 'Swedbank' },
      { id: 'seb', name: 'SEB Pank' },
      { id: 'lhv', name: 'LHV Pank' },
      { id: 'luminor', name: 'Luminor' },
      { id: 'coop', name: 'Coop Pank' },
      { id: 'knik', name: 'Knik' },
      { id: 'citadele', name: 'Citadele' }
    ],
    'lv': [
      { id: 'swedbank', name: 'Swedbank' },
      { id: 'seb', name: 'SEB' },
      { id: 'citadele', name: 'Citadele' },
      { id: 'luminor', name: 'Luminor' }
    ],
    'lt': [
      { id: 'swedbank', name: 'Swedbank' },
      { id: 'seb', name: 'SEB' },
      { id: 'luminor', name: 'Luminor' },
      { id: 'knik', name: 'Knik' }
    ],
    'fi': [
      { id: 'n26', name: 'N26' },
      { id: 'revolut', name: 'Revolut' },
      { id: 'wise', name: 'Wise' },
      { id: 'knik', name: 'Knik' }
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
                <div className="bank-logo-container">
                  <img 
                    src={bankLogos[bank.id] || `${BANK_LOGO_URL}${bank.id}.png`} 
                    alt={bank.name} 
                    className="bank-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${BANK_LOGO_URL}default.png`;
                    }}
                  />
                </div>
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
          align-items: flex-start;
        }
        
        .bank-logo-container {
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .bank-logo {
          max-width: 100%;
          max-height: 40px;
          object-fit: contain;
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
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
          }
          
          .bank-option {
            padding: 12px;
          }
          
          .bank-logo {
            max-height: 30px;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentMethodSelector;