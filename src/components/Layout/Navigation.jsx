import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LanguageToggle from './LanguageToggle';
import CartSummary from '../Shop/CartSummary';
import { useCart } from '../../context/CartContext';

const Navigation = () => { 
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems } = useCart();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
    scrollToTop();
  };

  const navigation = [
    { name: t('nav.shop'), href: '/epood' },
    { name: t('nav.portfolio'), href: '/minu-lemmikud' },
    { name: t('nav.about'), href: '/minust' },
    { name: t('nav.contact'), href: '/kontakt' }
  ];

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    if (href === '/minu-lemmikud') {
      return location.pathname === '/minu-lemmikud' || 
             location.pathname === '/parimad-palad' ||
             location.pathname === '/tehtud-tood' || 
             location.pathname === '/portfoolio';
    }
    return location.pathname.startsWith(href);
  };

  const cartItemCount = getTotalItems();

  return (
    <>
      <nav className={`nav-container ${isMenuOpen ? 'menu-expanded' : ''}`}>
        <div className="nav-wrapper">
          <div className="nav-inner">
            <Link to="/" className="nav-logo" onClick={scrollToTop}>
              <h3>Leen.ee</h3>
            </Link>
            
            <div className="nav-center">
              <ul className="nav-links">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <Link 
                      to={item.href}
                      className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                      onClick={scrollToTop}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="nav-actions">
              {user ? (
                <Link to="/account" className="account-button">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ) : (
                <Link to="/login" className="login-button">
                  Log In
                </Link>
              )}
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
                {cartItemCount > 0 && <span className="cart-count">{cartItemCount}</span>}
              </button>
              <LanguageToggle />
            </div>

            <div className="mobile-actions">
              {user ? (
                <Link to="/account" className="mobile-account-button">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ) : (
                <Link to="/login" className="mobile-login-button">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 12H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
              <button 
                className="mobile-cart-button"
                onClick={() => setIsCartOpen(true)}
                aria-label={t('nav.cart')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {cartItemCount > 0 && <span className="cart-count">{cartItemCount}</span>}
              </button>

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
          </div>

          {isMenuOpen && (
            <div className="nav-mobile-menu">
              <ul className="nav-mobile-links">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <Link 
                      to={item.href}
                      className={`nav-mobile-link ${isActive(item.href) ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
                {user ? (
                  <li>
                    <Link 
                      to="/account"
                      className="nav-mobile-link"
                      onClick={handleLinkClick}
                    >
                      My Account
                    </Link>
                  </li>
                ) : (
                  <li>
                    <Link 
                      to="/login"
                      className="nav-mobile-link"
                      onClick={handleLinkClick}
                    >
                      Log In
                    </Link>
                  </li>
                )}
                <li>
                  <button 
                    className="nav-mobile-link cart-mobile-link"
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
                    {t('nav.cart')} {cartItemCount > 0 && `(${cartItemCount})`}
                  </button>
                </li>
              </ul>
              <div className="nav-mobile-actions">
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
            transition: height 0.3s ease;
          }
          
          .nav-container.menu-expanded {
            height: auto;
          }

          .nav-wrapper {
            position: relative;
            width: 100%;
            background-color: var(--color-background);
          }

          .nav-inner {
            max-width: var(--max-width);
            margin: 0 auto;
            padding: 16px var(--padding-inline);
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 48px;
            min-height: var(--header-height);
          }

          .nav-logo h3 {
            font-family: var(--font-heading);
            color: var(--color-ultramarine);
            font-weight: 600;
            margin: 0; 
          }

          .nav-center {
            display: flex;
            justify-content: center;
            width: 100%;
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
            justify-self: end;
          }

          .account-button,
          .login-button {
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
            text-decoration: none;
          }

          .account-button:hover,
          .login-button:hover {
            color: var(--color-ultramarine);
          }

          .mobile-account-button,
          .mobile-login-button {
            background: none;
            border: none;
            color: var(--color-text);
            cursor: pointer;
            transition: color 0.2s ease;
            display: flex;
            align-items: center;
            position: relative;
            padding: 0;
          }

          .mobile-account-button:hover,
          .mobile-login-button:hover {
            color: var(--color-ultramarine);
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
            background-color: var(--color-pastel-yellow);
            color: #333;
            font-size: 0.7rem;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
          }

          .mobile-actions {
            display: none;
            align-items: center;
            gap: 16px;
            justify-self: end;
          }

          .mobile-cart-button {
            background: none;
            border: none;
            color: var(--color-text);
            cursor: pointer;
            transition: color 0.2s ease;
            display: flex;
            align-items: center;
            position: relative;
            padding: 0;
          }

          .mobile-cart-button:hover {
            color: var(--color-ultramarine);
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
            padding: 24px var(--padding-inline);
            background-color: var(--color-background);
            max-width: var(--max-width);
            margin: 0 auto;
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
            background: none;
            border: none;
            text-align: left;
            width: 100%;
            cursor: pointer;
          }

          .nav-mobile-link:hover,
          .nav-mobile-link.active {
            color: var(--color-ultramarine);
            border-bottom-color: var(--color-ultramarine);
          }

          .cart-mobile-link {
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .cart-icon {
            flex-shrink: 0;
          }

          .nav-mobile-actions {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          @media (max-width: 768px) {
            .nav-inner {
              grid-template-columns: auto 1fr auto;
              gap: 24px;
              padding: 16px var(--padding-inline);
            }

            .nav-center {
              display: none;
            }

            .nav-actions {
              display: none;
            }

            .mobile-actions {
              display: flex;
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