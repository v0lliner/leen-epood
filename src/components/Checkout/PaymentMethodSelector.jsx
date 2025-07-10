import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Test card image URL
const TEST_CARD_IMAGE_URL = 'https://static.maksekeskus.ee/img/channel/lnd/card.png';

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

  // Check if test card option should be shown
  const showTestCard = import.meta.env.VITE_SHOW_TEST_CARD === 'true';

  // Bank country options
  const bankCountries = [
    { code: 'ee', name: 'Eesti' },
    { code: 'lt', name: 'Leedu' },
    { code: 'fi', name: 'Soome' },
    { code: 'lv', name: 'Läti' }
  ];

  // Bank logos from Maksekeskus CDN
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
      { id: 'swedbank', name: 'Swedbank', type: 'pangalink' },
      { id: 'seb', name: 'SEB Pank', type: 'pangalink' },
      { id: 'lhv', name: 'LHV Pank', type: 'pangalink' },
      { id: 'luminor', name: 'Luminor', type: 'pangalink' },
      { id: 'coop', name: 'Coop Pank', type: 'pangalink' },
      { id: 'citadele', name: 'Citadele', type: 'pis' },
      { id: 'n26', name: 'N26', type: 'pis' },
      { id: 'revolut', name: 'Revolut', type: 'pis' },
      { id: 'wise', name: 'Wise', type: 'pis' }
    ],
    'lv': [
      { id: 'swedbank', name: 'Swedbank', type: 'pangalink' },
      { id: 'seb', name: 'SEB', type: 'pangalink' },
      { id: 'citadele', name: 'Citadele', type: 'pangalink' },
      { id: 'luminor', name: 'Luminor', type: 'pangalink' },
      { id: 'n26', name: 'N26', type: 'pis' },
      { id: 'revolut', name: 'Revolut', type: 'pis' },
      { id: 'wise', name: 'Wise', type: 'pis' }
    ],
    'lt': [
      { id: 'swedbank', name: 'Swedbank', type: 'pangalink' },
      { id: 'seb', name: 'SEB', type: 'pangalink' },
      { id: 'luminor', name: 'Luminor', type: 'pangalink' },
      { id: 'n26', name: 'N26', type: 'pis' },
      { id: 'revolut', name: 'Revolut', type: 'pis' },
      { id: 'wise', name: 'Wise', type: 'pis' }
    ],
    'fi': [
      { id: 'n26', name: 'N26', type: 'pis' },
      { id: 'revolut', name: 'Revolut', type: 'pis' },
      { id: 'wise', name: 'Wise', type: 'pis' }
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
          <div className={`banks-grid banks-${formData.bankCountry}`}>
            {banks.map(bank => (
              <div 
                key={bank.id} 
                className={`bank-option ${formData.paymentMethod === bank.id ? 'selected' : ''}`}
                onClick={() => handleBankSelection(bank.id)}
              >
                <div className="bank-logo-container">
                  <img 
                    src={bankLogos[bank.id] || `${BANK_LOGO_URL}${bank.id}.png`} 
                    alt={bank.name} 
                    className="bank-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/banks/placeholder.svg';
                    }}
                  />
                </div>
              </div>
            ))}
            
            {/* Test Card Option - only shown if enabled in environment */}
            {showTestCard && (
              <div 
                className={`bank-option test-card ${formData.paymentMethod === 'test_card' ? 'selected' : ''}`}
                onClick={() => handleBankSelection('test_card')}
              >
                <div className="bank-logo-container">
                  <img 
                    src={TEST_CARD_IMAGE_URL}
                    alt="Test Card"
                    className="bank-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/banks/placeholder.svg';
                    }}
                  />
                </div>
                <div className="test-card-label">Test Card</div>
              </div>
            )}
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
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 16px;
        }
        
        .banks-ee {
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        }
        
        .bank-option {
          border: none;
          border-radius: 4px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 80px;
        }
        
        .bank-option:hover {
          background-color: rgba(47, 62, 156, 0.05);
        }
        
        .bank-option.selected {
          border: 2px solid var(--color-ultramarine);
          background-color: rgba(47, 62, 156, 0.05);
        }
        
        .bank-logo-container {
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .bank-logo {
          width: 100%;
          height: auto;
          max-height: 100%;
          object-fit: contain;
          padding: 8px;
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
          .banks-grid {
            grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
            gap: 8px;
            margin-top: 8px;
          }
          
          .banks-ee {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .bank-option {
            padding: 6px;
            height: 60px;
          }
          
          .bank-logo {
            padding: 4px;
          }
        }
        
        @media (max-width: 480px) {
          .banks-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }
          
          .banks-ee {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .bank-option {
            height: 50px;
            padding: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentMethodSelector;