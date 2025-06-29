import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { portfolioItemService } from '../utils/supabase/portfolioItems';

const Portfolio = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback data if database is empty
  const fallbackItems = [
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

  useEffect(() => {
    loadPortfolioItems();
  }, []);

  const loadPortfolioItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await portfolioItemService.getPortfolioItems();
      
      if (error) {
        console.warn('Failed to load portfolio items from database, using fallback data:', error);
        setPortfolioItems(fallbackItems);
      } else {
        // If no items in database, use fallback data
        setPortfolioItems(data.length > 0 ? data : fallbackItems);
      }
    } catch (err) {
      console.warn('Error loading portfolio items, using fallback data:', err);
      setPortfolioItems(fallbackItems);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: 'all', label: t('portfolio.categories.all') },
    { key: 'ceramics', label: t('portfolio.ceramics') },
    { key: 'clothing', label: t('portfolio.clothing') },
    { key: 'other', label: t('portfolio.other') }
  ];

  const filteredItems = activeCategory === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeCategory);

  if (loading) {
    return (
      <>
        <SEOHead page="portfolio" />
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
          gap: 80px;
        }

        .portfolio-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: center;
          min-height: 400px;
        }

        .portfolio-item:nth-child(even) .portfolio-content {
          grid-template-columns: 1fr 1fr;
          direction: rtl;
        }

        .portfolio-item:nth-child(even) .portfolio-info {
          direction: ltr;
        }

        .portfolio-image {
          width: 100%;
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .portfolio-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 4px;
        }

        .portfolio-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
          padding: 24px 0;
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
            grid-template-columns: 1fr !important;
            gap: 32px;
            min-height: auto;
            direction: ltr !important;
          }

          .portfolio-image {
            height: 300px;
          }

          .portfolio-info {
            padding: 0;
            text-align: center;
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