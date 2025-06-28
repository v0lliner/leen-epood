import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const CartSummary = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { items, removeItem, getTotalPrice, getTotalItems } = useCart();

  if (getTotalItems() === 0) {
    return (
      <>
        <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
        <div className={`cart-container ${isOpen ? 'open' : ''}`}>
          <div className="cart-header">
            <h3>{t('cart.title')}</h3>
            <button className="cart-close" onClick={onClose}>×</button>
          </div>
          <div className="cart-content">
            <p className="cart-empty">{t('cart.empty')}</p>
            <Link to="/epood" className="back-to-shop" onClick={onClose}>
              {t('cart.back_to_shop')}
            </Link>
          </div>
        </div>
        <style jsx>{`
          .cart-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 998;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }

          .cart-overlay.open {
            opacity: 1;
            visibility: visible;
          }

          .cart-container {
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background-color: var(--color-background);
            z-index: 999;
            transition: right 0.3s ease;
            overflow-y: auto;
          }

          .cart-container.open {
            right: 0;
          }

          .cart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid #f0f0f0;
          }

          .cart-header h3 {
            font-family: var(--font-heading);
            font-size: 1.25rem;
            color: var(--color-ultramarine);
            margin: 0;
          }

          .cart-close {
            font-size: 1.5rem;
            color: var(--color-text);
            background: none;
            border: none;
            cursor: pointer;
          }

          .cart-content {
            padding: 24px;
            text-align: center;
          }

          .cart-empty {
            margin-bottom: 24px;
            color: #666;
          }

          .back-to-shop {
            color: var(--color-ultramarine);
            text-decoration: none;
            font-weight: 500;
          }

          .back-to-shop:hover {
            text-decoration: underline;
          }

          @media (max-width: 480px) {
            .cart-container {
              width: 100vw;
              right: -100vw;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`cart-container ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>{t('cart.title')} ({getTotalItems()})</h3>
          <button className="cart-close" onClick={onClose}>×</button>
        </div>
        
        <div className="cart-content">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="item-details">
                  <h4 className="item-title">{item.title}</h4>
                  <p className="item-price">{item.price}</p>
                  <p className="item-quantity">{t('cart.quantity')}: {item.quantity}</p>
                </div>
                <button 
                  className="remove-item"
                  onClick={() => removeItem(item.id)}
                >
                  {t('cart.remove')}
                </button>
              </div>
            ))}
          </div>
          
          <div className="cart-footer">
            <div className="cart-total">
              <strong>{t('cart.total')}: {getTotalPrice().toFixed(2)}€</strong>
            </div>
            <Link 
              to="/checkout" 
              className="checkout-button"
              onClick={onClose}
            >
              {t('cart.continue')}
            </Link>
          </div>
        </div>

        <style jsx>{`
          .cart-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 998;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }

          .cart-overlay.open {
            opacity: 1;
            visibility: visible;
          }

          .cart-container {
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background-color: var(--color-background);
            z-index: 999;
            transition: right 0.3s ease;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
          }

          .cart-container.open {
            right: 0;
          }

          .cart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid #f0f0f0;
          }

          .cart-header h3 {
            font-family: var(--font-heading);
            font-size: 1.25rem;
            color: var(--color-ultramarine);
            margin: 0;
          }

          .cart-close {
            font-size: 1.5rem;
            color: var(--color-text);
            background: none;
            border: none;
            cursor: pointer;
          }

          .cart-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 24px;
          }

          .cart-items {
            flex: 1;
            margin-bottom: 24px;
          }

          .cart-item {
            display: flex;
            gap: 16px;
            padding: 16px 0;
            border-bottom: 1px solid #f0f0f0;
          }

          .cart-item:last-child {
            border-bottom: none;
          }

          .item-image {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
          }

          .item-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 4px;
          }

          .item-details {
            flex: 1;
          }

          .item-title {
            font-family: var(--font-heading);
            font-size: 0.9rem;
            font-weight: 400;
            margin-bottom: 4px;
            color: var(--color-text);
            margin-top: 0;
          }

          .item-price {
            font-family: var(--font-heading);
            font-weight: 500;
            color: var(--color-ultramarine);
            margin-bottom: 4px;
            margin-top: 0;
          }

          .item-quantity {
            font-size: 0.8rem;
            color: #666;
            margin: 0;
          }

          .remove-item {
            background: none;
            border: none;
            color: #999;
            font-size: 0.8rem;
            cursor: pointer;
            text-decoration: underline;
            align-self: flex-start;
          }

          .remove-item:hover {
            color: var(--color-text);
          }

          .cart-footer {
            border-top: 1px solid #f0f0f0;
            padding-top: 24px;
          }

          .cart-total {
            font-family: var(--font-heading);
            font-size: 1.125rem;
            text-align: center;
            margin-bottom: 24px;
            color: var(--color-text);
          }

          .checkout-button {
            display: block;
            width: 100%;
            padding: 16px;
            background-color: var(--color-ultramarine);
            color: white;
            text-decoration: none;
            text-align: center;
            border-radius: 4px;
            font-family: var(--font-body);
            font-weight: 500;
            transition: opacity 0.2s ease;
          }

          .checkout-button:hover {
            opacity: 0.9;
          }

          @media (max-width: 480px) {
            .cart-container {
              width: 100vw;
              right: -100vw;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default CartSummary;