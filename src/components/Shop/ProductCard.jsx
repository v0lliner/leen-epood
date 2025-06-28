import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTranslation } from 'react-i18next';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCart();
  const { t } = useTranslation();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  return (
    <Link 
      to={`/epood/toode/${product.slug}`} 
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-image">
        <img src={product.image} alt={product.title} />
        {!product.available && (
          <div className="sold-overlay">Müüdud</div>
        )}
        {isHovered && product.available && (
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

        .sold-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: 500;
          font-family: var(--font-heading);
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
          transition: opacity 0.2s ease;
          opacity: 0.9;
          transform: translateY(0);
          font-family: var(--font-body);
        }

        .add-to-cart-overlay:hover {
          opacity: 1;
        }

        .product-info {
          text-align: left;
        }

        .product-title {
          font-family: var(--font-heading);
          font-size: 1.125rem;
          font-weight: 400;
          margin-bottom: 8px;
          color: var(--color-text);
          margin-top: 0;
        }

        .product-price {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin: 0;
        }
      `}</style>
    </Link>
  );
};

export default ProductCard;