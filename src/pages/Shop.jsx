import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import ProductFilters from '../components/Shop/ProductFilters';
import ProductCard from '../components/Shop/ProductCard';
import { products } from '../data/products';

const Shop = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const activeTab = searchParams.get('tab') || 'keraamika';
  
  const [filters, setFilters] = useState({
    price: { min: '', max: '' },
    dimensions: { height: '', width: '', depth: '' },
    year: '',
    subcategories: []
  });

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
    setFilters({
      price: { min: '', max: '' },
      dimensions: { height: '', width: '', depth: '' },
      year: '',
      subcategories: []
    });
  };

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => product.category === activeTab);

    // Price filter
    if (filters.price.min || filters.price.max) {
      filtered = filtered.filter(product => {
        const price = parseFloat(product.price.replace('€', ''));
        const min = filters.price.min ? parseFloat(filters.price.min) : 0;
        const max = filters.price.max ? parseFloat(filters.price.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Dimensions filter
    if (filters.dimensions.height || filters.dimensions.width || filters.dimensions.depth) {
      filtered = filtered.filter(product => {
        const { height, width, depth } = product.dimensions;
        const filterHeight = filters.dimensions.height ? parseFloat(filters.dimensions.height) : null;
        const filterWidth = filters.dimensions.width ? parseFloat(filters.dimensions.width) : null;
        const filterDepth = filters.dimensions.depth ? parseFloat(filters.dimensions.depth) : null;
        
        return (!filterHeight || height >= filterHeight) &&
               (!filterWidth || width >= filterWidth) &&
               (!filterDepth || depth >= filterDepth);
      });
    }

    // Year filter
    if (filters.year) {
      filtered = filtered.filter(product => product.year === parseInt(filters.year));
    }

    // Subcategory filter
    if (filters.subcategories.length > 0) {
      filtered = filtered.filter(product => 
        filters.subcategories.includes(product.subcategory)
      );
    }

    return filtered;
  }, [activeTab, filters]);

  return (
    <>
      <SEOHead page="shop" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="shop-header">
                <h1>{t('shop.title')}</h1>
              </div>
            </FadeInSection>

            <div className="shop-layout">
              {/* Mobile Filter Toggle */}
              <button 
                className="mobile-filter-toggle btn btn-underline"
                onClick={() => setFiltersOpen(true)}
              >
                {t('shop.filters.title')}
              </button>

              {/* Filters Sidebar */}
              <ProductFilters
                activeCategory={activeTab}
                filters={filters}
                onFiltersChange={setFilters}
                isOpen={filtersOpen}
                onToggle={() => setFiltersOpen(!filtersOpen)}
              />

              {/* Products Section */}
              <div className="products-section">
                {/* Category Tabs - aligned with products */}
                <div className="shop-tabs">
                  <button
                    onClick={() => handleTabChange('keraamika')}
                    className={`tab-button ${activeTab === 'keraamika' ? 'active' : ''}`}
                  >
                    {t('shop.tabs.keraamika')}
                  </button>
                  <button
                    onClick={() => handleTabChange('omblus')}
                    className={`tab-button ${activeTab === 'omblus' ? 'active' : ''}`}
                  >
                    {t('shop.tabs.omblus')}
                  </button>
                </div>

                <div className="products-grid">
                  {filteredProducts.map((product) => (
                    <FadeInSection key={product.id}>
                      <ProductCard product={product} />
                    </FadeInSection>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <FadeInSection>
                    <div className="no-products">
                      <p>{t('shop.no_products')}</p>
                    </div>
                  </FadeInSection>
                )}
              </div>
            </div>

            {/* Philosophy Section */}
            <FadeInSection className="shop-philosophy">
              <div className="philosophy-content">
                <h2>{t('shop.philosophy.heading')}</h2>
                <p>{t('shop.philosophy.text')}</p>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .shop-header {
          margin-bottom: 48px;
        }

        .shop-header h1 {
          margin: 0;
        }

        .shop-layout {
          display: flex;
          gap: 48px;
          position: relative;
        }

        .mobile-filter-toggle {
          display: none;
          width: 100%;
          margin-bottom: 32px;
          text-align: left;
        }

        .products-section {
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .shop-tabs {
          display: flex;
          align-items: baseline;
          margin-bottom: 48px;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 48px;
        }

        .no-products {
          text-align: center;
          padding: 64px 0;
          color: #666;
        }

        .shop-philosophy {
          margin-top: 128px;
          padding-top: 64px;
          border-top: 1px solid #f0f0f0;
        }

        .philosophy-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .philosophy-content h2 {
          color: var(--color-ultramarine);
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .shop-layout {
            flex-direction: column;
            gap: 0;
          }

          .mobile-filter-toggle {
            display: block;
          }

          .shop-tabs {
            margin-bottom: 32px;
          }

          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 32px;
          }

          .shop-philosophy {
            margin-top: 96px;
          }
        }

        @media (max-width: 480px) {
          .products-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </>
  );
};

export default Shop;