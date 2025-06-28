import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import ProductCard from '../components/Shop/ProductCard';
import { useCart } from '../context/CartContext';
import { getProductBySlug, getRelatedProducts } from '../data/products';

const ProductDetail = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { addItem } = useCart();
  
  const product = getProductBySlug(slug);
  
  if (!product) {
    return (
      <main>
        <section className="section-large">
          <div className="container">
            <div className="error-content">
              <h1>Toodet ei leitud</h1>
              <Link to="/epood" className="back-link">
                Tagasi poodi
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const relatedProducts = getRelatedProducts(product);

  const handleAddToCart = () => {
    addItem(product);
  };

  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="breadcrumb">
                <Link to="/epood">{t('shop.title')}</Link>
                <span> / </span>
                <span>{product.title}</span>
              </div>
            </FadeInSection>

            <FadeInSection>
              <div className="product-detail">
                <div className="product-image">
                  <img src={product.image} alt={product.title} />
                </div>
                
                <div className="product-info">
                  <h1 className="product-title">{product.title}</h1>
                  <p className="product-price">{product.price}</p>
                  
                  <div className="product-meta">
                    <div className="meta-item">
                      <strong>{t('shop.product.dimensions_label')}:</strong>
                      <span>
                        {product.dimensions.height}cm × {product.dimensions.width}cm × {product.dimensions.depth}cm
                      </span>
                    </div>
                    <div className="meta-item">
                      <strong>{t('shop.product.year_label')}:</strong>
                      <span>{product.year}</span>
                    </div>
                  </div>
                  
                  <p className="product-description">{product.description}</p>
                  
                  <div className="product-actions">
                    <p className="availability">{t('shop.product.available')}</p>
                    {product.available && (
                      <button 
                        className="add-to-cart"
                        onClick={handleAddToCart}
                      >
                        {t('shop.product.add_to_cart')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </FadeInSection>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <FadeInSection className="related-section">
                <h2 className="related-title">{t('shop.product.related')}</h2>
                <div className="related-products">
                  {relatedProducts.map((relatedProduct) => (
                    <ProductCard key={relatedProduct.id} product={relatedProduct} />
                  ))}
                </div>
              </FadeInSection>
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        .breadcrumb {
          margin-bottom: 48px;
          font-size: 0.9rem;
          color: #666;
        }

        .breadcrumb a {
          color: var(--color-ultramarine);
          text-decoration: none;
        }

        .breadcrumb a:hover {
          text-decoration: underline;
        }

        .product-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: start;
        }

        .product-image img {
          width: 100%;
          aspect-ratio: 4/3;
          object-fit: cover;
          border-radius: 4px;
        }

        .product-title {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 400;
          margin-bottom: 16px;
          color: var(--color-text);
        }

        .product-price {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-bottom: 32px;
        }

        .product-meta {
          margin-bottom: 32px;
        }

        .meta-item {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .meta-item strong {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
        }

        .meta-item span {
          color: #666;
        }

        .product-description {
          line-height: 1.6;
          margin-bottom: 32px;
          color: var(--color-text);
        }

        .product-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .availability {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
        }

        .add-to-cart {
          align-self: flex-start;
          padding: 0;
          background: none;
          border: none;
          color: var(--color-ultramarine);
          font-family: var(--font-body);
          font-size: 1rem;
          font-weight: 500;
          text-decoration: underline;
          cursor: pointer;
        }

        .add-to-cart:hover {
          opacity: 0.7;
        }

        .related-section {
          margin-top: 128px;
          padding-top: 64px;
          border-top: 1px solid #f0f0f0;
        }

        .related-title {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 400;
          margin-bottom: 48px;
          color: var(--color-ultramarine);
          text-align: center;
        }

        .related-products {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 48px;
        }

        .error-content {
          text-align: center;
          padding: 64px 0;
        }

        .back-link {
          color: var(--color-ultramarine);
          text-decoration: none;
          font-weight: 500;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .product-detail {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .product-title {
            font-size: 1.5rem;
          }

          .product-price {
            font-size: 1.25rem;
          }

          .related-products {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 32px;
          }

          .related-section {
            margin-top: 96px;
          }
        }
      `}</style>
    </>
  );
};

export default ProductDetail;