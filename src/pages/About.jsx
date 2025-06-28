import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { useAboutPage } from '../hooks/useAboutPage';

const About = () => {
  const { t } = useTranslation();
  const { content, loading, getSection } = useAboutPage();

  if (loading) {
    return (
      <>
        <SEOHead page="about" />
        <main>
          <section className="section-large">
            <div className="container">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Laadin...</p>
              </div>
            </div>
          </section>
        </main>
        <style jsx>{`
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
        `}</style>
      </>
    );
  }

  const introSection = getSection('intro');
  const storySection = getSection('story');
  const educationSection = getSection('education');
  const experienceSection = getSection('experience');
  const inspirationSection = getSection('inspiration');
  const ctaSection = getSection('cta');

  // Helper function to format list content
  const formatListContent = (content) => {
    if (!content) return [];
    return content.split('\n').filter(line => line.trim()).map(line => line.replace(/^•\s*/, ''));
  };

  return (
    <>
      <SEOHead page="about" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <h1 className="text-center">{introSection.title || t('about.title')}</h1>
            </FadeInSection>
            
            <FadeInSection>
              <div className="about-intro">
                <div className="about-text">
                  {(introSection.content || t('about.intro')).split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </FadeInSection>

            <FadeInSection>
              <div className="about-profile">
                <div className="profile-image">
                  <img 
                    src={introSection.image_url || "https://images.pexels.com/photos/6185765/pexels-photo-6185765.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"} 
                    alt={t('about.profile_image_alt')}
                  />
                </div>
                <div className="profile-content">
                  <div className="profile-text">
                    {(storySection.content || t('about.story')).split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection>
              <div className="about-sections">
                <div className="about-section">
                  <h3>{educationSection.title || t('about.education.title')}</h3>
                  <ul className="section-list">
                    {formatListContent(educationSection.content || t('about.education.items')).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="about-section">
                  <h3>{experienceSection.title || t('about.experience.title')}</h3>
                  <ul className="section-list">
                    {formatListContent(experienceSection.content || t('about.experience.items')).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="about-section">
                  <h3>{inspirationSection.title || t('about.inspiration.title')}</h3>
                  <ul className="section-list">
                    {formatListContent(inspirationSection.content || t('about.inspiration.items')).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeInSection>

            {/* Shop CTA */}
            <FadeInSection className="about-cta-section">
              <div className="about-cta-content">
                <p>{ctaSection.content || t('about.cta_text')}</p>
                <Link to="/epood" className="link-with-arrow about-cta">
                  {t('about.cta_button')} <span className="arrow-wrapper">→</span>
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
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-ultramarine);
          transition: opacity 0.2s ease;
        }

        .about-cta:hover {
          opacity: 0.8;
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