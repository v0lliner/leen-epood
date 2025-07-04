import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import FadeInSection from './FadeInSection';

const Hero = () => {
  const { t } = useTranslation();

  const scrollToTop = () => {
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="hero">
      <div className="container">
        <FadeInSection>
          <div className="hero-image">
            <img 
              src="/leen-premium-epood.svg" 
              alt={t('hero.image_alt')}
              fetchpriority="high"
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
          min-height: calc(100vh - 120px);
          max-height: calc(100vh - 120px);
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
          max-height: calc(60vh - 72px);
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .hero-image img {
          width: 100%;
          height: auto;
          max-height: calc(60vh - 72px);
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
            min-height: calc(100vh - 100px);
            max-height: calc(100vh - 100px);
            padding: 24px 0;
          }

          .hero .container {
            gap: 24px;
          }

          .hero-image {
            max-width: 100%;
            max-height: calc(50vh - 50px);
          }

          .hero-image img {
            max-height: calc(50vh - 50px);
          }

          .hero-subtext {
            font-size: 1.125rem;
            margin: 16px 0 24px;
          }
        }

        @media (max-width: 480px) {
          .hero {
            min-height: calc(100vh - 80px);
            max-height: calc(100vh - 80px);
            padding: 16px 0;
          }

          .hero .container {
            gap: 20px;
          }

          .hero-image {
            max-height: calc(45vh - 40px);
          }

          .hero-image img {
            max-height: calc(45vh - 40px);
          }

          .hero-subtext {
            margin: 12px 0 20px;
          }
        }

        @media (max-height: 600px) {
          .hero {
            min-height: calc(100vh - 80px);
            max-height: calc(100vh - 80px);
          }

          .hero-image {
            max-height: calc(40vh - 40px);
          }

          .hero-image img {
            max-height: calc(40vh - 40px);
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