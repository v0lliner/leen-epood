import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';
import { faqService } from '../utils/supabase/faq';

const FAQ = () => {
  const { t, i18n } = useTranslation();
  const [faqItems, setFaqItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback FAQ items if database is empty
  const fallbackItems = [
    {
      id: 'shipping',
      question: t('faq.shipping.question'),
      answer: t('faq.shipping.answer'),
      display_order: 1
    },
    {
      id: 'uniqueness',
      question: t('faq.uniqueness.question'),
      answer: t('faq.uniqueness.answer'),
      display_order: 2
    },
    {
      id: 'materials',
      question: t('faq.materials.question'),
      answer: t('faq.materials.answer'),
      display_order: 3
    },
    {
      id: 'care',
      question: t('faq.care.question'),
      answer: t('faq.care.answer'),
      display_order: 4
    },
    {
      id: 'custom',
      question: t('faq.custom.question'),
      answer: t('faq.custom.answer'),
      display_order: 5
    },
    {
      id: 'payment',
      question: t('faq.payment.question'),
      answer: t('faq.payment.answer'),
      display_order: 6
    },
    {
      id: 'time',
      question: t('faq.time.question'),
      answer: t('faq.time.answer'),
      display_order: 7
    }
  ];

  useEffect(() => {
    loadFAQItems();
  }, [i18n.language]);

  const loadFAQItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await faqService.getFAQItems(i18n.language);
      
      if (error) {
        console.warn('Failed to load FAQ items from database, using fallback data:', error);
        setFaqItems(fallbackItems);
      } else {
        // If no items in database, use fallback data
        setFaqItems(data.length > 0 ? data : fallbackItems);
      }
    } catch (err) {
      console.warn('Error loading FAQ items, using fallback data:', err);
      setFaqItems(fallbackItems);
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <>
        <SEOHead page="faq" />
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
      <SEOHead page="faq" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <h1 className="text-center">{t('faq.title')}</h1>
              <div className="faq-intro">
                <p>{t('faq.intro')}</p>
              </div>
            </FadeInSection>

            <div className="faq-content">
              {faqItems.map((item, index) => (
                <FadeInSection key={item.id || index} className="faq-item">
                  <div className="faq-question">
                    <h3>{item.question}</h3>
                  </div>
                  <div className="faq-answer">
                    {item.answer.split('\n\n').map((paragraph, pIndex) => (
                      <p key={pIndex}>{paragraph}</p>
                    ))}
                  </div>
                </FadeInSection>
              ))}
            </div>

            {/* Contact CTA */}
            <FadeInSection className="faq-contact-section">
              <div className="faq-contact-content">
                <h2>{t('faq.contact.title')}</h2>
                <p>{t('faq.contact.text')}</p>
                <div className="faq-contact-actions">
                  <Link to="/kontakt" className="link-with-arrow faq-contact-link" onClick={scrollToTop}>
                    {t('faq.contact.button')} <span className="arrow-wrapper">→</span>
                  </Link>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .faq-intro {
          text-align: center;
          max-width: 600px;
          margin: 48px auto 96px;
        }

        .faq-intro p {
          font-size: 1.25rem;
          line-height: 1.6;
          color: #666;
        }

        .faq-content {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        .faq-item {
          padding-bottom: 48px;
          border-bottom: 1px solid #f0f0f0;
        }

        .faq-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .faq-question {
          margin-bottom: 24px;
        }

        .faq-question h3 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          line-height: 1.3;
        }

        .faq-answer {
          line-height: 1.6;
          color: var(--color-text);
        }

        .faq-answer p {
          margin-bottom: 16px;
          font-size: 1.125rem;
        }

        .faq-answer p:last-child {
          margin-bottom: 0;
        }

        .faq-contact-section {
          margin-top: 128px;
          padding: 64px 48px;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .faq-contact-content {
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }

        .faq-contact-content h2 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 16px;
          font-size: 1.75rem;
        }

        .faq-contact-content p {
          margin-bottom: 32px;
          color: #666;
          font-size: 1rem;
          line-height: 1.6;
        }

        .faq-contact-actions {
          display: flex;
          justify-content: center;
        }

        .faq-contact-link {
          font-size: 1.125rem;
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-ultramarine);
          transition: opacity 0.2s ease;
        }

        .faq-contact-link:hover {
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .faq-intro {
            margin: 32px auto 64px;
          }

          .faq-intro p {
            font-size: 1.125rem;
          }

          .faq-content {
            gap: 32px;
          }

          .faq-item {
            padding-bottom: 32px;
          }

          .faq-question h3 {
            font-size: 1.25rem;
          }

          .faq-answer p {
            font-size: 1rem;
          }

          .faq-contact-section {
            margin-top: 96px;
            padding: 48px 32px;
          }

          .faq-contact-content h2 {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .faq-contact-section {
            padding: 32px 24px;
          }
        }
      `}</style>
    </>
  );
};

export default FAQ;