import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'

const AdminLayout = ({ children }) => {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const navigationItems = [
    {
      name: t('admin.nav.dashboard'),
      href: '/admin/dashboard',
      icon: '🏠'
    },
    {
      name: t('admin.nav.products'),
      href: '/admin/products',
      icon: '📦'
    },
    {
      name: t('admin.nav.portfolio'),
      href: '/admin/minu-lemmikud',
      icon: '🎨'
    },
    {
      name: 'Minust leht',
      href: '/admin/about',
      icon: '👤'
    },
    {
      name: 'KKK',
      href: '/admin/faq',
      icon: '❓'
    },
    {
      name: t('admin.nav.orders'),
      href: '/admin/orders',
      icon: '📋',
      active: location.pathname.startsWith('/admin/orders')
    }, 
    {
      name: t('admin.nav.categories'),
      href: '/admin/categories',
      icon: '📁',
      active: location.pathname.startsWith('/admin/categories')
    },
    {
      name: t('admin.nav.messages'),
      href: '/admin/messages',
      icon: '💬',
      active: location.pathname.startsWith('/admin/messages')
      icon: '💬'
    },
    {
      name: t('admin.nav.settings'),
      href: '/admin/settings',
      icon: '⚙️',
      active: location.pathname.startsWith('/admin/settings')
    }
  ]

  const isActive = (href) => {
    // If the item has an explicit active property, use that
    const item = navigationItems.find(item => item.href === href);
    if (item && typeof item.active === 'boolean') {
      return item.active;
    }
    
    if (href === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/admin'
    }
    if (href === '/admin/minu-lemmikud') {
      return location.pathname.startsWith('/admin/minu-lemmikud') || 
             location.pathname.startsWith('/admin/parimad-palad') ||
             location.pathname.startsWith('/admin/tehtud-tood')
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="brand-link">
            <h2>Leen.</h2>
          </Link>
          <p>{t('admin.cms_title')}</p>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`nav-item ${isActive(item.href) ? 'nav-item-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleSignOut} className="sign-out-btn">
            <span className="nav-icon">🚪</span>
            <span className="nav-text">{t('admin.sign_out')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Top navigation */}
        <header className="top-nav">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <Link to="/" className="back-home-link">
            {t('admin.back_to_homepage')}
          </Link>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background-color: #f8f9fa;
        }

        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 998;
          display: none;
        }

        .sidebar {
          width: 280px;
          background-color: white;
          border-right: 1px solid #e9ecef;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 999;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .sidebar-open {
          transform: translateX(0);
        }

        .sidebar-header {
          padding: 32px 24px;
          border-bottom: 1px solid #e9ecef;
        }

        .brand-link {
          text-decoration: none;
          color: inherit;
        }

        .sidebar-header h2 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 8px;
          font-size: 1.75rem;
        }

        .sidebar-header p {
          color: #666;
          font-size: 0.9rem;
          margin: 0;
        }

        .sidebar-nav {
          flex: 1;
          padding: 24px 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          text-decoration: none;
          color: #666;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }

        .nav-item:hover {
          background-color: #f8f9fa;
          color: var(--color-ultramarine);
        }

        .nav-item-active {
          background-color: rgba(47, 62, 156, 0.1);
          color: var(--color-ultramarine);
          border-left-color: var(--color-ultramarine);
        }

        .nav-icon {
          font-size: 1.25rem;
          width: 24px;
          text-align: center;
        }

        .nav-text {
          font-weight: 500;
        }

        .sidebar-footer {
          padding: 24px;
          border-top: 1px solid #e9ecef;
        }

        .sign-out-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          transition: color 0.2s ease;
          font-family: var(--font-body);
          font-size: 1rem;
          width: 100%;
        }

        .sign-out-btn:hover {
          color: #dc3545;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-left: 0;
        }

        .top-nav {
          background-color: white;
          border-bottom: 1px solid #e9ecef;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .sidebar-toggle {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }

        .sidebar-toggle span {
          width: 24px;
          height: 2px;
          background-color: var(--color-text);
          transition: all 0.2s ease;
        }

        .back-home-link {
          color: var(--color-ultramarine);
          text-decoration: none;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .back-home-link:hover {
          background-color: rgba(47, 62, 156, 0.1);
        }

        .page-content {
          flex: 1;
          overflow-y: auto;
        }

        @media (min-width: 769px) {
          .sidebar {
            position: static;
            transform: translateX(0);
          }

          .sidebar-toggle {
            display: none;
          }

          .main-content {
            margin-left: 0;
          }
        }

        @media (max-width: 768px) {
          .sidebar-overlay {
            display: block;
          }

          .main-content {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminLayout