import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import AdminLayout from './AdminLayout'
import { getUserSubscription, getUserOrders } from '../../utils/stripe'

const AdminDashboard = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const [subResult, ordersResult] = await Promise.all([
        getUserSubscription(),
        getUserOrders()
      ])

      if (!subResult.error && subResult.data) {
        setSubscription(subResult.data)
      }

      if (!ordersResult.error && ordersResult.data) {
        setOrders(ordersResult.data)
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      title: t('admin.dashboard.stats.products'),
      value: '8',
      icon: '📦',
      link: '/admin/products'
    },
    {
      title: t('admin.dashboard.stats.portfolio'),
      value: '6',
      icon: '🎨',
      link: '/admin/minu-lemmikud'
    },
    {
      title: t('admin.dashboard.stats.orders'),
      value: orders.length.toString(),
      icon: '📋',
      link: '/admin/orders'
    },
    {
      title: t('admin.dashboard.stats.messages'),
      value: '3',
      icon: '💬',
      link: '/admin/messages'
    }
  ]

  const quickActions = [
    {
      title: t('admin.dashboard.actions.add_product'),
      description: t('admin.dashboard.actions.add_product_desc'),
      link: '/admin/products/new',
      icon: '➕'
    },
    {
      title: t('admin.dashboard.actions.add_portfolio'),
      description: t('admin.dashboard.actions.add_portfolio_desc'),
      link: '/admin/minu-lemmikud/new',
      icon: '🖼️'
    },
    {
      title: t('admin.dashboard.actions.view_orders'),
      description: t('admin.dashboard.actions.view_orders_desc'),
      link: '/admin/orders',
      icon: '📊'
    }
  ]

  return (
    <AdminLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>{t('admin.dashboard.welcome')}, {user?.email}</h1>
          <p>{t('admin.dashboard.subtitle')}</p>
        </div>

        {/* Subscription Status */}
        {loading ? (
          <div className="subscription-card loading">
            <div className="loading-spinner"></div>
            <p>Laadin tellimuse andmeid...</p>
          </div>
        ) : subscription ? (
          <div className="subscription-card">
            <h3>Tellimuse staatus</h3>
            <div className="subscription-info">
              <span className={`status-badge ${subscription.subscription_status}`}>
                {subscription.subscription_status === 'active' ? 'Aktiivne' : 
                 subscription.subscription_status === 'not_started' ? 'Pole alustatud' :
                 subscription.subscription_status}
              </span>
              {subscription.subscription_status === 'active' && (
                <div className="subscription-details">
                  <p>Järgmine arve: {new Date(subscription.current_period_end * 1000).toLocaleDateString('et-EE')}</p>
                  {subscription.payment_method_brand && (
                    <p>Makseviis: {subscription.payment_method_brand} ****{subscription.payment_method_last4}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="subscription-card">
            <h3>Tellimuse staatus</h3>
            <p>Tellimuse andmeid ei leitud</p>
          </div>
        )}

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <Link key={index} to={stat.link} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="quick-actions">
          <h2>{t('admin.dashboard.quick_actions')}</h2>
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link} className="action-card">
                <div className="action-icon">{action.icon}</div>
                <div className="action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        {orders.length > 0 && (
          <div className="recent-orders">
            <h2>Viimased tellimused</h2>
            <div className="orders-list">
              {orders.slice(0, 5).map((order) => (
                <div key={order.order_id} className="order-item">
                  <div className="order-info">
                    <span className="order-id">#{order.order_id}</span>
                    <span className="order-date">{new Date(order.order_date).toLocaleDateString('et-EE')}</span>
                  </div>
                  <div className="order-amount">
                    {(order.amount_total / 100).toFixed(2)} {order.currency.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 32px;
        }

        .dashboard-header {
          margin-bottom: 48px;
        }

        .dashboard-header h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .dashboard-header p {
          color: #666;
          font-size: 1.125rem;
        }

        .subscription-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 32px;
          border-left: 4px solid var(--color-ultramarine);
        }

        .subscription-card.loading {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid var(--color-ultramarine);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .subscription-card h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 16px;
          font-size: 1.25rem;
        }

        .subscription-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.85rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.not_started {
          background: #f8d7da;
          color: #721c24;
        }

        .subscription-details p {
          margin: 4px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          font-size: 2rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(47, 62, 156, 0.1);
          border-radius: 50%;
        }

        .stat-content h3 {
          font-family: var(--font-heading);
          font-size: 2rem;
          color: var(--color-ultramarine);
          margin-bottom: 4px;
        }

        .stat-content p {
          color: #666;
          font-size: 0.9rem;
          margin: 0;
        }

        .quick-actions h2 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .action-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .action-icon {
          font-size: 1.5rem;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(47, 62, 156, 0.1);
          border-radius: 8px;
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

        .recent-orders {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .recent-orders h2 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 20px;
          font-size: 1.25rem;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .order-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .order-id {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
        }

        .order-date {
          font-size: 0.85rem;
          color: #666;
        }

        .order-amount {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-ultramarine);
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 24px 16px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .subscription-card.loading {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminDashboard