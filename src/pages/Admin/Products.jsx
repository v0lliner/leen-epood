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
          <h1>{t('admin.products.title')}</h1>
          <Link to="/admin/products/new" className="btn btn-primary">
            {t('admin.products.add_new')}
          </Link>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="products-grid">
          {products.length === 0 ? (
            <div className="empty-state">
              <p>{t('admin.products.no_products')}</p>
              <Link to="/admin/products/new" className="btn btn-primary">
                {t('admin.products.add_first')}
              </Link>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <img src={product.image} alt={product.title} />
                </div>
                <div className="product-info">
                  <h3>{product.title}</h3>
                  <p className="product-price">{product.price}</p>
                  <p className="product-category">{product.category}</p>
                  <div className="product-actions">
                    <Link 
                      to={`/admin/products/${product.id}/edit`}
                      className="btn btn-secondary"
                    >
                      {t('admin.edit')}
                    </Link>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="btn btn-danger"
                    >
                      {t('admin.delete')}
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

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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

        .empty-state p {
          color: #666;
          margin-bottom: 24px;
          font-size: 1.125rem;
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

        .product-info h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 8px;
          font-size: 1.125rem;
        }

        .product-price {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          font-weight: 500;
          margin-bottom: 4px;
        }

        .product-category {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 16px;
          text-transform: capitalize;
        }

        .product-actions {
          display: flex;
          gap: 8px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.2s ease;
          font-size: 0.9rem;
          display: inline-block;
          text-align: center;
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

        @media (max-width: 768px) {
          .products-container {
            padding: 24px 16px;
          }

          .products-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminProducts