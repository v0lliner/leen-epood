import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.warning('Vormi saatmine:', formData);
    // Here would be form submission logic
    alert('Sõnum saadetud! Leen vastab teile esimesel võimalusel.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <>
      <SEOHead page="contact" />
      <main>
        <section className="section-large">
          <div className="container">
            <FadeInSection>
              <h1 className="text-center">{t('contact.title')}</h1>
            </FadeInSection>

            <div className="contact-layout">
              <FadeInSection className="contact-form-section">
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label htmlFor="name">{t('contact.form.name')}</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">{t('contact.form.email')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="message">{t('contact.form.message')}</label>
                    <textarea
                      id="message"
                      name="message"
                      rows="6"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                    ></textarea>
                  </div>
                  
                  <button type="submit" className="btn btn-primary contact-submit">
                    {t('contact.form.send')} →
                  </button>
                </form>
              </FadeInSection>

              <FadeInSection className="contact-info-section">
                <div className="contact-info">
                  <h3>Kontaktandmed</h3>
                  <div className="info-item">
                    <strong>{t('contact.info.name')}</strong>
                  </div>
                  <div className="info-item">
                    {t('contact.info.address')}
                  </div>
                  <div className="info-item">
                    <a href="mailto:leen@leen.ee" className="btn btn-underline">{t('contact.info.email')}</a>
                  </div>
                  <div className="info-item">
                    <a href="tel:+372xxxxxxx" className="btn btn-underline">{t('contact.info.phone')}</a>
                  </div>
                </div>
              </FadeInSection>
            </div>

            <FadeInSection className="map-section">
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2034.1234567890123!2d24.7535947!3d59.0138901!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTnCsDAwJzUwLjAiTiAyNMKwNDUnMTMuMCJF!5e0!3m2!1sen!2see!4v1234567890123"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Keldrimäe talu asukoht"
                ></iframe>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <style jsx>{`
        .contact-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          margin-top: 64px;
        }

        .contact-form {
          max-width: 500px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--color-text);
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--color-ultramarine);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 120px;
        }

        .contact-submit {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
        }

        .contact-info h3 {
          font-family: var(--font-body);
          font-weight: 600;
          margin-bottom: 24px;
          color: var(--color-ultramarine);
        }

        .info-item {
          margin-bottom: 16px;
          line-height: 1.6;
        }

        .map-section {
          margin-top: 96px;
        }

        .map-container {
          border-radius: 4px;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .contact-layout {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .contact-form {
            max-width: none;
          }

          .map-section {
            margin-top: 64px;
          }
        }
      `}</style>
    </>
  );
};

export default Contact;