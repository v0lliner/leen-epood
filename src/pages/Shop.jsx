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
              <h1 className="text-center">{t('shop.title')}</h1>
            </FadeInSection>

            {/* Category Tabs */}
            <FadeInSection>
              <div className="shop-tabs">
                <button
                  onClick={() => handleTabChange('omblus')}
                  className={`tab-button ${activeTab === 'omblus' ? 'active' : ''}`}
                >
                  {t('shop.tabs.omblus')}
                </button>
                <button
                  onClick={() => handleTabChange('keraamika')}
                  className={`tab-button ${activeTab === 'keraamika' ? 'active' : ''}`}
                >
                  {t('shop.tabs.keraamika')}
                </button>
              </div>
            </FadeInSection>

            <div className="shop-layout">
              {/* Mobile Filter Toggle */}
              <button 
                className="mobile-filter-toggle"
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

              {/* Products Grid */}
              <div className="products-section">
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
                      <p>Valitud filtritele vastavaid tooteid ei leitud.</p>
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
        .shop-tabs {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin: 64px 0 48px;
        }

        .tab-button {
          padding: 16px 32px;
          border: 1px solid var(--color-text);
          color: var(--color-text);
          border-radius: 4px;
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: none;
          cursor: pointer;
        }

        .tab-button:hover,
        .tab-button.active {
          background-color: var(--color-ultramarine);
          color: white;
          border-color: var(--color-ultramarine);
        }

        .shop-layout {
          display: flex;
          gap: 48px;
          margin-top: 48px;
          position: relative;
        }

        .mobile-filter-toggle {
          display: none;
          width: 100%;
          padding: 16px;
          margin-bottom: 32px;
          border: 1px solid var(--color-ultramarine);
          color: var(--color-ultramarine);
          background: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
        }

        .products-section {
          flex: 1;
          position: relative;
          z-index: 1;
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
          .shop-tabs {
            gap: 16px;
            margin: 48px 0 32px;
          }

          .tab-button {
            padding: 12px 24px;
            font-size: 0.9rem;
          }

          .shop-layout {
            flex-direction: column;
            gap: 0;
          }

          .mobile-filter-toggle {
            display: block;
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