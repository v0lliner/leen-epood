import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import CartSummary from '../Shop/CartSummary';
import { useCart } from '../../context/CartContext';

const Navigation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems } = useCart();

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.about'), href: '/minust' },
    { name: t('nav.portfolio'), href: '/portfoolio' },
    { name: t('nav.shop'), href: '/epood' },
    { name: t('nav.contact'), href: '/kontakt' }
  ];

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <nav className="nav-container">
        <div className="container">
          <div className="nav-inner">
            <Link to="/" className="nav-logo">
              <h3>Leen.ee</h3>
            </Link>
            
            <div className="nav-desktop">
              <ul className="nav-links">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <Link 
                      to={item.href}
                      className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="nav-actions">
                <button 
                  className="cart-button"
                  onClick={() => setIsCartOpen(true)}
                  aria-label={t('nav.cart')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {getTotalItems() > 0 && <span className="cart-count">{getTotalItems()}</span>}
                </button>
                <LanguageToggle />
              </div>
            </div>

            <button 
              className="nav-mobile-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>

          {isMenuOpen && (
            <div className="nav-mobile-menu">
              <ul className="nav-mobile-links">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <Link 
                      to={item.href}
                      className={`nav-mobile-link ${isActive(item.href) ? 'active' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="nav-mobile-actions">
                <button 
                  className="cart-button"
                  onClick={() => {
                    setIsCartOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cart-icon">
                    <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t('nav.cart')} {getTotalItems() > 0 && `(${getTotalItems()})`}
                </button>
                <LanguageToggle />
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .nav-container {
            position: sticky;
            top: 0;
            background-color: var(--color-background);
            border-bottom: 1px solid #f0f0f0;
            z-index: 100;
          }

          .nav-inner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 0;
          }

          .nav-logo h3 {
            font-family: var(--font-heading);
            color: var(--color-ultramarine);
            font-weight: 600;
            margin: 0;
          }

          .nav-desktop {
            display: flex;
            align-items: center;
            gap: 48px;
          }

          .nav-links {
            display: flex;
            gap: 40px;
            list-style: none;
            margin: 0;
            padding: 0;
          }

          .nav-link {
            font-weight: 500;
            transition: color 0.2s ease;
            text-decoration: none;
            color: var(--color-text);
            font-size: 1rem;
            padding: 4px 0;
            position: relative;
          }

          .nav-link:hover,
          .nav-link.active {
            color: var(--color-ultramarine);
          }

          .nav-link.active:after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 2px;
            background-color: var(--color-ultramarine);
          }

          .nav-actions {
            display: flex;
            align-items: center;
            gap: 24px;
          }

          .cart-button {
            background: none;
            border: none;
            color: var(--color-text);
            font-family: var(--font-body);
            font-weight: 500;
            cursor: pointer;
            transition: color 0.2s ease;
            display: flex;
            align-items: center;
            position: relative;
            padding: 0;
          }

          .cart-button:hover {
            color: var(--color-ultramarine);
          }

          .cart-count {
            position: absolute;
            top: -8px;
            right: -8px;
            background-color: var(--color-ultramarine);
            color: white;
            font-size: 0.7rem;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .nav-mobile-toggle {
            display: none;
            flex-direction: column;
            gap: 4px;
            padding: 8px;
            background: none;
            border: none;
            cursor: pointer;
          }

          .nav-mobile-toggle span {
            width: 24px;
            height: 2px;
            background-color: var(--color-text);
            transition: all 0.2s ease;
          }

          .nav-mobile-menu {
            border-top: 1px solid #f0f0f0;
            padding: 24px 0;
          }

          .nav-mobile-links {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 24px;
            padding: 0;
          }

          .nav-mobile-link {
            font-weight: 500;
            padding: 8px 0;
            border-bottom: 1px solid transparent;
            text-decoration: none;
            color: var(--color-text);
            display: block;
            font-family: var(--font-body);
          }

          .nav-mobile-link:hover,
          .nav-mobile-link.active {
            color: var(--color-ultramarine);
            border-bottom-color: var(--color-ultramarine);
          }

          .nav-mobile-actions {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .nav-mobile-actions .cart-button {
            font-family: var(--font-body);
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .cart-icon {
            margin-right: 4px;
          }

          @media (max-width: 768px) {
            .nav-desktop {
              display: none;
            }

            .nav-mobile-toggle {
              display: flex;
            }
          }
        `}</style>
      </nav>

      <CartSummary 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </>
  );
};

export default Navigation;