import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { portfolioItemService } from '../utils/supabase/portfolioItems';
import { transformImage, getImageSizeForContext } from '../utils/supabase/imageTransform';

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
      image: '',
      display_order: 1
    },
    {
      id: 2,
      category: 'clothing',
      title: t('portfolio.items.linen_dress.title'),
      technique: t('portfolio.items.linen_dress.technique'),
      dimensions: t('portfolio.items.linen_dress.size'),
      year: 2023,
      image: '',
      display_order: 2
    },
    {
      id: 3,
      category: 'ceramics',
      title: t('portfolio.items.coffee_cups.title'),
      technique: t('portfolio.items.coffee_cups.technique'),
      dimensions: t('portfolio.items.coffee_cups.dimensions'),
      year: 2022,
      image: '',
      display_order: 3
    },
    {
      id: 4,
      category: 'clothing',
      title: t('portfolio.items.wool_vest.title'),
      technique: t('portfolio.items.wool_vest.technique'),
      dimensions: t('portfolio.items.wool_vest.size'),
      year: 2023,
      image: '',
      display_order: 4
    },
    {
      id: 5,
      category: 'other',
      title: t('portfolio.items.mixed_plate.title'),
      technique: t('portfolio.items.mixed_plate.technique'),
      dimensions: t('portfolio.items.mixed_plate.dimensions'),
      year: 2024,
      image: '',
      display_order: 5
    },
    {
      id: 6,
      category: 'other',
      title: t('portfolio.items.texture_wall.title'),
      technique: t('portfolio.items.texture_wall.technique'),
      dimensions: t('portfolio.items.texture_wall.dimensions'),
      year: 2024,
      image: '',
      display_order: 6
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

  // Helper function to determine if we're on mobile
  const isMobile = () => window.innerWidth <= 768;

  // Smart image sizing function
  const handleImageLoad = (e) => {
    const img = e.target;
    const isLandscape = img.naturalWidth > img.naturalHeight;
    const mobile = isMobile();
    
    if (mobile) {
      // Mobile: Fit to screen width, maintain aspect ratio, NO CROPPING
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.maxWidth = '100%';
      img.style.maxHeight = 'none'; // Remove height constraint
      img.style.objectFit = 'contain'; // Changed from 'cover' to 'contain'
    } else {
      // Desktop: Pikim külg alati 500px
      if (isLandscape) {
        img.style.width = '500px';
        img.style.height = 'auto';
        img.style.maxWidth = '500px';
        img.style.maxHeight = 'none';
        img.style.objectFit = 'cover';
      } else {
        img.style.height = '500px';
        img.style.width = 'auto';
        img.style.maxHeight = '500px';
        img.style.maxWidth = 'none';
        img.style.objectFit = 'cover';
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to format technique text with line breaks
  const formatTechniqueText = (technique) => {
    if (!technique) return '';
    
    return technique.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < technique.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  // Get optimized image URL
  const getOptimizedImageUrl = (imageUrl) => {
    return transformImage(
      imageUrl,
      getImageSizeForContext('portfolio', isMobile())
    );
  };

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
                  <div className={`portfolio-content ${index % 2 === 1 ? 'reverse' : ''}`}>
                    <div className="portfolio-image-container">
                      <div className="portfolio-image">
                        <img 
                          src={getOptimizedImageUrl(item.image)} 
                          alt={item.title}
                          onLoad={handleImageLoad}
                          loading={index < 2 ? 'eager' : 'lazy'}
                        />
                      </div>
                    </div>
                    <div className="portfolio-info">
                      <div className="portfolio-meta">
                        <span className="portfolio-year">{item.year}</span>
                        <span className="portfolio-category">
                          {t(`portfolio.category_labels.${item.category}`)}
                        </span>
                      </div>
                      <h3>{item.title}</h3>
                      <p className="technique">{formatTechniqueText(item.technique)}</p>
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
                <Link to="/epood" className="link-with-arrow portfolio-cta" onClick={scrollToTop}>
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

        .portfolio-content {
          display: flex;
          gap: 64px;
          align-items: flex-start;
        }

        .portfolio-content.reverse {
          flex-direction: row-reverse;
        }

        /* Dynamic container that adapts to image size */
        .portfolio-image-container {
          flex: 0 0 auto;
          display: flex;
          overflow: hidden;
        }

        /* Align image to the text side */
        .portfolio-content .portfolio-image-container {
          justify-content: flex-end; /* Align to right (towards text) */
        }

        .portfolio-content.reverse .portfolio-image-container {
          justify-content: flex-start; /* Align to left (towards text) */
        }

        .portfolio-image {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .portfolio-image img {
          border-radius: 4px;
          display: block;
          /* Initial constraints - will be overridden by onLoad */
          max-width: 500px;
          max-height: 500px;
          width: auto;
          height: auto;
        }

        .portfolio-info {
          flex: 1;
          min-width: 0; /* Prevents flex item from overflowing */
        }

        .portfolio-content.reverse .portfolio-info {
          text-align: right;
        }

        .portfolio-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          font-size: 0.9rem;
          color: #666;
        }

        .portfolio-content.reverse .portfolio-meta {
          justify-content: flex-end;
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

          /* Mobile: Force column layout and center everything */
          .portfolio-content,
          .portfolio-content.reverse {
            flex-direction: column !important;
            gap: 24px;
            align-items: center;
          }

          /* Mobile: Center image container */
          .portfolio-image-container {
            justify-content: center !important;
            width: 100%;
          }

          /* Mobile: Ensure image fits screen */
          .portfolio-image {
            width: 100%;
            max-width: 100%;
          }

          .portfolio-image img {
            /* Mobile: NO CROPPING - fit to width, maintain aspect ratio */
            max-width: 100% !important;
            max-height: none !important;
            width: 100% !important;
            height: auto !important;
            object-fit: contain !important; /* This prevents cropping */
          }

          /* Mobile: Center all text */
          .portfolio-info,
          .portfolio-content.reverse .portfolio-info {
            text-align: center;
            width: 100%;
          }

          /* Mobile: Center meta information */
          .portfolio-meta,
          .portfolio-content.reverse .portfolio-meta {
            justify-content: center;
            margin-bottom: 12px;
          }

          .portfolio-info h3 {
            font-size: 1.5rem;
          }

          .portfolio-cta-section {
            margin-top: 96px;
            padding-top: 48px;
          }
        }

        @media (max-width: 480px) {
          .portfolio-content {
            gap: 20px;
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