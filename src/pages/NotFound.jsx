import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead page="404" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="error-content">
                <h1>404</h1>
                <p>{t('errors.404.message')}</p>
                <Link to="/" className="cta-button">
                  {t('errors.404.back')} →
                </Link>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .error-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .error-content h1 {
          font-size: 6rem;
          color: var(--color-clay-rose);
          margin-bottom: 24px;
        }

        .error-content p {
          font-size: 1.25rem;
          margin-bottom: 32px;
          color: #666;
        }

        @media (max-width: 768px) {
          .error-content h1 {
            font-size: 4rem;
          }
        }
      `}</style>
    </>
  );
};

export default NotFound;