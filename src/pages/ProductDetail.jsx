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
import { transformImage, getImageSizeForContext } from '../utils/supabase/imageTransform';

const ProductDetail = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { addItem, isInCart } = useCart();
  const { products, getProductBySlug, getRelatedProducts, getCategoryBySlug, loading } = useProducts();
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
    console.log('Loading images for product:', product.id);
    
    try {
      // Try multiple times to ensure we get the images
      let retryCount = 0;
      const maxRetries = 3;
      let imagesData = null;
      let lastError = null;

      while (retryCount < maxRetries && !imagesData) {
        const { data, error } = await productImageService.getProductImages(product.id);
        
        if (error) {
          console.warn(`Failed to load product images (attempt ${retryCount + 1}):`, error);
          lastError = error;
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        } else {
          imagesData = data;
          break;
        }
      }

      if (lastError && !imagesData) {
        console.warn('Failed to load product images after retries, using fallback:', lastError);
        // Fallback to main product image
        if (product.image) {
          console.log('Using fallback image:', product.image);
          setProductImages([{
            id: 'fallback',
            image_url: product.image,
            is_primary: true,
            display_order: 0
          }]);
        } else {
          setProductImages([]);
        }
      } else {
        console.log('Loaded product images from database:', imagesData);
        
        // If we have images from database, use them
        if (imagesData && imagesData.length > 0) {
          setProductImages(imagesData);
        } else if (product.image) {
          // If no images in database but product has main image, use it as fallback
          console.log('No images in database, using product main image as fallback');
          setProductImages([{
            id: 'fallback',
            image_url: product.image,
            is_primary: true,
            display_order: 0
          }]);
        } else {
          console.log('No images available for this product');
          setProductImages([]);
        }
      }
    } catch (err) {
      console.warn('Error loading product images, using fallback data:', err);
      // Fallback to main product image
      if (product.image) {
        setProductImages([{
          id: 'fallback',
          image_url: product.image,
          is_primary: true,
          display_order: 0
        }]);
      } else {
        setProductImages([]);
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

  // Filter out sold products from related products
  const relatedProducts = getRelatedProducts(product).filter(p => p.available);
  const isProductInCart = isInCart(product.id);
  const canAddToCart = product.available && !isProductInCart;

  const handleAddToCart = () => {
    if (canAddToCart) {
      addItem(product);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to get valid dimensions with improved formatting
  const getValidDimensions = (dimensions) => {
    if (!dimensions) return [];
    
    const validDimensions = [];
    
    if (dimensions.height && dimensions.height > 0) {
      validDimensions.push({ 
        label: 'Kõrgus', 
        value: `${parseFloat(dimensions.height).toString().replace('.', ',')} cm` 
      });
    }
    if (dimensions.width && dimensions.width > 0) {
      validDimensions.push({ 
        label: 'Laius', 
        value: `${parseFloat(dimensions.width).toString().replace('.', ',')} cm` 
      });
    }
    // Show second width as "Pikkus" if it exists and is different from first width
    if (dimensions.width2 && dimensions.width2 > 0 && dimensions.width2 !== dimensions.width) {
      validDimensions.push({ 
        label: 'Pikkus', 
        value: `${parseFloat(dimensions.width2).toString().replace('.', ',')} cm` 
      });
    }
    if (dimensions.depth && dimensions.depth > 0) {
      validDimensions.push({ 
        label: 'Sügavus', 
        value: `${parseFloat(dimensions.depth).toString().replace('.', ',')} cm` 
      });
    }
    
    return validDimensions;
  };

  const validDimensions = getValidDimensions(product.dimensions);

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

  // Get category name
  const getCategoryName = () => {
    // Try to get from translations first
    const translationKey = `shop.tabs.${product.category}`;
    const translatedName = t(translationKey);
    
    // If translation exists and is not the same as the key, use it
    if (translatedName !== translationKey) {
      return translatedName;
    }
    
    // Otherwise try to get from categories data
    const category = getCategoryBySlug(product.category);
    if (category) {
      return category.name;
    }
    
    // Fallback to capitalized category slug
    return product.category.charAt(0).toUpperCase() + product.category.slice(1);
  };

  // Get subcategory name from slug
  const getSubcategoryName = () => {
    if (!product.subcategory) return null;
    
    // Try to get from translations first
    const translationKey = `shop.subcategories.${product.category}.${product.subcategory}`;
    const translatedName = t(translationKey);
    
    // If translation exists and is not the same as the key, use it
    if (translatedName !== translationKey) {
      return translatedName;
    }
    
    // Otherwise try to get from categories data
    const category = getCategoryBySlug(product.category);
    if (category && category.children) {
      const subcategory = category.children.find(sub => sub.slug === product.subcategory);
      if (subcategory) {
        return subcategory.name;
      }
    }
    
    // Fallback to capitalized subcategory slug
    return product.subcategory.charAt(0).toUpperCase() + product.subcategory.slice(1);
  };

  console.log('ProductDetail render - productImages:', productImages);

  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="breadcrumb">
                <Link to="/epood" className="breadcrumb-link" onClick={scrollToTop}>{t('shop.title')}</Link>
                <span className="breadcrumb-separator"> / </span>
                <Link 
                  to={`/epood?tab=${product.category}`} 
                  className="breadcrumb-link" 
                  onClick={scrollToTop}
                >
                  {getCategoryName()}
                </Link>
                {product.subcategory && (
                  <>
                    <span className="breadcrumb-separator"> / </span>
                    <Link 
                      to={`/epood?tab=${product.category}&subcategory=${product.subcategory}`} 
                      className="breadcrumb-link" 
                      onClick={scrollToTop}
                    >
                      {getSubcategoryName()}
                    </Link>
                  </>
                )}
                <span className="breadcrumb-separator"> / </span>
                <span className="breadcrumb-current">{product.title}</span>
              </div>
            </FadeInSection>

            <FadeInSection>
              <div className="product-detail">
                <div className="product-images">
                  {productImages.length > 0 ? (
                    <ImageGallery 
                      images={productImages} 
                      productTitle={product.title}
                    />
                  ) : (
                    <div className="no-images">
                      <div className="no-images-placeholder">
                        <span>📷</span>
                        <p>Pilte pole saadaval</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="product-info">
                  <h1 className="product-detail-title">{product.title}</h1>
                  
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
                  
                  {product.description && (
                    <div className="product-description">
                      {product.description.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  )}

                  <p className="product-detail-price">{product.price}</p>
                  
                  <div className="product-actions">
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
                <div className="view-all-container">
                  <Link to="/epood" className="link-with-arrow view-all-link" onClick={scrollToTop}>
                    {t('home.view_all')} <span className="arrow-wrapper">→</span>
                  </Link>
                </div>
              </FadeInSection>
            )}

            {/* FAQ Reference */}
            <FadeInSection className="product-faq-section">
              <div className="product-faq-content">
                <h3>Küsimusi toote kohta?</h3>
                <p>Leiate vastused kõige sagedamini küsitavatele küsimustele meie KKK lehelt.</p>
                <Link to="/kkk" className="link-with-arrow product-faq-link" onClick={scrollToTop}>
                  Vaata KKK <span className="arrow-wrapper">→</span>
                </Link>
              </div>
            </FadeInSection>
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

        .no-images {
          width: 100%;
          aspect-ratio: 4/3;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          border-radius: 4px;
          border: 2px dashed #ddd;
        }

        .no-images-placeholder {
          text-align: center;
          color: #999;
        }

        .no-images-placeholder span {
          font-size: 3rem;
          display: block;
          margin-bottom: 8px;
        }

        /* CRITICAL: Highly specific selectors to override global styles */
        .product-info .product-detail-title {
          font-family: var(--font-heading) !important;
          font-size: 2rem !important;
          font-weight: 400 !important;
          margin-bottom: 24px !important;
          color: var(--color-ultramarine) !important;
          line-height: 1.2 !important;
          margin-top: 0 !important;
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
          min-width: 70px;
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

        .product-description p {
          margin-bottom: 16px;
        }

        .product-description p:last-child {
          margin-bottom: 0;
        }

        /* CRITICAL: Highly specific selector for price to override global styles */
        .product-info .product-detail-price {
          font-family: var(--font-heading) !important;
          font-size: 2rem !important;
          font-weight: 500 !important;
          color: var(--color-ultramarine) !important;
          margin-bottom: 48px !important;
          margin-top: 0 !important;
          line-height: 1.2 !important;
        }

        .product-actions {
          display: flex;
          flex-direction: column;
          gap: 24px;
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

        .view-all-container {
          text-align: center;
          margin-top: 48px;
        }
        
        .view-all-link {
          font-size: 1.125rem;
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-ultramarine);
          transition: opacity 0.2s ease;
        }

        .view-all-link:hover {
          opacity: 0.8;
        }

        .product-faq-section {
          margin-top: 96px;
          padding-top: 48px;
          border-top: 1px solid #f0f0f0;
          text-align: center;
        }

        .product-faq-content {
          max-width: 500px;
          margin: 0 auto;
        }

        .product-faq-content h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 16px;
          font-size: 1.25rem;
        }

        .product-faq-content p {
          margin-bottom: 24px;
          color: #666;
          font-size: 1rem;
          line-height: 1.6;
        }

        .product-faq-link {
          font-size: 1.125rem;
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-ultramarine);
          transition: opacity 0.2s ease;
        }

        .product-faq-link:hover {
          opacity: 0.8;
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

          /* Mobile specific overrides */
          .product-info .product-detail-title {
            font-size: 1.5rem !important;
          }

          .product-info .product-detail-price {
            font-size: 1.5rem !important;
            margin-bottom: 32px !important;
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

          .product-faq-section {
            margin-top: 64px;
            padding-top: 32px;
          }

          .product-faq-content h3 {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </>
  );
};

export default ProductDetail;