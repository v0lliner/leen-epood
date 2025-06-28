import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryService } from '../../utils/supabase/categories';

const ProductFilters = ({ 
  activeCategory, 
  filters, 
  onFiltersChange, 
  isOpen, 
  onToggle 
}) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const { data, error } = await categoryService.getCategories();
      
      if (error) {
        console.warn('Failed to load categories:', error);
        setCategories([]);
      } else {
        setCategories(data);
      }
    } catch (err) {
      console.warn('Error loading categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };
  
  const handlePriceChange = (field, value) => {
    onFiltersChange({
      ...filters,
      price: {
        ...filters.price,
        [field]: value
      }
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
      subcategories: []
    });
  };

  // Leia aktiivsele kategooriale vastavad alamkategooriad
  const getSubcategories = () => {
    const parentCategory = categories.find(cat => cat.slug === activeCategory);
    return parentCategory?.children || [];
  };

  const subcategoryOptions = getSubcategories();

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
          {!categoriesLoading && subcategoryOptions.length > 0 && (
            <div className="filter-group primary-filter">
              <label className="filter-label">
                {t('shop.filters.subcategory')}
              </label>
              <div className="subcategory-list">
                {subcategoryOptions.map(subcategory => (
                  <button
                    key={subcategory.id}
                    onClick={() => handleSubcategoryChange(subcategory.slug)}
                    className={`subcategory-link ${filters.subcategories.includes(subcategory.slug) ? 'active' : ''}`}
                  >
                    {subcategory.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {categoriesLoading && (
            <div className="filter-group primary-filter">
              <label className="filter-label">
                {t('shop.filters.subcategory')}
              </label>
              <div className="loading-text">
                {t('admin.loading')}...
              </div>
            </div>
          )}

          {/* Secondary Filters */}
          <div className="secondary-filters">
            {/* Price Filter */}
            <div className="filter-group">
              <label className="filter-label">{t('shop.filters.price')}</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder={t('shop.filters.price_min')}
                  value={filters.price.min}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className="filter-input"
                />
                <span className="price-separator">-</span>
                <input
                  type="number"
                  placeholder={t('shop.filters.price_max')}
                  value={filters.price.max}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
          </div>

          <button onClick={clearFilters} className="clear-filters-btn">
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
            z-index: 98;
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
            z-index: 99;
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
            font-weight: 400;
            font-size: 1rem;
            color: var(--color-text);
            cursor: pointer;
            text-align: left;
            transition: all 0.2s ease;
            position: relative;
            text-decoration: none;
            border-bottom: 1px solid transparent;
          }

          .subcategory-link:hover,
          .subcategory-link.active {
            color: var(--color-ultramarine);
            border-bottom-color: var(--color-ultramarine);
          }

          .subcategory-link.active {
            font-weight: 500;
          }

          .loading-text {
            padding: 12px 0;
            color: #666;
            font-style: italic;
            font-size: 0.9rem;
          }

          .secondary-filters {
            opacity: 0.85;
          }

          .filter-input {
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

          .filter-input:focus {
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

          .clear-filters-btn {
            width: 100%;
            text-align: center;
            padding: 16px 24px;
            margin-top: 24px;
            border-top: 1px solid #f0f0f0;
            padding-top: 32px;
            background: none;
            border: none;
            font-family: var(--font-body);
            font-weight: 500;
            font-size: 1rem;
            color: var(--color-ultramarine);
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: underline;
            text-decoration-color: transparent;
          }

          .clear-filters-btn:hover {
            text-decoration-color: currentColor;
            opacity: 0.8;
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
              z-index: auto;
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