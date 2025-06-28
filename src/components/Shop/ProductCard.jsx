import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ProductCard = ({ product }) => {
  const { t } = useTranslation();
  
  return (
    <Link to={`/epood/toode/${product.slug}`} className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.title} />
        {!product.available && (
          <div className="sold-overlay">Müüdud</div>
        )}
        <div className="add-to-cart-overlay">
          <span>{t('shop.product.add_to_cart')}</span>
        </div>
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
          transform: scale(1.03);
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
          background-color: rgba(255, 255, 255, 0.9);
          color: var(--color-ultramarine);
          padding: 12px;
          text-align: center;
          transform: translateY(100%);
          transition: transform 0.3s ease;
          font-family: var(--font-heading);
          font-weight: 400;
        }

        .product-card:hover .add-to-cart-overlay {
          transform: translateY(0);
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