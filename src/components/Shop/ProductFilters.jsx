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
          <button className="filters-close" onClick={onToggle}>×</button>
        </div>

        <div className="filters-content">
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
              <span>-</span>
              <input
                type="number"
                placeholder="Max €"
                value={filters.price.max}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="filter-input"
              />
            </div>
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

          {/* Subcategory Filter */}
          <div className="filter-group">
            <label className="filter-label">{t('shop.filters.subcategory')}</label>
            <div className="subcategory-options">
              {subcategoryOptions.map(subcategory => (
                <label key={subcategory} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.subcategories.includes(subcategory)}
                    onChange={() => handleSubcategoryChange(subcategory)}
                    className="filter-checkbox"
                  />
                  {t(`shop.subcategories.${activeCategory}.${subcategory}`)}
                </label>
              ))}
            </div>
          </div>

          <button onClick={clearFilters} className="clear-filters">
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
            z-index: 998;
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
            z-index: 999;
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
          }

          .filters-close {
            font-size: 1.5rem;
            color: var(--color-text);
            background: none;
            border: none;
            cursor: pointer;
          }

          .filters-content {
            padding: 24px;
          }

          .filter-group {
            margin-bottom: 32px;
            position: relative;
          }

          .filter-label {
            display: block;
            font-family: var(--font-heading);
            font-weight: 500;
            margin-bottom: 12px;
            color: var(--color-text);
            position: relative;
            z-index: 1;
          }

          .filter-input,
          .filter-select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: var(--font-body);
            font-size: 0.9rem;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }

          .filter-input:focus,
          .filter-select:focus {
            outline: none;
            border-color: var(--color-ultramarine);
            z-index: 2;
          }

          .price-inputs {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .price-inputs span {
            color: var(--color-text);
          }

          .dimension-inputs {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .subcategory-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            cursor: pointer;
          }

          .filter-checkbox {
            margin: 0;
          }

          .clear-filters {
            width: 100%;
            padding: 12px;
            background: none;
            border: 1px solid var(--color-ultramarine);
            color: var(--color-ultramarine);
            border-radius: 4px;
            font-family: var(--font-body);
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .clear-filters:hover {
            background-color: var(--color-ultramarine);
            color: white;
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