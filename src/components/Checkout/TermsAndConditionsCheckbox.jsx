import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const TermsAndConditionsCheckbox = ({ checked, onChange, validationError }) => {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="terms-checkbox">
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="termsAccepted"
          checked={checked}
          onChange={onChange}
          className={`checkbox-input ${validationError ? 'has-error' : ''}`}
        />
        <span className="checkbox-text">
          <span className="terms-agree">{t('checkout.terms.agree')}</span>{' '}
          <Link 
            to="/muugitingimused" 
            className="terms-link"
            onClick={scrollToTop}
            target="_blank"
          >
            {t('checkout.terms.terms_link')}
          </Link>
        </span>
      </label>
      
      {validationError && (
        <div className="error-message">{validationError}</div>
      )}

      <style jsx>{`
        .terms-checkbox {
          margin-bottom: 52px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
        }
        
        .checkbox-input {
          margin-top: 3px;
          width: 16px;
          height: 16px;
          accent-color: var(--color-ultramarine);
        }
        
        .checkbox-input.has-error {
          outline: 1px solid #dc3545;
        }
        
        .checkbox-text {
          font-size: 0.9rem;
          color: var(--color-text);
        }
        
        .terms-agree {
          font-family: var(--font-heading);
          font-weight: 500;
        }
        
        .terms-link {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          text-decoration: underline;
          transition: opacity 0.2s ease;
        }
        
        .terms-link:hover {
          opacity: 0.8;
        }
        
        .error-message {
          color: #dc3545;
          font-size: 0.85rem;
          margin-top: 8px;
          margin-left: 24px;
        }
      `}</style>
    </div>
  );
};

export default TermsAndConditionsCheckbox;