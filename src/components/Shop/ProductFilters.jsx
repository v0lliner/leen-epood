import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ProductFilters = ({ 
  activeCategory, 
  filters, 
  onFiltersChange, 
  isOpen, 
  onToggle 
}) => {
  const { t } = useTranslation();
  
  const handlePriceChange = (field, value) => {
    onFiltersChange({
      ...filters,
      price: {
        ...filters.price,
        [field]: value
      }
    });
  };

  const handleDimensionChange = (field, value) => {
    onFiltersChange({
      ...filters,
      dimensions: {
        ...filters.dimensions,
        [field]: value
      }
    });
  };

  const handleYearChange = (value) => {
    onFiltersChange({
      ...filters,
      year: value
    });
  };

  const handleSubcategoryChange = (subcategory) => {
    const newSubcategories = filters.subcategories.includes(subcategory)
      ? filters.subcategories.filter(s => s !== subcategory)
      : [...filters.subcategories, subcategory];
    
    onFiltersChange({
      ...filters,
      subcategories: newSubcategories
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      price: { min: '', max: '' },
      dimensions: { height: '', width: '', depth: '' },
      year: '',
      subcategories: []
    });
  };

  const subcategoryOptions = activeCategory === 'omblus' 
    ? ['kimonod', 'kaunistused', 'roivad']
    : ['kausid', 'alused', 'kujud', 'tassid', 'vaasid'];

  const years = [2020, 2021, 2022, 2023, 2024];

  return (
    <>
      <div className={`filters-overlay ${isOpen ? 'open' : ''}`} onClick={onToggle}></div>
      <div className={`filters-container ${isOpen ? 'open' : ''}`}>
        <div className="filters-header">
          <h3>{t('shop.filters.title')}</h3>
          <button className="filters-close btn" onClick={onToggle}>×</button>
        </div>

        <div className="filters-content">
          {/* Primary Filter: Subcategory */}
          <div className="filter-group primary-filter">
            <label className="filter-label primary-label">
              {t('shop.filters.subcategory')}
            </label>
            <div className="subcategory-list">
              {subcategoryOptions.map(subcategory => (
                <button
                  key={subcategory}
                  onClick={() => handleSubcategoryChange(subcategory)}
                  className={`subcategory-link ${filters.subcategories.includes(subcategory) ? 'active' : ''}`}
                >
                  {t(`shop.subcategories.${activeCategory}.${subcategory}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="secondary-filters">
            {/* Price Filter */}
            <div className="filter-group">
              <label className="filter-label">{t('shop.filters.price')}</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min €"
                  value={filters.price.min}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className="filter-input"
                />
                <span className="price-separator">-</span>
                <input
                  type="number"
                  placeholder="Max €"
                  value={filters.price.max}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            {/* Year Filter */}
            <div className="filter-group">
              <label className="filter-label">{t('shop.filters.year')}</label>
              <select
                value={filters.year}
                onChange={(e) => handleYearChange(e.target.value)}
                className="filter-select"
              >
                <option value="">{t('shop.filters.year')}</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Dimensions Filter */}
            <div className="filter-group">
              <label className="filter-label">{t('shop.filters.dimensions')}</label>
              <div className="dimension-inputs">
                <input
                  type="number"
                  placeholder={t('shop.filters.height')}
                  value={filters.dimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  className="filter-input"
                />
                <input
                  type="number"
                  placeholder={t('shop.filters.width')}
                  value={filters.dimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  className="filter-input"
                />
                <input
                  type="number"
                  placeholder={t('shop.filters.depth')}
                  value={filters.dimensions.depth}
                  onChange={(e) => handleDimensionChange('depth', e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
          </div>

          <button onClick={clearFilters} className="btn btn-underline clear-filters">
            {t('shop.filters.clear')}
          </button>
        </div>

        <style jsx>{`
          .filters-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 997;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }

          .filters-overlay.open {
            opacity: 1;
            visibility: visible;
          }

          .filters-container {
            position: fixed;
            top: 0;
            left: -320px;
            width: 320px;
            height: 100vh;
            background-color: var(--color-background);
            z-index: 997;
            transition: left 0.3s ease;
            overflow-y: auto;
          }

          .filters-container.open {
            left: 0;
          }

          .filters-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid #f0f0f0;
          }

          .filters-header h3 {
            font-family: var(--font-heading);
            font-size: 1.25rem;
            color: var(--color-ultramarine);
            margin: 0;
          }

          .filters-close {
            font-size: 1.5rem;
            color: var(--color-text);
          }

          .filters-content {
            padding: 24px;
          }

          .filter-group {
            margin-bottom: 32px;
          }

          .primary-filter {
            margin-bottom: 48px;
            padding-bottom: 32px;
            border-bottom: 1px solid #f0f0f0;
          }

          .filter-label {
            display: block;
            font-family: var(--font-heading);
            font-weight: 500;
            margin-bottom: 16px;
            color: var(--color-text);
            font-size: 1rem;
          }

          .primary-label {
            font-size: 1.125rem;
            color: var(--color-ultramarine);
            margin-bottom: 20px;
          }

          .subcategory-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .subcategory-link {
            background: none;
            border: none;
            padding: 12px 0;
            font-family: var(--font-body);
            font-weight: 500;
            font-size: 1rem;
            color: var(--color-text);
            cursor: pointer;
            text-align: left;
            transition: all 0.2s ease;
            position: relative;
            text-decoration: none;
            border-bottom: 1px solid transparent;
          }

          .subcategory-link:hover {
            color: var(--color-ultramarine);
            text-decoration: underline;
          }

          .subcategory-link.active {
            color: var(--color-ultramarine);
            font-weight: 600;
            border-bottom-color: var(--color-ultramarine);
          }

          .subcategory-link.active:after {
            content: '✓';
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            font-weight: bold;
            color: var(--color-ultramarine);
          }

          .secondary-filters {
            opacity: 0.85;
          }

          .filter-input,
          .filter-select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: var(--font-body);
            font-size: 0.9rem;
            margin-bottom: 8px;
            transition: border-color 0.2s ease;
            background-color: var(--color-background);
          }

          .filter-input:focus,
          .filter-select:focus {
            outline: none;
            border-color: var(--color-ultramarine);
          }

          .price-inputs {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .price-separator {
            color: var(--color-text);
            font-weight: 500;
          }

          .dimension-inputs {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .clear-filters {
            width: 100%;
            text-align: center;
            padding: 12px 0;
            margin-top: 24px;
            border-top: 1px solid #f0f0f0;
            padding-top: 24px;
          }

          @media (min-width: 769px) {
            .filters-overlay {
              display: none;
            }

            .filters-container {
              position: static;
              width: 280px;
              height: auto;
              left: 0;
              background: none;
              overflow-y: visible;
            }

            .filters-header {
              padding: 0 0 24px 0;
              border-bottom: 1px solid #f0f0f0;
            }

            .filters-close {
              display: none;
            }

            .filters-content {
              padding: 24px 0;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default ProductFilters;