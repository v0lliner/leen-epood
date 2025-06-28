import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import FadeInSection from './FadeInSection';

const Hero = () => {
  const { t } = useTranslation();

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
          <Link to="/epood" className="link-with-arrow hero-cta">
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
          max-width: 900px;
          margin: 0 auto 48px;
        }

        .hero-image img {
          width: 100%;
          aspect-ratio: 2/1;
          object-fit: cover;
          border-radius: 4px;
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
          }

          .hero-subtext {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;