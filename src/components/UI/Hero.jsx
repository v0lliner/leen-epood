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
          min-height: 100vh;
          max-height: 100vh;
          display: flex;
          align-items: center;
          padding: 48px 0;
          overflow: hidden;
        }

        .hero .container {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 32px;
        }

        .hero-image {
          width: 100%;
          max-width: 800px;
          height: auto;
          max-height: 60vh;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .hero-image img {
          width: 100%;
          height: auto;
          max-height: 60vh;
          object-fit: contain;
          border-radius: 4px;
          display: block;
        }

        .hero-content {
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
          flex-shrink: 0;
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
            min-height: 100vh;
            max-height: 100vh;
            padding: 24px 0;
          }

          .hero .container {
            gap: 24px;
          }

          .hero-image {
            max-width: 100%;
            max-height: 50vh;
          }

          .hero-image img {
            max-height: 50vh;
          }

          .hero-subtext {
            font-size: 1.125rem;
            margin: 16px 0 24px;
          }
        }

        @media (max-width: 480px) {
          .hero {
            padding: 16px 0;
          }

          .hero .container {
            gap: 20px;
          }

          .hero-image {
            max-height: 45vh;
          }

          .hero-image img {
            max-height: 45vh;
          }

          .hero-subtext {
            margin: 12px 0 20px;
          }
        }

        @media (max-height: 600px) {
          .hero {
            min-height: 100vh;
            max-height: 100vh;
          }

          .hero-image {
            max-height: 40vh;
          }

          .hero-image img {
            max-height: 40vh;
          }

          .hero-subtext {
            font-size: 1rem;
            margin: 16px 0 20px;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;