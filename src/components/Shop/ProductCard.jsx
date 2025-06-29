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
        {isHovered && canAddToCart && (
          <button 
            className="add-to-cart-overlay"
            onClick={handleAddToCart}
          >
            {t('shop.product.add_to_cart')}
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
          left: 0;
          right: 0;
          background-color: var(--color-ultramarine);
          color: white;
          padding: 12px;
          text-align: center;
          font-weight: 500;
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 1rem;
          transition: background-color 0.2s ease;
          z-index: 10;
        }

        .add-to-cart-overlay:hover {
          background-color: #1e2a7a;
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
          font-size: 1.125rem !important;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin: 0;
          line-height: 1.2;
        }
      `}</style>
    </Link>
  );
};

export default ProductCard;