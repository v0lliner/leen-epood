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
    if (!confirm('Kas olete kindel, et soovite selle töö kustutada?')) {
      return
    }

    const { error } = await portfolioItemService.deletePortfolioItem(id)
    
    if (error) {
      setError(error.message)
    } else {
      setPortfolioItems(portfolioItems.filter(item => item.id !== id))
    }
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
          <h1>Tehtud tööd ({portfolioItems.length})</h1>
          <Link to="/admin/tehtud-tood/new" className="btn btn-primary">
            ➕ Lisa uus töö
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
              <label>Otsi töid</label>
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

        <div className="portfolio-grid">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              {portfolioItems.length === 0 ? (
                <>
                  <div className="empty-icon">🎨</div>
                  <h3>Tehtud töid pole veel lisatud</h3>
                  <p>Alustage oma portfoolio loomist esimese töö lisamisega</p>
                  <Link to="/admin/tehtud-tood/new" className="btn btn-primary">
                    Lisa esimene töö
                  </Link>
                </>
              ) : (
                <>
                  <div className="empty-icon">🔍</div>
                  <h3>Otsingule vastavaid töid ei leitud</h3>
                  <p>Proovige muuta otsingukriteeriumeid</p>
                </>
              )}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="portfolio-card">
                <div className="portfolio-image">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="portfolio-info">
                  <div className="portfolio-meta">
                    <span className="portfolio-category">{getCategoryLabel(item.category)}</span>
                    {item.year && <span className="portfolio-year">📅 {item.year}</span>}
                  </div>
                  <h3>{item.title}</h3>
                  {item.technique && (
                    <p className="portfolio-technique">{item.technique}</p>
                  )}
                  {item.dimensions && (
                    <p className="portfolio-dimensions">📏 {item.dimensions}</p>
                  )}
                  <div className="portfolio-actions">
                    <Link 
                      to={`/admin/tehtud-tood/${item.id}/edit`}
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
          margin-bottom: 32px;
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

        .portfolio-grid {
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

        .portfolio-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .portfolio-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .portfolio-image {
          width: 100%;
          height: 200px;
          overflow: hidden;
        }

        .portfolio-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .portfolio-info {
          padding: 20px;
        }

        .portfolio-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .portfolio-category {
          background: var(--color-ultramarine);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .portfolio-year {
          font-size: 0.8rem;
          color: #666;
        }

        .portfolio-info h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 8px;
          font-size: 1.125rem;
          line-height: 1.3;
        }

        .portfolio-technique {
          color: #666;
          font-style: italic;
          margin-bottom: 8px;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .portfolio-dimensions {
          color: #666;
          font-size: 0.8rem;
          margin-bottom: 16px;
        }

        .portfolio-actions {
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

          .portfolio-grid {
            grid-template-columns: 1fr;
          }

          .portfolio-actions {
            justify-content: space-between;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminTehtudTood