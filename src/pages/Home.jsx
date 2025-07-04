import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import Hero from '../components/UI/Hero';
import FadeInSection from '../components/UI/FadeInSection';
import ProductCard from '../components/Shop/ProductCard';
import { useProducts } from '../hooks/useProducts';

const Home = () => {
  const { t } = useTranslation();
  const { products, loading } = useProducts();
  
  // Get the 6 most recent available products (using the 'id' field as a proxy for recency)
  const recentProducts = [...products]
    .filter(product => product.available) // Only show available products
    .sort((a, b) => {
      // Handle different ID types (string or number)
      if (typeof a.id === 'string' && typeof b.id === 'string') {
        return b.id.localeCompare(a.id);
      }
      return b.id - a.id;
    })
    .slice(0, 6);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <SEOHead page="home" />
      <main>
        <Hero />
        
        {/* Recently Added Products Section */}
        <section className="section">
          <div className="container">
            <FadeInSection>
              <h2 className="text-center">{t('home.recent_products')}</h2>
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>{t('admin.loading')}</p>
                </div>
              ) : (
                <>
                  <div className="recent-products-grid">
                    {recentProducts.map((product, index) => (
                      <FadeInSection key={product.id}>
                        <ProductCard product={product} priority={index < 2} />
                      </FadeInSection>
                    ))}
                  </div>
                  <div className="view-all-container">
                    <Link to="/epood" className="link-with-arrow view-all-link" onClick={scrollToTop}>
                      {t('home.view_all')} <span className="arrow-wrapper">→</span>
                    </Link>
                  </div>
                </>
              )}
            </FadeInSection>
          </div>
        </section>

        {/* Values Section */}
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="value-grid">
                <div className="value-block">
                  <h3>{t('values.slow_fashion.heading')}</h3>
                  <p>{t('values.slow_fashion.text')}</p>
                </div>
                <div className="value-block">
                  <h3>{t('values.sustainability.heading')}</h3>
                  <p>{t('values.sustainability.text')}</p>
                </div>
                <div className="value-block">
                  <h3>{t('values.uniqueness.heading')}</h3>
                  <p>{t('values.uniqueness.text')}</p>
                </div>
              </div>
              
              <div className="portfolio-cta-container">
                <Link to="/parimad-palad" className="link-with-arrow portfolio-cta" onClick={scrollToTop}>
                  {t('home.portfolio_cta')} <span className="arrow-wrapper">→</span>
                </Link>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
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

        .recent-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 48px;
          margin-top: 48px;
        }
        
        .view-all-container {
          text-align: center;
          margin-top: 48px;
        }
        
        .view-all-link {
          font-size: 1.125rem;
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-ultramarine);
          transition: opacity 0.2s ease;
        }

        .view-all-link:hover {
          opacity: 0.8;
        }

        .portfolio-cta-container {
          text-align: center;
          margin-top: 64px;
        }

        .portfolio-cta {
          font-size: 1.125rem;
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-ultramarine);
          transition: opacity 0.2s ease;
        }

        .portfolio-cta:hover {
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .recent-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 32px;
            margin-top: 32px;
          }
          
          .view-all-container {
            margin-top: 32px;
          }

          .portfolio-cta-container {
            margin-top: 48px;
          }
        }
        
        @media (max-width: 480px) {
          .recent-products-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </>
  );
};

export default Home;