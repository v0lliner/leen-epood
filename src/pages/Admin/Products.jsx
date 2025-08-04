import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import { productService } from '../../utils/supabase/products'

const AdminProducts = () => {
  const { t } = useTranslation()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterAvailable, setFilterAvailable] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    const { data, error } = await productService.getProducts()
    
    if (error) {
      setError(error.message)
    } else {
      setProducts(data)
    }
    
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm(t('admin.products.delete_confirm'))) {
      return
    }

    const { error } = await productService.deleteProduct(id)
    
    if (error) {
      setError(error.message)
    } else {
      setProducts(products.filter(p => p.id !== id))
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || product.category === filterCategory
    const matchesAvailable = filterAvailable === '' || 
                            (filterAvailable === 'true' && product.available) ||
                            (filterAvailable === 'false' && !product.available)
    
    return matchesSearch && matchesCategory && matchesAvailable
  })

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('admin.loading')}</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="products-container">
        <div className="products-header">
          <h1>{t('admin.products.title')} ({products.length})</h1>
          <Link to="/admin/products/new" className="btn btn-primary">
            ➕ {t('admin.products.add_new')}
          </Link>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Otsi tooteid</label>
              <input
                type="text"
                placeholder="Otsi pealkirja või kirjelduse järgi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label>Kategooria</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-input"
              >
                <option value="">Kõik kategooriad</option>
                <option value="keraamika">Keraamika</option>
                <option value="omblus">Õmblustööd</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Saadavus</label>
              <select
                value={filterAvailable}
                onChange={(e) => setFilterAvailable(e.target.value)}
                className="filter-input"
              >
                <option value="">Kõik tooted</option>
                <option value="true">Saadaval</option>
                <option value="false">Müüdud</option>
              </select>
            </div>
          </div>
        </div>

        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              {products.length === 0 ? (
                <>
                  <div className="empty-icon">📦</div>
                  <h3>{t('admin.products.no_products')}</h3>
                  <p>Alustage oma e-poe loomist esimese toote lisamisega</p>
                  <Link to="/admin/products/new" className="btn btn-primary">
                    {t('admin.products.add_first')}
                  </Link>
                </>
              ) : (
                <>
                  <div className="empty-icon">🔍</div>
                  <h3>Otsingule vastavaid tooteid ei leitud</h3>
                  <p>Proovige muuta otsingukriteeriumeid</p>
                </>
              )}
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <img src={product.image} alt={product.title} />
                </div>
                <div className="product-info">
                  <div className="product-meta">
                    <span className="product-category">{product.category}</span>
                    {product.subcategory && (
                      <span className="product-subcategory">{product.subcategory}</span>
                    )}
                  </div>
                  <h3>{product.title}</h3>
                  <p className="product-price">{product.price}</p>
                  {product.description && (
                    <p className="product-description">
                      {product.description.length > 100 
                        ? `${product.description.substring(0, 100)}...`
                        : product.description
                      }
                    </p>
                  )}
                  <div className="product-details">
                    {product.year && <span>📅 {product.year}</span>}
                    {product.dimensions && (
                      <span>📏 {product.dimensions.height}×{product.dimensions.width}×{product.dimensions.depth}cm</span>
                    )}
                  </div>
                  <div className="product-actions">
                    <Link 
                      to={`/epood/toode/${product.slug}`}
                      target="_blank"
                      className="btn btn-view"
                      title="Vaata avalikus vaates"
                    >
                      👁️ Vaata
                    </Link>
                    <Link 
                      to={`/admin/products/${product.id}/edit`}
                      className="btn btn-secondary"
                    >
                      ✏️ {t('admin.edit')}
                    </Link>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="btn btn-danger"
                    >
                      🗑️ {t('admin.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .products-container {
          padding: 32px;
        }

        .products-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .products-header h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin: 0;
        }

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

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #fcc;
          margin-bottom: 24px;
        }

        .filters-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
          margin-bottom: 32px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 24px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-group label {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          font-size: 0.9rem;
        }

        .filter-input {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: var(--font-body);
          font-size: 0.9rem;
          transition: border-color 0.2s ease;
        }

        .filter-input:focus {
          outline: none;
          border-color: var(--color-ultramarine);
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 64px 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #666;
          margin-bottom: 24px;
          font-size: 1rem;
        }

        .product-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .product-image {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-info {
          padding: 20px;
        }

        .product-meta {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .product-category {
          background: var(--color-ultramarine);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .product-subcategory {
          background: #e9ecef;
          color: #495057;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .product-info h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 8px;
          font-size: 1.125rem;
          line-height: 1.3;
        }

        .product-price {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          font-weight: 500;
          margin-bottom: 8px;
          font-size: 1.125rem;
        }

        .product-description {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
          margin-bottom: 12px;
        }

        .product-details {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 0.8rem;
          color: #666;
        }

        .product-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.2s ease;
          font-size: 0.85rem;
          display: inline-block;
          text-align: center;
          white-space: nowrap;
        }

        .btn:hover {
          opacity: 0.9;
        }

        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        .btn-view {
          background-color: #17a2b8;
          color: white;
        }

        @media (max-width: 768px) {
          .products-container {
            padding: 24px 16px;
          }

          .products-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .filters-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }

          .product-actions {
            justify-content: space-between;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminProducts