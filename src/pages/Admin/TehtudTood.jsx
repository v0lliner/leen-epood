import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import { portfolioItemService } from '../../utils/supabase/portfolioItems'

const AdminTehtudTood = () => {
  const { t } = useTranslation()
  const [portfolioItems, setPortfolioItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    loadPortfolioItems()
  }, [])

  const loadPortfolioItems = async () => {
    setLoading(true)
    const { data, error } = await portfolioItemService.getPortfolioItems()
    
    if (error) {
      setError(error.message)
    } else {
      setPortfolioItems(data)
    }
    
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Kas olete kindel, et soovite selle pala kustutada?')) {
      return
    }

    const { error } = await portfolioItemService.deletePortfolioItem(id)
    
    if (error) {
      setError(error.message)
    } else {
      setPortfolioItems(portfolioItems.filter(item => item.id !== id))
    }
  }

  const handleMoveUp = async (id) => {
    setReordering(true)
    const { error } = await portfolioItemService.moveItemUp(id)
    
    if (error) {
      setError(error.message)
    } else {
      await loadPortfolioItems() // Reload to get updated order
    }
    
    setReordering(false)
  }

  const handleMoveDown = async (id) => {
    setReordering(true)
    const { error } = await portfolioItemService.moveItemDown(id)
    
    if (error) {
      setError(error.message)
    } else {
      await loadPortfolioItems() // Reload to get updated order
    }
    
    setReordering(false)
  }

  const filteredItems = portfolioItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.technique?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || item.category === filterCategory
    
    return matchesSearch && matchesCategory
  })

  const getCategoryLabel = (category) => {
    const labels = {
      'ceramics': 'Keraamika',
      'clothing': 'Rõivad',
      'other': 'Muud tooted'
    }
    return labels[category] || category
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Laadin...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="portfolio-container">
        <div className="portfolio-header">
          <h1>{t('admin.portfolio.title')} ({portfolioItems.length})</h1>
          <Link to="/admin/parimad-palad/new" className="btn btn-primary">
            ➕ {t('admin.portfolio.add_new')}
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
              <label>Otsi palasid</label>
              <input
                type="text"
                placeholder="Otsi pealkirja või tehnika järgi..."
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
                <option value="ceramics">Keraamika</option>
                <option value="clothing">Rõivad</option>
                <option value="other">Muud tooted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ordering Info */}
        <div className="ordering-info">
          <div className="info-card">
            <h3>📋 Järjestuse muutmine</h3>
            <p>Kasutage ↑ ja ↓ nuppe, et muuta palaside järjekorda kodulehel. Ülemine pala kuvatakse esimesena.</p>
          </div>
        </div>

        <div className="portfolio-list">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              {portfolioItems.length === 0 ? (
                <>
                  <div className="empty-icon">🎨</div>
                  <h3>{t('admin.portfolio.no_items')}</h3>
                  <p>Alustage oma portfoolio loomist esimese palaga</p>
                  <Link to="/admin/parimad-palad/new" className="btn btn-primary">
                    {t('admin.portfolio.add_first')}
                  </Link>
                </>
              ) : (
                <>
                  <div className="empty-icon">🔍</div>
                  <h3>Otsingule vastavaid palasid ei leitud</h3>
                  <p>Proovige muuta otsingukriteeriumeid</p>
                </>
              )}
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div key={item.id} className="portfolio-item">
                <div className="item-order">
                  <span className="order-number">#{item.display_order || index + 1}</span>
                  <div className="order-controls">
                    <button 
                      onClick={() => handleMoveUp(item.id)}
                      disabled={reordering || index === 0}
                      className="btn btn-small btn-order"
                      title="Liiguta üles"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => handleMoveDown(item.id)}
                      disabled={reordering || index === filteredItems.length - 1}
                      className="btn btn-small btn-order"
                      title="Liiguta alla"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="item-image">
                  <img src={item.image} alt={item.title} />
                </div>

                <div className="item-info">
                  <div className="item-meta">
                    <span className="item-category">{getCategoryLabel(item.category)}</span>
                    {item.year && <span className="item-year">📅 {item.year}</span>}
                  </div>
                  <h3>{item.title}</h3>
                  {item.technique && (
                    <p className="item-technique">{item.technique}</p>
                  )}
                  {item.dimensions && (
                    <p className="item-dimensions">📏 {item.dimensions}</p>
                  )}
                </div>

                <div className="item-actions">
                  <Link 
                    to={`/admin/parimad-palad/${item.id}/edit`}
                    className="btn btn-secondary"
                  >
                    ✏️ Muuda
                  </Link>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-danger"
                  >
                    🗑️ Kustuta
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .portfolio-container {
          padding: 32px;
        }

        .portfolio-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .portfolio-header h1 {
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
          margin-bottom: 24px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
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

        .ordering-info {
          margin-bottom: 32px;
        }

        .info-card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          border-left: 4px solid var(--color-ultramarine);
        }

        .info-card h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 8px;
          font-size: 1rem;
        }

        .info-card p {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
          margin: 0;
        }

        .portfolio-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .empty-state {
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

        .portfolio-item {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
          display: grid;
          grid-template-columns: auto 120px 1fr auto;
          gap: 20px;
          align-items: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .portfolio-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .item-order {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-width: 60px;
        }

        .order-number {
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--color-ultramarine);
          font-size: 1.1rem;
        }

        .order-controls {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .btn-order {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          color: var(--color-text);
          font-size: 1.2rem;
          font-weight: bold;
        }

        .btn-order:hover:not(:disabled) {
          background: var(--color-ultramarine);
          color: white;
          border-color: var(--color-ultramarine);
        }

        .btn-order:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .item-image {
          width: 120px;
          height: 120px;
          overflow: hidden;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-info {
          min-width: 0;
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .item-category {
          background: var(--color-ultramarine);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .item-year {
          font-size: 0.8rem;
          color: #666;
        }

        .item-info h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 4px;
          font-size: 1.125rem;
          line-height: 1.3;
        }

        .item-technique {
          color: #666;
          font-style: italic;
          margin-bottom: 4px;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .item-dimensions {
          color: #666;
          font-size: 0.8rem;
          margin: 0;
        }

        .item-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
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

        .btn:hover:not(:disabled) {
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

        .btn-small {
          padding: 4px 8px;
          font-size: 0.8rem;
        }

        @media (max-width: 768px) {
          .portfolio-container {
            padding: 24px 16px;
          }

          .portfolio-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .filters-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .portfolio-item {
            grid-template-columns: 1fr;
            gap: 16px;
            text-align: center;
          }

          .item-order {
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 16px;
          }

          .order-controls {
            flex-direction: row;
            gap: 8px;
          }

          .item-image {
            width: 100%;
            max-width: 200px;
            height: 200px;
            margin: 0 auto;
          }

          .item-actions {
            justify-content: center;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminTehtudTood