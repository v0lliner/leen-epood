import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
              <div className="about-intro">
                <div className="about-text">
                  {t('about.intro').split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </FadeInSection>

            <FadeInSection>
              <div className="about-profile">
                <div className="profile-image">
                  <img 
                    src="https://images.pexels.com/photos/6185765/pexels-photo-6185765.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Leen Väränen portree"
                  />
                </div>
                <div className="profile-content">
                  <div className="profile-text">
                    {t('about.story').split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection>
              <div className="about-sections">
                <div className="about-section">
                  <h3>{t('about.education.title')}</h3>
                  <ul className="section-list">
                    {t('about.education.items').split('\n').map((item, index) => (
                      <li key={index}>{item.replace('• ', '')}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="about-section">
                  <h3>{t('about.experience.title')}</h3>
                  <ul className="section-list">
                    {t('about.experience.items').split('\n').map((item, index) => (
                      <li key={index}>{item.replace('• ', '')}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="about-section">
                  <h3>{t('about.inspiration.title')}</h3>
                  <ul className="section-list">
                    {t('about.inspiration.items').split('\n').map((item, index) => (
                      <li key={index}>{item.replace('• ', '')}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeInSection>

            {/* Shop CTA */}
            <FadeInSection className="about-cta-section">
              <div className="about-cta-content">
                <p>Huvitatud minu loomingust? Vaata, millised tööd on praegu saadaval.</p>
                <Link to="/epood" className="btn btn-primary about-cta">
                  Vaata tooteid →
                </Link>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .about-intro {
          max-width: 800px;
          margin: 64px auto 96px;
          text-align: center;
        }

        .about-intro .about-text {
          font-size: 1.25rem;
          line-height: 1.6;
        }

        .about-intro p {
          margin-bottom: 24px;
        }

        .about-intro p:last-child {
          margin-bottom: 0;
        }

        .about-profile {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
          margin-bottom: 96px;
        }

        .profile-image img {
          width: 100%;
          aspect-ratio: 4/5;
          object-fit: cover;
          border-radius: 4px;
        }

        .profile-content {
          display: flex;
          align-items: center;
        }

        .profile-text p {
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .profile-text p:last-child {
          margin-bottom: 0;
        }

        .about-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 64px;
          padding-top: 64px;
          border-top: 1px solid #f0f0f0;
        }

        .about-section h3 {
          color: var(--color-ultramarine);
          margin-bottom: 24px;
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 1.5rem;
        }

        .section-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .section-list li {
          margin-bottom: 16px;
          padding-left: 20px;
          position: relative;
          line-height: 1.6;
        }

        .section-list li:before {
          content: '•';
          color: var(--color-ultramarine);
          font-weight: bold;
          position: absolute;
          left: 0;
        }

        .section-list li:last-child {
          margin-bottom: 0;
        }

        .about-cta-section {
          margin-top: 128px;
          padding-top: 64px;
          border-top: 1px solid #f0f0f0;
        }

        .about-cta-content {
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }

        .about-cta-content p {
          margin-bottom: 24px;
          color: #666;
          font-size: 1rem;
        }

        .about-cta {
          font-size: 1.125rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .about-intro {
            margin: 48px auto 64px;
          }

          .about-intro .about-text {
            font-size: 1.125rem;
          }

          .about-profile {
            grid-template-columns: 1fr;
            gap: 32px;
            margin-bottom: 64px;
          }

          .about-sections {
            grid-template-columns: 1fr;
            gap: 48px;
            padding-top: 48px;
          }

          .about-section h3 {
            font-size: 1.25rem;
            margin-bottom: 20px;
          }

          .section-list li {
            margin-bottom: 12px;
          }

          .about-cta-section {
            margin-top: 96px;
            padding-top: 48px;
          }
        }
      `}</style>
    </>
  );
};

export default About;