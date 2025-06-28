import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const About = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead page="about" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <h1 className="text-center">{t('about.title')}</h1>
            </FadeInSection>
            
            <FadeInSection>
              <div className="grid-50-50 about-profile">
                <div>
                  <img 
                    src="https://images.pexels.com/photos/6185765/pexels-photo-6185765.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Leen Väränen portree"
                    className="about-image"
                  />
                </div>
                <div className="about-content">
                  <div className="about-text">
                    {t('about.text').split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection>
              <div className="highlights">
                <div className="highlight-item">
                  <h3>Haridus</h3>
                  <p>{t('about.highlights.education')}</p>
                </div>
                <div className="highlight-item">
                  <h3>Kogemus</h3>
                  <p>{t('about.highlights.experience')}</p>
                </div>
                <div className="highlight-item">
                  <h3>Inspiratsioon</h3>
                  <p>{t('about.highlights.inspiration')}</p>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .about-profile {
          margin-top: 64px;
        }

        .about-image {
          width: 100%;
          aspect-ratio: 4/5;
          object-fit: cover;
          border-radius: 4px;
        }

        .about-content {
          display: flex;
          align-items: center;
        }

        .about-text p {
          margin-bottom: 24px;
        }

        .about-text p:last-child {
          margin-bottom: 0;
        }

        .highlights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 48px;
          margin-top: 96px;
          padding-top: 64px;
          border-top: 1px solid #f0f0f0;
        }

        .highlight-item h3 {
          color: var(--color-ultramarine);
          margin-bottom: 16px;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 1.25rem;
        }

        @media (max-width: 768px) {
          .highlights {
            grid-template-columns: 1fr;
            gap: 32px;
            margin-top: 64px;
          }
        }
      `}</style>
    </>
  );
};

export default About;