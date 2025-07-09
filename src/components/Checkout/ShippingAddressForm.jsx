import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ShippingAddressForm = ({ 
  formData, 
  onChange, 
  validationErrors,
  onShippingMethodChange,
  onParcelMachineSelect,
  omnivaShippingPrice
}) => {
  const { t } = useTranslation();
  const [parcelMachines, setParcelMachines] = useState([]);
  const [loadingParcelMachines, setLoadingParcelMachines] = useState(false);
  const [parcelMachineError, setParcelMachineError] = useState('');

  // Fetch parcel machines when country changes
  useEffect(() => {
    if (formData.shippingMethod === 'omniva') {
      fetchParcelMachines();
    }
  }, [formData.country, formData.shippingMethod]);

  const fetchParcelMachines = async () => {
    setLoadingParcelMachines(true);
    setParcelMachineError('');
    
    try {
      // Convert country name to country code for API
      const countryMap = {
        'Estonia': 'ee',
        'Finland': 'fi',
        'Latvia': 'lv',
        'Lithuania': 'lt'
      };
      
      const countryCode = countryMap[formData.country] || 'ee';
      
      const response = await fetch(`/php/get-omniva-parcel-machines.php?country=${countryCode}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setParcelMachines(data.parcelMachines || []);
      } else {
        throw new Error(data.error || 'Failed to load parcel machines');
      }
    } catch (err) {
      console.error('Error fetching parcel machines:', err);
      setParcelMachineError(t('checkout.shipping.omniva.fetch_error'));
    } finally {
      setLoadingParcelMachines(false);
    }
  };

  const handleShippingMethodChange = (method) => {
    onShippingMethodChange(method);
  };

  const handleParcelMachineChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    
    const selectedMachine = parcelMachines.find(machine => machine.id === selectedId);
    if (selectedMachine) {
      onParcelMachineSelect(selectedId, selectedMachine.name);
    }
  };

  return (
    <div className="shipping-address-form">
      <h3 className="section-title">{t('checkout.shipping.title')}</h3>
      <div className="shipping-methods">
        {/* Pickup option */}
        <div className="shipping-method">
          <label className="method-label">
            <input
              type="radio"
              name="shippingMethod"
              value="pickup"
              checked={formData.shippingMethod === 'pickup'}
              onChange={() => handleShippingMethodChange('pickup')}
              className="method-radio"
            />
            <div className="method-content">
              <div className="method-info">
                <h4 className="method-title">Tulen ise järele</h4>
                <p className="method-address">Jõeääre, Märjamaa, Märjamaa vald 78218</p>
              </div>
              <div className="method-price">Tasuta</div>
            </div>
          </label>
        </div>
        
        {/* Omniva option */}
        <div className="shipping-method">
          <label className="method-label">
            <input
              type="radio"
              name="shippingMethod"
              value="omniva"
              checked={formData.shippingMethod === 'omniva'}
              onChange={() => handleShippingMethodChange('omniva')}
              className="method-radio"
            />
            <div className="method-content">
              <div className="method-info">
                <h4 className="method-title">{t('checkout.shipping.omniva.title')}</h4>
                <p className="method-description">Toode saadetakse valitud pakiautomaati</p>
              </div>
              <div className="method-price">{omnivaShippingPrice.toFixed(1)}€</div>
            </div>
          </label>
        </div>
        
        {/* Parcel machine selector (conditional) */}
        {formData.shippingMethod === 'omniva' && (
          <div>
            <div className="form-group">
              <label htmlFor="country">{t('checkout.shipping.address.country')}</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={onChange}
                className="form-input"
              >
                <option value="Estonia">{t('checkout.shipping.address.countries.estonia')}</option>
                <option value="Finland">{t('checkout.shipping.address.countries.finland')}</option>
                <option value="Latvia">{t('checkout.shipping.address.countries.latvia')}</option>
                <option value="Lithuania">{t('checkout.shipping.address.countries.lithuania')}</option>
              </select>
            </div>
            
            <div className="parcel-machine-selector">
              <label htmlFor="omnivaParcelMachineId">{t('checkout.shipping.omniva.select_machine')}</label>
              
              <select
                id="omnivaParcelMachineId"
                name="omnivaParcelMachineId"
                value={formData.omnivaParcelMachineId}
                onChange={handleParcelMachineChange}
                className={`form-input ${validationErrors.omnivaParcelMachineId ? 'has-error' : ''}`}
                disabled={loadingParcelMachines}
              >
                {!formData.omnivaParcelMachineId && (
                  <option value="">{t('checkout.shipping.omniva.select_placeholder')}</option>
                )}
                {parcelMachines.map(machine => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </select>
              
              {loadingParcelMachines && (
                <div className="loading-message">{t('checkout.shipping.omniva.loading')}</div>
              )}
              
              {parcelMachineError && (
                <div className="error-message">{parcelMachineError}</div>
              )}
              
              {!loadingParcelMachines && !parcelMachineError && parcelMachines.length === 0 && (
                <div className="info-message">{t('checkout.shipping.omniva.no_machines')}</div>
              )}
              
              {validationErrors.omnivaParcelMachineId && (
                <div className="error-message">{validationErrors.omnivaParcelMachineId}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .shipping-address-form {
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
        
        .form-input.has-error {
          border-color: #dc3545;
        }
        
        .shipping-methods {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .shipping-method {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }
        
        .shipping-method:hover {
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
        
        .method-description,
        .method-address {
          font-size: 0.85rem;
          color: #666;
          margin: 0;
        }
        
        .method-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
          white-space: nowrap;
          margin-left: 16px;
        }
        
        .parcel-machine-selector {
          margin-top: 8px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .parcel-machine-selector label {
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--color-text);
        }
        
        .loading-message {
          font-size: 0.85rem;
          color: #666;
          font-style: italic;
          margin-top: 8px;
        }
        
        .error-message {
          color: #dc3545;
          font-size: 0.85rem;
          margin-top: 4px;
        }
        
        .info-message {
          font-size: 0.85rem;
          color: #666;
          margin-top: 8px;
        }
        
        @media (max-width: 768px) {
          .method-content {
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .method-price {
            margin-left: auto;
          }
          
          .method-info {
            flex: 1;
            min-width: 0;
          }
        }
        
        @media (max-width: 480px) {
          .method-content {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .method-price {
            align-self: flex-start;
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ShippingAddressForm;