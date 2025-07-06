import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import ProductCard from '../components/Shop/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { useHomepage } from '../hooks/useHomepage';
import { transformImage, getImageSizeForContext } from '../utils/supabase/imageTransform';

const Home = () => {
  const { t } = useTranslation();
  const { products, loading } = useProducts();
  const { getSection, loading: homeLoading } = useHomepage();
  
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

  // Get homepage sections
  const heroSection = getSection('hero');
  const value1Section = getSection('value1');
  const value2Section = getSection('value2');
  const value3Section = getSection('value3');

  // Optimize hero image
  const heroImageUrl = heroSection.image_url ? 
    transformImage(heroSection.image_url, getImageSizeForContext('hero', window.innerWidth <= 768)) : 
    null;

  return (
    <>
      <SEOHead page="home" />
      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className="hero-layout">
              <FadeInSection className="hero-image-section">
                {heroImageUrl && (
                  <div className="hero-image">
                    <img
                      src={heroImageUrl}
                      alt={t('hero.image_alt')}
                      fetchpriority="high"
                    />
                  </div>
                )}
              </FadeInSection>
              
              <FadeInSection className="hero-content">
                <h1>{heroSection.title || t('hero.heading')}</h1>
                <p className="hero-subtext">{heroSection.content || t('hero.subtext')}</p>
                <Link to="/epood" className="link-with-arrow hero-cta" onClick={scrollToTop}>
                  {t('hero.cta')} <span className="arrow-wrapper">→</span>
                </Link>
              </FadeInSection>
            </div>
          </div>
        </section>
        
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
                  <h3>{value1Section.title || t('values.slow_fashion.heading')}</h3>
                  <p>{value1Section.content || t('values.slow_fashion.text')}</p>
                </div>
                <div className="value-block">
                  <h3>{value2Section.title || t('values.sustainability.heading')}</h3>
                  <p>{value2Section.content || t('values.sustainability.text')}</p>
                </div>
                <div className="value-block">
                  <h3>{value3Section.title || t('values.uniqueness.heading')}</h3>
                  <p>{value3Section.content || t('values.uniqueness.text')}</p>
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
        .hero {
          min-height: calc(90vh - 120px);
          display: flex;
          align-items: center;
          padding: 48px 0;
          overflow: hidden;
        }

        .hero .container {
          width: 100%;
        }
        
        .hero-layout {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 64px;
        }
        
        .hero-image-section {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero-image {
          width: 90%;
          max-width: 500px;
          border-radius: 8px;
          overflow: hidden; 
        }

        .hero-image img {
          width: 100%;
          height: auto;
          object-fit: initial;
          aspect-ratio: 4/5;
          border-radius: 4px;
          display: block;
        }

        .hero-content {
          flex: 1;
          text-align: left;
          padding: 0 20px;
        }
        
        .hero-content h1 {
          font-size: 3rem;
          margin-bottom: 16px;
          color: var(--color-ultramarine);
          line-height: 1.2;
        }

        .hero-subtext {
          font-size: 1.5rem;
          margin: 24px 0 40px;
          color: #333;
          line-height: 1.4;
          max-width: 500px;
        }

        .hero-cta {
          font-size: 1.25rem;
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-ultramarine);
          transition: opacity 0.2s ease;
        }

        .hero-cta:hover {
          opacity: 0.8;
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
          .hero-layout {
            flex-direction: column-reverse;
            gap: 32px;
          }

          .hero-image-section {
            width: 100%;
          }

          .hero-content {
            text-align: center;
            padding: 0;
            width: 100%;
          }

          .hero-content h1 {
            font-size: 2.5rem;
          }
          
          .hero-subtext {
            font-size: 1.25rem;
            margin: 16px auto 32px;
            max-width: 100%;
          }
        }

        @media (max-width: 480px) {
          .hero-content h1 {
            font-size: 2rem;
          }

          .hero-subtext {
            font-size: 1.1rem;
            margin: 16px auto 24px;
          }
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