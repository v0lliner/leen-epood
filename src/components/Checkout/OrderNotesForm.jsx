import { useTranslation } from 'react-i18next';

const OrderNotesForm = ({ formData, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="order-notes-form">
      <div className="form-group">
        <label htmlFor="notes">{t('checkout.shipping.notes.notes')}</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={onChange}
          className="form-textarea"
          placeholder={t('checkout.shipping.notes.notes_placeholder')}
          rows={4}
        />
      </div>

      <style jsx>{`
        .order-notes-form {
          margin-bottom: 32px;
          margin-top: -40px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-group label {
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--color-text);
        }
        
        .form-textarea {
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: var(--font-body);
          font-size: 1rem;
          transition: border-color 0.2s ease;
          resize: vertical;
          min-height: 100px;
        }
        
        .form-textarea:focus {
          outline: none;
          border-color: var(--color-ultramarine);
        }
      `}</style>
    </div>
  );
};

export default OrderNotesForm;