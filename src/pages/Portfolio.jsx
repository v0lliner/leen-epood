import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Portfolio = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');

  const portfolioItems = [
    {
      id: 1,
      category: 'ceramics',
      title: 'Savi vaas',
      technique: 'Käsitsi vormitud, glasuuritud',
      dimensions: '25cm x 15cm',
      image: 'https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      id: 2,
      category: 'clothing',
      title: 'Linane kleit',
      technique: 'Käsitsi õmmeldud, looduslik materjal',
      dimensions: 'Suurus M',
      image: 'https://images.pexels.com/photos/7148430/pexels-photo-7148430.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      id: 3,
      category: 'ceramics',
      title: 'Kohvitassid',
      technique: 'Dreitud, mattkasiin',
      dimensions: '8cm x 8cm, komplekt 4tk',
      image: 'https://images.pexels.com/photos/4226894/pexels-photo-4226894.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      id: 4,
      category: 'clothing',
      title: 'Villane vest',
      technique: 'Käsitööna kootud, loodusvärvid',
      dimensions: 'Suurus S-M',
      image: 'https://images.pexels.com/photos/6069101/pexels-photo-6069101.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      id: 5,
      category: 'experiments',
      title: 'Segatehnika taldrik',
      technique: 'Keraamika ja tekstiil',
      dimensions: '20cm diameter',
      image: 'https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      id: 6,
      category: 'experiments',
      title: 'Tekstuurne sein',
      technique: 'Mitmematerjali installatsioon',
      dimensions: '100cm x 150cm',
      image: 'https://images.pexels.com/photos/6479546/pexels-photo-6479546.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    }
  ];

  const categories = [
    { key: 'all', label: 'Kõik' },
    { key: 'ceramics', label: t('portfolio.ceramics') },
    { key: 'clothing', label: t('portfolio.clothing') },
    { key: 'experiments', label: t('portfolio.experiments') }
  ];

  const filteredItems = activeCategory === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeCategory);

  return (
    <>
      <SEOHead page="portfolio" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <h1 className="text-center">{t('portfolio.title')}</h1>
            </FadeInSection>

            <FadeInSection>
              <div className="portfolio-filters">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setActiveCategory(category.key)}
                    className={`tab-button ${activeCategory === category.key ? 'active' : ''}`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </FadeInSection>

            <div className="portfolio-grid">
              {filteredItems.map((item, index) => (
                <FadeInSection key={item.id} className="portfolio-item">
                  <div className="portfolio-content">
                    <div className="portfolio-image">
                      <img src={item.image} alt={item.title} />
                    </div>
                    <div className="portfolio-info">
                      <h3>{item.title}</h3>
                      <p className="technique">{item.technique}</p>
                      <p className="dimensions">{item.dimensions}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .portfolio-filters {
          display: flex;
          justify-content: center;
          margin: 64px 0 48px;
          flex-wrap: wrap;
        }

        .portfolio-grid {
          display: grid;
          gap: 96px;
        }

        .portfolio-item:nth-child(even) .portfolio-content {
          flex-direction: row-reverse;
        }

        .portfolio-content {
          display: flex;
          gap: 48px;
          align-items: center;
        }

        .portfolio-image {
          flex: 1;
        }

        .portfolio-image img {
          width: 100%;
          aspect-ratio: 4/3;
          object-fit: cover;
          border-radius: 4px;
        }

        .portfolio-info {
          flex: 1;
        }

        .portfolio-info h3 {
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 1.5rem;
          margin-bottom: 16px;
          color: var(--color-ultramarine);
        }

        .technique {
          font-style: italic;
          color: #666;
          margin-bottom: 8px;
        }

        .dimensions {
          font-size: 0.9rem;
          color: #888;
        }

        @media (max-width: 768px) {
          .portfolio-filters {
            margin: 48px 0 32px;
          }

          .portfolio-grid {
            gap: 64px;
          }

          .portfolio-content {
            flex-direction: column !important;
            gap: 24px;
          }

          .portfolio-info h3 {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </>
  );
};

export default Portfolio;