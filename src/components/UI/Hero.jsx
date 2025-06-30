import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import FadeInSection from './FadeInSection';

const Hero = () => {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="hero">
      <div className="container">
        <FadeInSection>
          <div className="hero-image">
            <img 
              src="/leen-premium-epood.svg" 
              alt={t('hero.image_alt')}
            />
          </div>
        </FadeInSection>
        
        <FadeInSection className="hero-content">
          <h1>{t('hero.heading')}</h1>
          <p className="hero-subtext">{t('hero.subtext')}</p>
          <Link to="/epood" className="link-with-arrow hero-cta" onClick={scrollToTop}>
            {t('hero.cta')} <span className="arrow-wrapper">→</span>
          </Link>
        </FadeInSection>
      </div>

      <style jsx>{`
        .hero {
          padding: 48px 0 var(--section-spacing-large);
        }

        .hero-image {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto 48px;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: visible;
        }

        .hero-image img {
          width: 100%;
          height: auto;
          max-width: 100%;
          object-fit: contain;
          border-radius: 4px;
          display: block;
        }

        .hero-content {
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        .hero-subtext {
          font-size: 1.25rem;
          margin: 24px 0 32px;
          color: #666;
        }

        .hero-cta {
          font-size: 1.125rem;
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-ultramarine);
          transition: opacity 0.2s ease;
        }

        .hero-cta:hover {
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .hero {
            padding: 24px 0 var(--section-spacing);
          }

          .hero-image {
            max-width: 100%;
            margin-bottom: 32px;
          }

          .hero-subtext {
            font-size: 1.125rem;
          }
        }

        @media (max-width: 480px) {
          .hero-image {
            margin-bottom: 24px;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;