import { useTranslation } from 'react-i18next';

const CartSummaryDisplay = ({ cartItems }) => {
  const { t } = useTranslation();

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="cart-summary-empty">
        <p>{t('cart.empty')}</p>
      </div>
    );
  }

  return (
    <div className="cart-summary">
      <h3 className="section-title">{t('checkout.review.title')}</h3>
      
      <div className="cart-items">
        {cartItems.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="item-image">
              <img src={item.image} alt={item.title} />
            </div>
            <div className="item-details">
              <h4 className="item-title">{item.title}</h4>
              <div className="item-category">{item.category}</div>
              
              {/* Show dimensions if available */}
              {item.dimensions && (
                <div className="item-dimensions">
                  {item.dimensions.height && item.dimensions.width && item.dimensions.depth && (
                    `${item.dimensions.height}×${item.dimensions.width}×${item.dimensions.depth}cm`
                  )}
                </div>
              )}
              
            </div>
            <div className="item-price">{item.price}</div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .cart-summary {
          margin-bottom: 32px;
        }
        
        .section-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
        }
        
        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .cart-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f0f0f0;
          gap: 16px;
        }
        
        .item-image {
          width: 60px;
          height: 60px;
          flex-shrink: 0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .item-details {
          flex: 1;
        }
        
        .item-title {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 500;
          margin: 0 0 4px 0;
          color: var(--color-text);
        }
        
        .item-category {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 4px;
          text-transform: capitalize;
        }
        
        .item-dimensions {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 4px;
          font-family: var(--font-heading);
        }
        
        .item-quantity {
          font-size: 0.85rem;
          color: #666;
        }
        
        .item-price {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
          font-size: 1.125rem;
          white-space: nowrap;
          margin-left: 16px;
        }
        
        .cart-summary-empty {
          padding: 24px;
          text-align: center;
          background: #f8f9fa;
          border-radius: 8px;
          color: #666;
        }
        
        @media (max-width: 768px) {
          .cart-item {
            flex-wrap: wrap;
          }
          
          .item-price {
            margin-left: 0;
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default CartSummaryDisplay;