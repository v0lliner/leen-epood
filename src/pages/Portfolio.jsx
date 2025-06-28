import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Portfolio = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');

  const portfolioItems = [
    {
      id: 1,
      category: 'ceramics',
      title: t('portfolio.items.ceramic_vase.title'),
      technique: t('portfolio.items.ceramic_vase.technique'),
      dimensions: '25cm x 15cm',
      year: 2023,
      image: 'https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      id: 2,
      category: 'clothing',
      title: t('portfolio.items.linen_dress.title'),
      technique: t('portfolio.items.linen_dress.technique'),
      dimensions: t('portfolio.items.linen_dress.size'),
      year: 2023,
      image: 'https://images.pexels.com/photos/7148430/pexels-photo-7148430.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      id: 3,
      category: 'ceramics',
      title: t('portfolio.items.coffee_cups.title'),
      technique: t('portfolio.items.coffee_cups.technique'),
      dimensions: t('portfolio.items.coffee_cups.dimensions'),
      year: 2022,
      image: 'https://images.pexels.com/photos/4226894/pexels-photo-4226894.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      id: 4,
      category: 'clothing',
      title: t('portfolio.items.wool_vest.title'),
      technique: t('portfolio.items.wool_vest.technique'),
      dimensions: t('portfolio.items.wool_vest.size'),
      year: 2023,
      image: 'https://images.pexels.com/photos/6069101/pexels-photo-6069101.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      id: 5,
      category: 'other',
      title: t('portfolio.items.mixed_plate.title'),
      technique: t('portfolio.items.mixed_plate.technique'),
      dimensions: t('portfolio.items.mixed_plate.dimensions'),
      year: 2024,
      image: 'https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    },
    {
      id: 6,
      category: 'other',
      title: t('portfolio.items.texture_wall.title'),
      technique: t('portfolio.items.texture_wall.technique'),
      dimensions: t('portfolio.items.texture_wall.dimensions'),
      year: 2024,
      image: 'https://images.pexels.com/photos/6479546/pexels-photo-6479546.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2'
    }
  ];

  const categories = [
    { key: 'all', label: t('portfolio.categories.all') },
    { key: 'ceramics', label: t('portfolio.ceramics') },
    { key: 'clothing', label: t('portfolio.clothing') },
    { key: 'other', label: t('portfolio.other') }
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
                      <div className="portfolio-meta">
                        <span className="portfolio-year">{item.year}</span>
                        <span className="portfolio-category">
                          {t(`portfolio.category_labels.${item.category}`)}
                        </span>
                      </div>
                      <h3>{item.title}</h3>
                      <p className="technique">{item.technique}</p>
                      <p className="dimensions">{item.dimensions}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>

            {/* Shop CTA */}
            <FadeInSection className="portfolio-cta-section">
              <div className="portfolio-cta-content">
                <p>{t('portfolio.cta_text')}</p>
                <Link to="/epood" className="link-with-arrow portfolio-cta">
                  {t('portfolio.cta_button')} <span className="arrow-wrapper">→</span>
                </Link>
              </div>
            </FadeInSection>
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
          gap: 64px;
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

        .portfolio-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          font-size: 0.9rem;
          color: #666;
        }

        .portfolio-year {
          font-family: var(--font-heading);
          font-weight: 500;
        }

        .portfolio-category {
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.8rem;
        }

        .portfolio-info h3 {
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 1.75rem;
          margin-bottom: 16px;
          color: var(--color-ultramarine);
        }

        .technique {
          font-style: italic;
          color: #666;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .dimensions {
          font-size: 0.9rem;
          color: #888;
          font-family: var(--font-heading);
          margin: 0;
        }

        .portfolio-cta-section {
          margin-top: 128px;
          padding-top: 64px;
          border-top: 1px solid #f0f0f0;
        }

        .portfolio-cta-content {
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }

        .portfolio-cta-content p {
          margin-bottom: 24px;
          color: #666;
          font-size: 1rem;
        }

        .portfolio-cta {
          font-size: 1.125rem;
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-ultramarine);
          transition: opacity 0.2s ease;
        }

        .portfolio-cta:hover {
          opacity: 0.8;
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
            gap: 32px;
          }

          .portfolio-info h3 {
            font-size: 1.5rem;
          }

          .portfolio-meta {
            justify-content: center;
            margin-bottom: 12px;
          }

          .portfolio-cta-section {
            margin-top: 96px;
            padding-top: 48px;
          }
        }
      `}</style>
    </>
  );
};

export default Portfolio;