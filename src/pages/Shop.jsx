import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import ProductFilters from '../components/Shop/ProductFilters';
import ProductCard from '../components/Shop/ProductCard';
import { useProducts } from '../hooks/useProducts';

const Shop = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { products, categories, loading } = useProducts();
  
  const activeTab = searchParams.get('tab') || 'keraamika';
  const sortBy = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const productsPerPage = 8;
  
  const [filters, setFilters] = useState({
    price: { min: '', max: '' },
    subcategories: []
  });

  const handleTabChange = (tab) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    newParams.set('page', '1'); // Reset to first page when changing tabs
    setSearchParams(newParams);
    setFilters({
      price: { min: '', max: '' },
      subcategories: []
    });
  };

  const handleSortChange = (sort) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sort);
    newParams.set('page', '1'); // Reset to first page when changing sort
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    
    // Scroll to top of products section
    const productsSection = document.querySelector('.products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Get products for current category (for filter calculations)
  const categoryProducts = useMemo(() => {
    return products.filter(product => product.category === activeTab);
  }, [products, activeTab]);

  const sortedAndFilteredProducts = useMemo(() => {
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

    // Subcategory filter
    if (filters.subcategories.length > 0) {
      filtered = filtered.filter(product => 
        filters.subcategories.includes(product.subcategory)
      );
    }

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.id - a.id; // Assuming higher ID means newer
        case 'oldest':
          return a.id - b.id;
        case 'price-low':
          return parseFloat(a.price.replace('€', '')) - parseFloat(b.price.replace('€', ''));
        case 'price-high':
          return parseFloat(b.price.replace('€', '')) - parseFloat(a.price.replace('€', ''));
        default:
          return 0;
      }
    });

    return sorted;
  }, [products, activeTab, filters, sortBy]);

  // Calculate pagination
  const totalProducts = sortedAndFilteredProducts.length;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = sortedAndFilteredProducts.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      if (currentPage <= 3) {
        // Show first pages
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show last pages
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show middle pages
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const sortOptions = [
    { value: 'newest', label: t('shop.sort.newest') },
    { value: 'oldest', label: t('shop.sort.oldest') },
    { value: 'price-low', label: t('shop.sort.price_low') },
    { value: 'price-high', label: t('shop.sort.price_high') }
  ];

  const getCurrentSortLabel = () => {
    const currentOption = sortOptions.find(option => option.value === sortBy);
    return currentOption ? `${currentOption.label} ↓` : `${sortOptions[0].label} ↓`;
  };

  // Get available categories for tabs
  const availableCategories = categories.filter(cat => !cat.parent_id);

  // Pagination component
  const Pagination = ({ className = '' }) => {
    if (totalPages <= 1) return null;

    return (
      <div className={`pagination ${className}`}>
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                ...
              </span>
            );
          }
          
          return (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`pagination-number ${currentPage === page ? 'active' : ''}`}
            >
              {page}
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <SEOHead page="shop" />
        <main>
          <section className="section-large">
            <div className="container">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>{t('admin.loading')}</p>
              </div>
            </div>
          </section>
        </main>
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
      </>
    );
  }

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
                products={categoryProducts}
              />

              {/* Products Section */}
              <div className="products-section">
                {/* Category Tabs, Pagination and Sort Filter */}
                <div className="shop-controls">
                  <div className="shop-tabs">
                    {availableCategories.length > 0 ? (
                      availableCategories.map(category => (
                        <button
                          key={category.slug}
                          onClick={() => handleTabChange(category.slug)}
                          className={`tab-button ${activeTab === category.slug ? 'active' : ''}`}
                        >
                          {category.name}
                        </button>
                      ))
                    ) : (
                      // Fallback to hardcoded categories if database is empty
                      <>
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
                      </>
                    )}
                  </div>

                  <Pagination className="pagination-top" />

                  <div className="sort-filter">
                    <div className="sort-dropdown">
                      <button className="sort-button">
                        {getCurrentSortLabel()}
                      </button>
                      <div className="sort-options">
                        {sortOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="products-grid">
                  {currentProducts.map((product) => (
                    <FadeInSection key={product.id}>
                      <ProductCard product={product} />
                    </FadeInSection>
                  ))}
                </div>

                {currentProducts.length === 0 && (
                  <FadeInSection>
                    <div className="no-products">
                      <p>{t('shop.no_products')}</p>
                    </div>
                  </FadeInSection>
                )}

                {/* Bottom Pagination */}
                <Pagination className="pagination-bottom" />
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
          text-align: center;
          background: none;
          border: none;
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 1.125rem;
          color: var(--color-ultramarine);
          cursor: pointer;
          padding: 16px 24px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          transition: all 0.2s ease;
          text-decoration: underline;
          text-decoration-color: transparent;
        }

        .mobile-filter-toggle:hover {
          text-decoration-color: currentColor;
          background-color: rgba(47, 62, 156, 0.05);
        }

        .products-section {
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .shop-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 48px;
          gap: 24px;
        }

        .shop-tabs {
          display: flex;
          align-items: baseline;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .pagination-top {
          order: 2;
        }

        .pagination-bottom {
          justify-content: center;
          margin-top: 64px;
          padding-top: 32px;
          border-top: 1px solid #f0f0f0;
        }

        .pagination-number {
          background: none;
          border: none;
          padding: 8px 12px;
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 1rem;
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 4px;
          min-width: 40px;
          text-align: center;
          position: relative;
        }

        .pagination-number:hover {
          color: var(--color-ultramarine);
        }

        .pagination-number.active {
          color: var(--color-ultramarine);
        }

        .pagination-number.active:after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background-color: var(--color-ultramarine);
        }

        .pagination-ellipsis {
          padding: 8px 4px;
          font-family: var(--font-heading);
          font-weight: 500;
          color: #666;
          font-size: 1rem;
        }

        .sort-filter {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          order: 3;
        }

        .sort-dropdown {
          position: relative;
        }

        .sort-button {
          background: none;
          border: none;
          padding: 8px 0;
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 1rem;
          color: var(--color-text);
          cursor: pointer;
          transition: color 0.2s ease;
          position: relative;
          margin-right: 32px;
        }

        .sort-button:hover,
        .sort-dropdown:hover .sort-button {
          color: var(--color-ultramarine);
        }

        .sort-button:hover:after,
        .sort-dropdown:hover .sort-button:after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: var(--color-ultramarine);
        }

        .sort-options {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px);
          transition: all 0.2s ease;
          z-index: 10;
          min-width: 180px;
        }

        .sort-dropdown:hover .sort-options {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .sort-option {
          display: block;
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          text-align: left;
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: var(--color-text);
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .sort-option:hover {
          background-color: #f5f5f5;
        }

        .sort-option.active {
          background-color: rgba(47, 62, 156, 0.1);
          color: var(--color-ultramarine);
          font-weight: 500;
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

          .shop-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            margin-bottom: 32px;
          }

          .shop-tabs {
            justify-content: center;
            margin-bottom: 0;
            order: 1;
          }

          .sort-filter {
            justify-content: center;
            padding: 16px 0;
            order: 2;
          }

          .pagination-top {
            justify-content: center;
            order: 3;
            padding: 16px 0;
            border-top: 1px solid #f0f0f0;
            border-bottom: 1px solid #f0f0f0;
          }

          .sort-dropdown {
            width: 100%;
            text-align: center;
          }

          .sort-button {
            margin-right: 0;
          }

          .sort-options {
            left: 50%;
            transform: translateX(-50%) translateY(-8px);
            right: auto;
          }

          .sort-dropdown:hover .sort-options {
            transform: translateX(-50%) translateY(0);
          }

          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 32px;
          }

          .pagination-bottom {
            margin-top: 48px;
            padding-top: 24px;
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

          .pagination-number {
            padding: 6px 10px;
            font-size: 0.9rem;
            min-width: 36px;
          }

          .pagination {
            gap: 4px;
          }
        }
      `}</style>
    </>
  );
};

export default Shop;