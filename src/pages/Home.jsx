import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import Hero from '../components/UI/Hero';
import FadeInSection from '../components/UI/FadeInSection';
import ProductCard from '../components/Shop/ProductCard';
import { products } from '../data/products';

const Home = () => {
  const { t } = useTranslation();
  
  // Get the 4 most recent products (using the 'year' field as a proxy for recency)
  const recentProducts = [...products]
    .sort((a, b) => b.year - a.year)
    .slice(0, 4);

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
              <div className="recent-products-grid">
                {recentProducts.map(product => (
                  <FadeInSection key={product.id}>
                    <ProductCard product={product} />
                  </FadeInSection>
                ))}
              </div>
              <div className="view-all-container">
                <Link to="/epood" className="btn btn-primary view-all-link">
                  {t('home.view_all')} →
                </Link>
              </div>
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
                <Link to="/portfoolio" className="btn btn-primary portfolio-cta">
                  Tutvu töödega →
                </Link>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
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
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .portfolio-cta-container {
          text-align: center;
          margin-top: 64px;
        }

        .portfolio-cta {
          font-size: 1.125rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
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