import React from 'react';

/**
 * Shipping address form component
 * 
 * @param {Object} props
 * @param {Object} props.shippingInfo - Shipping information state
 * @param {Function} props.onChange - Change handler function
 * @param {Object} props.errors - Validation errors
 */
const ShippingAddressForm = ({ shippingInfo, onChange, errors = {} }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange('shipping', name, value);
  };

  const countries = [
    { value: 'estonia', label: 'Eesti' },
    { value: 'finland', label: 'Soome' },
    { value: 'latvia', label: 'Läti' },
    { value: 'lithuania', label: 'Leedu' }
  ];

  return (
    <div className="checkout-section">
      <h3>Tarneaadress</h3>
      
      <div className="form-group">
        <label htmlFor="street">Tänav, maja, korter *</label>
        <input
          type="text"
          id="street"
          name="street"
          value={shippingInfo.street || ''}
          onChange={handleChange}
          className={`form-input ${errors.street ? 'error' : ''}`}
          placeholder="Tänav, maja, korter"
        />
        {errors.street && <div className="error-message">{errors.street}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="city">Linn *</label>
        <input
          type="text"
          id="city"
          name="city"
          value={shippingInfo.city || ''}
          onChange={handleChange}
          className={`form-input ${errors.city ? 'error' : ''}`}
          placeholder="Linn või asula"
        />
        {errors.city && <div className="error-message">{errors.city}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="postalCode">Postiindeks *</label>
        <input
          type="text"
          id="postalCode"
          name="postalCode"
          value={shippingInfo.postalCode || ''}
          onChange={handleChange}
          className={`form-input ${errors.postalCode ? 'error' : ''}`}
          placeholder="12345"
        />
        {errors.postalCode && <div className="error-message">{errors.postalCode}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="country">Riik *</label>
        <select
          id="country"
          name="country"
          value={shippingInfo.country || 'estonia'}
          onChange={handleChange}
          className="form-input"
        >
          {countries.map(country => (
            <option key={country.value} value={country.value}>
              {country.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ShippingAddressForm;