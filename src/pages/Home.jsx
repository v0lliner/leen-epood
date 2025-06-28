import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import Hero from '../components/UI/Hero';
import FadeInSection from '../components/UI/FadeInSection';

const Home = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead page="home" />
      <main>
        <Hero />
        
        {/* Intro Section */}
        <section className="section">
          <div className="container">
            <FadeInSection>
              <div className="grid-50-50">
                <div>
                  <img 
                    src="https://images.pexels.com/photos/7261706/pexels-photo-7261706.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Leen Väränen portree"
                  />
                </div>
                <div>
                  <p className="intro-text">{t('intro.text')}</p>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* Values Section */}
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <div className="value-grid">
                <div className="value-block">
                  <h3>{t('values.slow_fashion.heading')}</h3>
                  <p>{t('values.slow_fashion.text')}</p>
                </div>
                <div className="value-block">
                  <h3>{t('values.sustainability.heading')}</h3>
                  <p>{t('values.sustainability.text')}</p>
                </div>
                <div className="value-block">
                  <h3>{t('values.uniqueness.heading')}</h3>
                  <p>{t('values.uniqueness.text')}</p>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .intro-text {
          font-size: 1.5rem;
          line-height: 1.4;
          color: var(--color-text);
        }

        @media (max-width: 768px) {
          .intro-text {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </>
  );
};

export default Home;