import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'

const AdminDashboard = () => {
  const { t } = useTranslation()
  const { user } = useAuth()

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
      link: '/admin/portfolio'
    },
    {
      title: t('admin.dashboard.stats.orders'),
      value: '12',
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
      link: '/admin/portfolio/new',
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
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminDashboard