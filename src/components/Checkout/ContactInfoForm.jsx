import React from 'react';

/**
 * Contact information form component
 * 
 * @param {Object} props
 * @param {Object} props.contactInfo - Contact information state
 * @param {Function} props.onChange - Change handler function
 * @param {Object} props.errors - Validation errors
 */
const ContactInfoForm = ({ contactInfo, onChange, errors = {} }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange('contact', name, value);
  };

  return (
    <div className="checkout-section">
      <h3>Kontaktandmed</h3>
      
      <div className="form-group">
        <label htmlFor="firstName">Nimi *</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={contactInfo.firstName || ''}
          onChange={handleChange}
          className={`form-input ${errors.firstName ? 'error' : ''}`}
          placeholder="Teie täisnimi"
        />
        {errors.firstName && <div className="error-message">{errors.firstName}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="email">E-post *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={contactInfo.email || ''}
          onChange={handleChange}
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder="teie@email.ee"
        />
        {errors.email && <div className="error-message">{errors.email}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="phone">Telefon *</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={contactInfo.phone || ''}
          onChange={handleChange}
          className={`form-input ${errors.phone ? 'error' : ''}`}
          placeholder="+372 5xxx xxxx"
        />
        {errors.phone && <div className="error-message">{errors.phone}</div>}
      </div>
    </div>
  );
};

export default ContactInfoForm;