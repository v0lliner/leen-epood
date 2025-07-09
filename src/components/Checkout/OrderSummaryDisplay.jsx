import { useTranslation } from 'react-i18next';

const OrderSummaryDisplay = ({ 
  itemSubtotal, 
  deliveryCost, 
  totalAmount,
  isSubmitting,
  onSubmit
}) => {
  const { t } = useTranslation();

  return (
    <div className="order-summary">
      <h3 className="section-title">{t('checkout.summary.title')}</h3>
      
      <div className="summary-rows">
        <div className="summary-row">
          <span className="summary-label">{t('checkout.summary.subtotal')}</span>
          <span className="summary-value">{itemSubtotal.toFixed(2)}€</span>
        </div>
        
        <div className="summary-row">
          <span className="summary-label">{t('checkout.summary.shipping')}</span>
          <span className="summary-value">{deliveryCost.toFixed(2)}€</span>
        </div>
        
        <div className="summary-row total">
          <span className="summary-label">{t('checkout.summary.total')}</span>
          <span className="summary-value">{totalAmount.toFixed(2)}€</span>
        </div>
      </div>
      
      <div className="summary-info">
        <div className="info-item">
          <span className="info-icon">🔒</span>
          <span className="info-text">{t('checkout.summary.info.secure')}</span>
        </div>
        
        <div className="info-item">
          <span className="info-icon">🚚</span>
          <span className="info-text">{t('checkout.summary.info.shipping')}</span>
        </div>
        
        <div className="info-item">
          <span className="info-icon">✉️</span>
          <span className="info-text">{t('checkout.summary.info.personal')}</span>
        </div>
      </div>
      
      <button 
        type="submit"
        className="checkout-button"
        disabled={isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? t('checkout.summary.processing') : 'VORMISTA OST'}
      </button>

      <style jsx>{`
        .order-summary {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 24px;
        }
        
        .section-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
        }
        
        .summary-rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .summary-row.total {
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 1.125rem;
          color: var(--color-ultramarine);
          padding-top: 8px;
        }
        
        .summary-label {
          color: var(--color-text);
        }
        
        .summary-value {
          font-weight: 500;
        }
        
        .summary-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.85rem;
          color: #666;
        }
        
        .info-icon {
          font-size: 1rem;
        }
        
        .checkout-button {
          width: 100%;
          padding: 16px;
          background-color: var(--color-ultramarine);
          color: white;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        
        .checkout-button:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .checkout-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default OrderSummaryDisplay;