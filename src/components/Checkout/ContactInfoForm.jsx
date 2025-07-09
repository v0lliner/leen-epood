import { useTranslation } from 'react-i18next';

const ContactInfoForm = ({ formData, onChange, validationErrors }) => {
  const { t } = useTranslation();

  return (
    <div className="contact-info-form">
      <h3 className="section-title">{t('checkout.shipping.contact.title')}</h3>
      
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="firstName">Eesnimi *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={onChange}
            className={`form-input ${validationErrors.firstName ? 'has-error' : ''}`}
            placeholder="Eesnimi"
            required
          />
          {validationErrors.firstName && (
            <div className="error-message">{validationErrors.firstName}</div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">Perekonnanimi *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={onChange}
            className={`form-input ${validationErrors.lastName ? 'has-error' : ''}`}
            placeholder="Perekonnanimi"
            required
          />
          {validationErrors.lastName && (
            <div className="error-message">{validationErrors.lastName}</div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="email">{t('checkout.shipping.contact.email')} *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            className={`form-input ${validationErrors.email ? 'has-error' : ''}`}
            placeholder={t('checkout.shipping.contact.email_placeholder')}
            required
          />
          {validationErrors.email && (
            <div className="error-message">{validationErrors.email}</div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">{t('checkout.shipping.contact.phone')} *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            className={`form-input ${validationErrors.phone ? 'has-error' : ''}`}
            placeholder={t('checkout.shipping.contact.phone_placeholder')}
            required
          />
          {validationErrors.phone && (
            <div className="error-message">{validationErrors.phone}</div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="companyName">Firma nimi (pole kohustuslik)</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={onChange}
            className="form-input"
            placeholder="Firma nimi"
          />
        </div>
      </div>

      <style jsx>{`
        .contact-info-form {
          margin-bottom: 32px;
        }
        
        .section-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-group:last-child {
          grid-column: span 2;
        }
        
        .form-group label {
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--color-text);
        }
        
        .form-input {
          padding: 16px 16px;
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
        
        .error-message {
          color: #dc3545;
          font-size: 0.85rem;
          margin-top: 4px;
        }
        
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .form-group:last-child {
            grid-column: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ContactInfoForm;