import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import { productService } from '../../utils/supabase/products'
import { portfolioItemService } from '../../utils/supabase/portfolioItems'
import { faqService } from '../../utils/supabase/faq'

const AdminDashboard = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    processing: 0,
    shipped: 0,
    completed: 0
  })
  const [stats, setStats] = useState({
    products: 0,
    availableProducts: 0,
    portfolioItems: 0,
    faqItems: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('🔄 Dashboard: Loading data...')

      // Load order statistics
      try {
        const orderResponse = await fetch('http://localhost:8000/php/admin_order_stats.php')
        console.log('📊 Dashboard: Order stats response status:', orderResponse.status)
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json()
          console.log('📊 Dashboard: Order stats data:', orderData)
          
          if (orderData.success) {
            setOrderStats(orderData.stats)
            console.log('📊 Dashboard: Order stats loaded:', orderData.stats)
          } else {
            console.error('❌ Dashboard: Order stats error:', orderData.error)
          }
        } else {
          console.error('❌ Dashboard: Order stats HTTP error:', orderResponse.status)
          const errorText = await orderResponse.text()
          console.error('❌ Dashboard: Order stats error details:', errorText)
        }
      } catch (orderError) {
        console.error('Error loading order stats:', orderError)
      }
      
      // Load products first
      const productsResult = await productService.getProducts()
      console.log('📦 Dashboard: Products result:', productsResult)
      
      if (productsResult.error) {
        console.error('❌ Dashboard: Products error:', productsResult.error)
        setError(`Toodete laadimine ebaõnnestus: ${productsResult.error.message}`)
        return
      }

      const products = productsResult.data || []
      console.log('📦 Dashboard: Products count:', products.length)

      // Load other data in parallel
      const [
        portfolioResult,
        faqResult
      ] = await Promise.all([
        portfolioItemService.getPortfolioItems().catch(err => ({ error: err, data: [] })),
        faqService.getFAQItems('et').catch(err => ({ error: err, data: [] }))
      ])

      console.log('📊 Dashboard: All data loaded:', {
        portfolio: portfolioResult,
        faq: faqResult
      })

      // Statistics from real data
      const portfolioItems = portfolioResult.data || []
      const faqItems = faqResult.data || []

      const newStats = {
        products: products.length,
        availableProducts: products.filter(p => p.available).length,
        portfolioItems: portfolioItems.length,
        faqItems: faqItems.length
      }

      console.log('📈 Dashboard: Calculated stats:', newStats)
      setStats(newStats)

    } catch (err) {
      console.error('❌ Dashboard: Error loading data:', err)
      setError(`Andmete laadimine ebaõnnestus: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getRecentActivity = () => {
    const activities = []
    return activities
  }

  const getQuickStats = () => [
    {
      title: 'Tooted kokku',
      value: stats.products.toString(),
      subtitle: `${stats.availableProducts || 0} saadaval`,
      icon: '📦',
      link: '/admin/products',
      color: 'blue'
    },
    {
      title: 'Minu lemmikud',
      value: stats.portfolioItems.toString(),
      subtitle: 'portfoolio tööd',
      icon: '🎨',
      link: '/admin/minu-lemmikud',
      color: 'purple'
    },
    {
      title: 'Tellimused',
      value: orderStats.total.toString(),
      subtitle: `${orderStats.paid || 0} makstud`,
      icon: '📋',
      link: '/admin/orders',
      color: 'green'
    },
    {
      title: 'KKK küsimused',
      value: stats.faqItems.toString(),
      subtitle: 'vastust eesti keeles',
      icon: '❓',
      link: '/admin/faq',
      color: 'orange'
    }
  ]

  const quickActions = [
    {
      title: 'Lisa uus toode',
      description: 'Lisage uus toode e-poodi müügiks',
      link: '/admin/products/new',
      icon: '➕',
      primary: true
    },
    {
      title: 'Lisa lemmik',
      description: 'Lisage uus töö portfooliosse',
      link: '/admin/minu-lemmikud/new',
      icon: '🖼️',
      primary: false
    },
    {
      title: 'Muuda minust lehte',
      description: 'Uuendage oma tutvustust',
      link: '/admin/about',
      icon: '👤',
      primary: false
    },
    {
      title: 'Halda KKK-d',
      description: 'Lisage või muutke korduma kippuvaid küsimusi',
      link: '/admin/faq',
      icon: '❓',
      primary: false
    }
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Laadin andmeid...</p>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="error-container">
          <div className="error-content">
            <h2>Viga andmete laadimisel</h2>
            <p>{error}</p>
            <button onClick={loadDashboardData} className="btn btn-primary">
              Proovi uuesti
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1>Tere tulemast, {user?.email?.split('@')[0] || 'Admin'}</h1>
            <p>Siin on ülevaade teie veebilehe olukorrast</p>
          </div>
          <div className="last-updated">
            Viimati uuendatud: {new Date().toLocaleDateString('et-EE', { 
              day: 'numeric', 
              month: 'long', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  {error.includes('Backend server') && (
                    <p className="mt-2">
                      <strong>To fix this:</strong> Run <code className="bg-red-100 px-1 rounded">php -S localhost:8000 -t public</code> in your terminal.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="stats-section">
          <h2>📊 Kiire ülevaade</h2>
          <div className="stats-grid">
            {getQuickStats().map((stat, index) => (
              <Link key={index} to={stat.link} className={`stat-card ${stat.color}`}>
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-content">
                  <h3>{stat.value}</h3>
                  <p className="stat-title">{stat.title}</p>
                  <p className="stat-subtitle">{stat.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-section">
          <h2>⚡ Kiirtoimingud</h2>
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link} className={`action-card ${action.primary ? 'primary' : ''}`}>
                <div className="action-icon">{action.icon}</div>
                <div className="action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {getRecentActivity().length > 0 ? (
          <div className="activity-section">
            <h2>📈 Viimane tegevus</h2>
            <div className="activity-list">
              {getRecentActivity().map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                    <span className="activity-date">
                      {activity.date.toLocaleDateString('et-EE', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="activity-section">
            <h2>📈 Viimane tegevus</h2>
            <div className="empty-activity">
              <div className="empty-icon">📭</div>
              <h4>Tegevusi pole veel</h4>
              <p>Kui hakkate tooteid müüma või sisu lisama, kuvatakse siin viimased tegevused.</p>
            </div>
          </div>
        )}

        {/* Website Status */}
        <div className="status-section">
          <h2>🌐 Veebilehe staatus</h2>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-indicator active"></span>
              <div>
                <h4>Veebileht</h4>
                <p>Töötab korralikult</p>
              </div>
            </div>
            <div className="status-item">
              <span className="status-indicator active"></span>
              <div>
                <h4>E-pood</h4>
                <p>{stats.availableProducts} toodet müügis</p>
              </div>
            </div>
            <div className="status-item">
              <span className="status-indicator active"></span>
              <div>
                <h4>Portfoolio</h4>
                <p>{stats.portfolioItems} tööd kuvatakse</p>
              </div>
            </div>
            <div className="status-item">
              <span className="status-indicator active"></span>
              <div>
                <h4>KKK</h4>
                <p>{stats.faqItems} küsimust eesti keeles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="refresh-section">
          <button onClick={loadDashboardData} className="refresh-btn" disabled={loading}>
            🔄 Uuenda andmeid
          </button>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 48px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e9ecef;
        }

        .welcome-section h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .welcome-section p {
          color: #666;
          font-size: 1.125rem;
          margin: 0;
        }

        .last-updated {
          color: #888;
          font-size: 0.9rem;
          font-style: italic;
        }

        .loading-container,
        .error-container {
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

        .error-content {
          text-align: center;
          background: white;
          padding: 32px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .error-content h2 {
          color: #dc3545;
          margin-bottom: 16px;
        }

        .stats-section,
        .actions-section,
        .activity-section,
        .status-section,
        .refresh-section {
          margin-bottom: 48px;
        }

        .stats-section h2,
        .actions-section h2,
        .activity-section h2,
        .status-section h2 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
          font-size: 1.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 20px;
          border-left: 4px solid transparent;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .stat-card.blue { border-left-color: #007bff; }
        .stat-card.purple { border-left-color: #6f42c1; }
        .stat-card.green { border-left-color: #28a745; }
        .stat-card.orange { border-left-color: #fd7e14; }

        .stat-icon {
          font-size: 2.5rem;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(47, 62, 156, 0.1);
          border-radius: 50%;
          flex-shrink: 0;
        }

        .stat-content h3 {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          color: var(--color-ultramarine);
          margin-bottom: 4px;
          line-height: 1;
        }

        .stat-title {
          color: var(--color-text);
          font-weight: 500;
          margin-bottom: 2px;
          font-size: 1rem;
        }

        .stat-subtitle {
          color: #666;
          font-size: 0.85rem;
          margin: 0;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .action-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          border: 2px solid transparent;
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .action-card.primary {
          border-color: var(--color-ultramarine);
          background: rgba(47, 62, 156, 0.02);
        }

        .action-icon {
          font-size: 1.75rem;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(47, 62, 156, 0.1);
          border-radius: 10px;
          flex-shrink: 0;
        }

        .action-content h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 8px;
          font-size: 1.125rem;
        }

        .action-content p {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        .activity-list {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-icon {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(47, 62, 156, 0.1);
          border-radius: 50%;
          flex-shrink: 0;
        }

        .activity-content h4 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 4px;
          font-size: 1rem;
        }

        .activity-content p {
          color: #666;
          margin-bottom: 4px;
          font-size: 0.9rem;
        }

        .activity-date {
          color: #888;
          font-size: 0.8rem;
        }

        .empty-activity {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 48px 24px;
          text-align: center;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .empty-activity h4 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 8px;
        }

        .empty-activity p {
          color: #666;
          margin: 0;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .status-item {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-indicator.active {
          background: #28a745;
          box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.2);
        }

        .status-item h4 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 4px;
          font-size: 1rem;
        }

        .status-item p {
          color: #666;
          font-size: 0.85rem;
          margin: 0;
        }

        .refresh-section {
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .refresh-btn {
          background: var(--color-ultramarine);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .refresh-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .btn:hover {
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 24px 16px;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .status-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }

          .action-card {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminDashboard