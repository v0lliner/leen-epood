import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const FAQ = () => {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const faqItems = [
    {
      id: 'shipping',
      question: t('faq.shipping.question'),
      answer: t('faq.shipping.answer')
    },
    {
      id: 'uniqueness',
      question: t('faq.uniqueness.question'),
      answer: t('faq.uniqueness.answer')
    },
    {
      id: 'materials',
      question: t('faq.materials.question'),
      answer: t('faq.materials.answer')
    },
    {
      id: 'care',
      question: t('faq.care.question'),
      answer: t('faq.care.answer')
    },
    {
      id: 'custom',
      question: t('faq.custom.question'),
      answer: t('faq.custom.answer')
    },
    {
      id: 'payment',
      question: t('faq.payment.question'),
      answer: t('faq.payment.answer')
    },
    {
      id: 'time',
      question: t('faq.time.question'),
      answer: t('faq.time.answer')
    }
  ];

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
                <FadeInSection key={item.id} className="faq-item">
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

            {/* Shop CTA */}
            <FadeInSection className="faq-cta-section">
              <div className="faq-cta-content">
                <p>{t('faq.cta_text')}</p>
                <Link to="/epood" className="link-with-arrow faq-cta" onClick={scrollToTop}>
                  {t('faq.cta_button')} <span className="arrow-wrapper">→</span>
                </Link>
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
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid var(--color-ultramarine);
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

        .faq-cta-section {
          margin-top: 96px;
          padding-top: 64px;
          border-top: 1px solid #f0f0f0;
        }

        .faq-cta-content {
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }

        .faq-cta-content p {
          margin-bottom: 24px;
          color: #666;
          font-size: 1rem;
        }

        .faq-cta {
          font-size: 1.125rem;
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-ultramarine);
          transition: opacity 0.2s ease;
        }

        .faq-cta:hover {
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

          .faq-cta-section {
            margin-top: 64px;
            padding-top: 48px;
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