import { useState, useEffect, useRef } from 'react';
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [parcelMachineError, setParcelMachineError] = useState('');
  const parcelMachinesCache = useRef({});
  const cacheExpiry = useRef({});
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Preload parcel machines data when component mounts
  useEffect(() => {
    // Preload Estonia's parcel machines by default
    fetchParcelMachines('ee', true);
  }, []);
  
  // Fetch parcel machines when country changes or shipping method becomes omniva
  useEffect(() => {
    if (formData.shippingMethod === 'omniva' && !initialLoading) {
      // Convert country name to country code
      const countryMap = {
        'Estonia': 'ee',
        'Finland': 'fi',
        'Latvia': 'lv',
        'Lithuania': 'lt'
      };
      
      const countryCode = countryMap[formData.country] || 'ee';
      fetchParcelMachines(countryCode);
    }
  }, [formData.country, formData.shippingMethod, initialLoading]);

  const fetchParcelMachines = async (countryCode, isPreload = false) => {
    if (isPreload) {
      setInitialLoading(true);
    } else {
      setLoadingParcelMachines(true);
    }
    setParcelMachineError('');
    
    // Check if we have cached data that's still valid
    const now = Date.now();
    if (
      parcelMachinesCache.current[countryCode] && 
      cacheExpiry.current[countryCode] && 
      now < cacheExpiry.current[countryCode]
    ) {
      setParcelMachines(parcelMachinesCache.current[countryCode]);
      setLoadingParcelMachines(false);
      if (isPreload) setInitialLoading(false);
      return;
    }
    
    try {      
      // Replace PHP endpoint with direct API call to Omniva
      const response = await fetch(`https://omniva.ee/locationsfull.json`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const allLocations = await response.json();
      
      // Filter locations by country code
      const filteredLocations = allLocations
        .filter(location => location.A0_NAME === countryCode.toUpperCase())
        .map(location => ({
          id: location.ZIP,
          name: location.NAME
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      // Cache the data
      parcelMachinesCache.current[countryCode] = filteredLocations;
      cacheExpiry.current[countryCode] = now + CACHE_DURATION;
      
      setParcelMachines(filteredLocations);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error fetching parcel machines:', err);
      }
      setParcelMachineError(t('checkout.shipping.omniva.fetch_error'));
    } finally {
      setLoadingParcelMachines(false);
      if (isPreload) setInitialLoading(false);
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
                disabled={loadingParcelMachines || initialLoading}
              >
                {!formData.omnivaParcelMachineId && (
                  <option value="">{t('checkout.shipping.omniva.select_placeholder')}</option>
                )}
                {parcelMachines.map(machine => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name.replace(/^1\. eelistus\/Picapac pakiautomaat/, '').trim()}
                  </option>
                ))}
              </select>
              
              {(loadingParcelMachines || initialLoading) && (
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
              
              {!loadingParcelMachines && !initialLoading && parcelMachines.length > 0 && (
                <div className="info-message">
                  {parcelMachines.length} pakiautomaati leitud
                </div>
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
          color: #28a745;
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
