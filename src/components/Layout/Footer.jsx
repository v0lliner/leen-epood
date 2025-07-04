import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="nav">
          <Link to="/kkk" onClick={scrollToTop}>{t('footer.faq')}</Link>
          <Link to="/epood" onClick={scrollToTop}>{t('footer.shop')}</Link>
          <Link to="/parimad-palad" onClick={scrollToTop}>{t('footer.portfolio')}</Link>
          <Link to="/minust" onClick={scrollToTop}>{t('footer.about')}</Link>
          <Link to="/kontakt" onClick={scrollToTop}>{t('footer.contact')}</Link>
        </div>
        
        <div className="info">
          <span className="brand">Leen.</span> {t('footer.company_info')}
        </div>

        <div className="legal-links">
          <Link to="/muugitingimused" onClick={scrollToTop}>{t('footer.terms')}</Link>
          <span className="separator">·</span>
          <Link to="/privaatsuspoliitika" onClick={scrollToTop}>{t('footer.privacy')}</Link>
        </div>
        
        <div className="social">
          <a href="https://www.facebook.com/leenvaranen" target="_blank" rel="noopener noreferrer">{t('footer.facebook')}</a>
          <span className="separator">·</span>
          <a href="https://www.instagram.com/leen.tailor/" target="_blank" rel="noopener noreferrer">{t('footer.instagram')}</a>
        </div>
        
        <div className="credits">
          {t('footer.made_by')} <a href="https://myralum.com/" target="_blank" rel="noopener noreferrer">Myralum</a>
        </div>
      </div>

      <style>{`
        .footer {
          text-align: center;
          padding: var(--section-spacing) 0;
          font-family: var(--font-body);
          font-size: 1rem;
          line-height: 1.5;
          border-top: 1px solid #f0f0f0;
          margin-top: var(--section-spacing-large);
        }

        .nav {
          font-family: var(--font-heading);
          font-weight: 500;
          letter-spacing: 0.5px;
          margin-bottom: 24px;
        }

        .nav a {
          color: var(--color-ultramarine);
          text-decoration: none;
          text-transform: uppercase;
          margin: 0 16px;
          font-size: 0.9rem;
          transition: opacity 0.2s ease;
        }

        .nav a:hover {
          opacity: 0.7;
        }

        .info {
          color: var(--color-text);
          margin-bottom: 16px;
          opacity: 0.8;
        }

        .brand {
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--color-ultramarine);
        }

        .legal-links {
          margin-bottom: 16px;
          font-size: 0.9rem;
        }
        
        .legal-links a {
          color: #666;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }
        
        .legal-links a:hover {
          opacity: 0.7;
          text-decoration: underline;
        }
        
        .social {
          margin-bottom: 16px;
        }

        .social a {
          color: var(--color-ultramarine);
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .social a:hover {
          opacity: 0.7;
        }
        
        .separator {
          margin: 0 8px;
          color: #666;
        }
        
        .credits {
          font-size: 0.85rem;
          color: #666;
        }
        
        .credits a {
          color: var(--color-ultramarine);
          text-decoration: none;
          transition: opacity 0.2s ease;
        }
        
        .credits a:hover {
          opacity: 0.7;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .footer {
            padding: var(--section-spacing) 0;
          }

          .nav a {
            display: block;
            margin: 12px 0;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;