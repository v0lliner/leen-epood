import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTranslation } from 'react-i18next';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem, isInCart } = useCart();
  const { t } = useTranslation();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't add if already in cart or not available
    if (isInCart(product.id) || !product.available) {
      return;
    }
    
    addItem(product);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isProductInCart = isInCart(product.id);
  const canAddToCart = product.available && !isProductInCart;

  return (
    <Link 
      to={`/epood/toode/${product.slug}`} 
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={scrollToTop}
    >
      <div className="product-image">
        <img src={product.image} alt={product.title} />
        {!product.available && (
          <div className="sold-overlay">{t('shop.product.sold_out')}</div>
        )}
        {isProductInCart && product.available && (
          <div className="in-cart-overlay">{t('shop.product.in_cart')}</div>
        )}
        {canAddToCart && (
          <button 
            className={`add-to-cart-overlay ${isHovered ? 'visible' : ''}`}
            onClick={handleAddToCart}
            aria-label={t('shop.product.add_to_cart')}
          >
            <span className="desktop-text">{t('shop.product.add_to_cart')}</span>
            <span className="mobile-text">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        <p className="product-price">{product.price}</p>
      </div>

      <style jsx>{`
        .product-card {
          display: block;
          text-decoration: none;
          color: inherit;
        }

        .product-image {
          position: relative;
          width: 100%;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          aspect-ratio: 4/3;
          object-fit: cover;
          border-radius: 4px;
          transition: transform 0.3s ease;
        }

        .product-card:hover .product-image img {
          transform: scale(1.05);
        }

        .sold-overlay,
        .in-cart-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: 500;
          font-family: var(--font-heading);
        }

        .sold-overlay {
          background-color: rgba(0, 0, 0, 0.8);
        }

        .in-cart-overlay {
          background-color: var(--color-ultramarine);
        }

        .add-to-cart-overlay {
          position: absolute;
          bottom: 0;
          right: 0;
          background-color: rgba(47, 62, 156, 0);
          color: white;
          padding: 12px;
          text-align: center;
          font-weight: 500;
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 1rem;
          transition: all 0.2s ease;
          z-index: 10;
          opacity: 0;
        }

        .desktop-text {
          display: inline;
        }

        .mobile-text {
          display: none;
        }

        .add-to-cart-overlay.visible {
          opacity: 1;
          background-color: rgba(47, 62, 156, 0.8);
        }

        .add-to-cart-overlay:hover {
          background-color: rgba(30, 42, 122, 0.8);
          color: white !important;
        }

        .product-info {
          text-align: left;
        }

        /* Increased specificity to override global styles */
        .product-info .product-title {
          font-family: var(--font-heading);
          font-size: 1.125rem !important;
          font-weight: 400;
          margin-bottom: 8px;
          color: var(--color-text);
          margin-top: 0;
          line-height: 1.3;
        }

        .product-info .product-price {
          font-family: var(--font-heading);
          font-size: 1.250rem !important;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin: 0;
          line-height: 1.2;
        }

        @media (max-width: 768px) {
          .add-to-cart-overlay {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            bottom: 12px;
            right: 12px;
            padding: 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            background-color: rgba(47, 62, 156, 0.8);
            opacity: 1;
          }

          .desktop-text {
            display: none;
          }

          .mobile-text {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .mobile-text svg {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </Link>
  );
};

export default ProductCard;