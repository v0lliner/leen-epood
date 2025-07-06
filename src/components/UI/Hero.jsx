import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import FadeInSection from './FadeInSection';
import { useAboutPage } from '../../hooks/useAboutPage';

const Hero = () => {
  const { t } = useTranslation();
  const { getSection } = useAboutPage();
  
  // Get the intro section from the About page to use the same image
  const introSection = getSection('intro');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-layout">
          <FadeInSection className="hero-image-section">
            {introSection.image_url && (
              <div className="hero-image">
                <img
                  src={introSection.image_url}
                  alt={t('hero.image_alt')}
                  fetchpriority="high"
                />
              </div>
            )}
          </FadeInSection>
          
          <FadeInSection className="hero-content">
            <h1>{t('hero.heading')}</h1>
            <p className="hero-subtext">{t('hero.subtext')}</p>
            <Link to="/epood" className="link-with-arrow hero-cta" onClick={scrollToTop}>
              {t('hero.cta')} <span className="arrow-wrapper">→</span>
            </Link>
          </FadeInSection>
        </div>
      </div>

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
          object-fit: cover;
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

      `}</style>
    </section>
  );
};

export default Hero;