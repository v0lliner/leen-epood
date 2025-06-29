import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import ImageGallery from '../components/UI/ImageGallery';
import ProductCard from '../components/Shop/ProductCard';
import { useCart } from '../context/CartContext';
import { useProducts } from '../hooks/useProducts';
import { productImageService } from '../utils/supabase/productImages';

const ProductDetail = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { addItem, isInCart } = useCart();
  const { products, getProductBySlug, getRelatedProducts, loading } = useProducts();
  const [productImages, setProductImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  
  const product = getProductBySlug(slug);
  
  useEffect(() => {
    if (product?.id) {
      loadProductImages();
    }
  }, [product?.id]);

  const loadProductImages = async () => {
    if (!product?.id) return;
    
    setImagesLoading(true);
    try {
      const { data, error } = await productImageService.getProductImages(product.id);
      
      if (error) {
        console.warn('Failed to load product images:', error);
        // Fallback to main product image
        if (product.image) {
          setProductImages([{
            id: 'fallback',
            image_url: product.image,
            is_primary: true,
            display_order: 0
          }]);
        }
      } else {
        // If no images in database, use fallback
        if (data.length === 0 && product.image) {
          setProductImages([{
            id: 'fallback',
            image_url: product.image,
            is_primary: true,
            display_order: 0
          }]);
        } else {
          setProductImages(data);
        }
      }
    } catch (err) {
      console.warn('Error loading product images:', err);
      // Fallback to main product image
      if (product.image) {
        setProductImages([{
          id: 'fallback',
          image_url: product.image,
          is_primary: true,
          display_order: 0
        }]);
      }
    } finally {
      setImagesLoading(false);
    }
  };
  
  if (loading || imagesLoading) {
    return (
      <main>
        <section className="section-large">
          <div className="container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('admin.loading')}</p>
            </div>
          </div>
        </section>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 64px;
            gap: 16px;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid var(--color-ultramarine);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }
  
  if (!product) {
    return (
      <main>
        <section className="section-large">
          <div className="container">
            <div className="error-content">
              <h1>{t('product.not_found')}</h1>
              <Link to="/epood" className="btn btn-primary">
                {t('product.back_to_shop')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const relatedProducts = getRelatedProducts(product);
  const isProductInCart = isInCart(product.id);
  const canAddToCart = product.available && !isProductInCart;

  const handleAddToCart = () => {
    if (canAddToCart) {
      addItem(product);
    }
  };

  // Helper function to get valid dimensions
  const getValidDimensions = (dimensions) => {
    if (!dimensions) return [];
    
    const validDimensions = [];
    
    if (dimensions.height && dimensions.height > 0) {
      validDimensions.push({ label: 'Kõrgus', value: `${dimensions.height}cm` });
    }
    if (dimensions.width && dimensions.width > 0) {
      validDimensions.push({ label: 'Laius', value: `${dimensions.width}cm` });
    }
    if (dimensions.depth && dimensions.depth > 0) {
      validDimensions.push({ label: 'Sügavus', value: `${dimensions.depth}cm` });
    }
    
    return validDimensions;
  };

  const validDimensions = getValidDimensions(product.dimensions);

  // Get availability text
  const getAvailabilityText = () => {
    if (!product.available) {
      return t('shop.product.sold_out');
    }
    if (isProductInCart) {
      return t('shop.product.in_cart');
    }
    return t('shop.product.available');
  };

  // Get button text
  const getButtonText = () => {
    if (!product.available) {
      return t('shop.product.sold_out');
    }
    if (isProductInCart) {
      return t('shop.product.in_cart');
    }
    return t('shop.product.add_to_cart');
  };

  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="breadcrumb">
                <Link to="/epood" className="breadcrumb-link">{t('shop.title')}</Link>
                <span className="breadcrumb-separator"> / </span>
                <span className="breadcrumb-current">{product.title}</span>
              </div>
            </FadeInSection>

            <FadeInSection>
              <div className="product-detail">
                <div className="product-images">
                  <ImageGallery 
                    images={productImages} 
                    productTitle={product.title}
                  />
                </div>
                
                <div className="product-info">
                  <h1 className="product-title">{product.title}</h1>
                  <p className="product-price">{product.price}</p>
                  
                  {validDimensions.length > 0 && (
                    <div className="product-dimensions">
                      <h3 className="dimensions-title">{t('shop.product.dimensions_label')}:</h3>
                      <div className="dimensions-list">
                        {validDimensions.map((dimension, index) => (
                          <div key={index} className="dimension-item">
                            <span className="dimension-label">{dimension.label}</span>
                            <span className="dimension-value">{dimension.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="product-description">{product.description}</p>
                  
                  <div className="product-actions">
                    <p className={`availability ${!product.available ? 'sold-out' : isProductInCart ? 'in-cart' : 'available'}`}>
                      {getAvailabilityText()}
                    </p>
                    {canAddToCart && (
                      <button 
                        className="link-with-arrow add-to-cart-btn"
                        onClick={handleAddToCart}
                      >
                        {getButtonText()} <span className="arrow-wrapper">→</span>
                      </button>
                    )}
                    {!canAddToCart && (
                      <div className="unavailable-btn">
                        {getButtonText()}
                      </div>
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
          font-size: 1.125rem;
          font-family: var(--font-body);
          font-weight: 500;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
        }

        .breadcrumb-link {
          color: var(--color-ultramarine);
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .breadcrumb-link:hover {
          opacity: 0.7;
          text-decoration: underline;
        }

        .breadcrumb-separator {
          color: #666;
          margin: 0 4px;
        }

        .breadcrumb-current {
          color: var(--color-text);
          font-weight: 400;
        }

        .product-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: start;
        }

        .product-images {
          width: 100%;
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
          margin-bottom: 24px;
        }

        .product-dimensions {
          margin-bottom: 24px;
        }

        .dimensions-title {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          font-size: 1rem;
          margin-bottom: 12px;
        }

        .dimensions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dimension-item {
          display: flex;
          align-items: center;
          font-size: 1rem;
          line-height: 1.5;
          gap: 12px;
        }

        .dimension-label {
          font-family: var(--font-body);
          font-weight: 400;
          color: var(--color-text);
          min-width: 60px;
        }

        .dimension-value {
          font-family: var(--font-body);
          font-weight: 500;
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
          gap: 24px;
        }

        .availability {
          font-size: 0.9rem;
          margin: 0;
          font-weight: 500;
        }

        .availability.available {
          color: #28a745;
        }

        .availability.sold-out {
          color: #dc3545;
        }

        .availability.in-cart {
          color: var(--color-ultramarine);
        }

        .add-to-cart-btn {
          align-self: flex-start;
          background: none;
          border: none;
          font-family: var(--font-body);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-ultramarine);
          cursor: pointer;
          transition: opacity 0.2s ease;
          padding: 0;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .add-to-cart-btn:hover {
          opacity: 0.8;
        }

        .unavailable-btn {
          align-self: flex-start;
          font-family: var(--font-body);
          font-size: 1.25rem;
          font-weight: 600;
          color: #999;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
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

        @media (max-width: 768px) {
          .breadcrumb {
            font-size: 1rem;
            margin-bottom: 32px;
          }

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

          .add-to-cart-btn,
          .unavailable-btn {
            font-size: 1.125rem;
            align-self: stretch;
            text-align: left;
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