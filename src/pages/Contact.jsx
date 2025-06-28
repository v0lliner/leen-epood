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
    console.log('Vormi saatmine:', formData);
    // Here would be form submission logic
    alert(t('contact.form.success_message'));
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
                <div className="contact-form-container">
                  <h3>{t('contact.form.title')}</h3>
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
                        className="form-input"
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
                        className="form-input"
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
                        className="form-input"
                      ></textarea>
                    </div>
                    
                    <button type="submit" className="btn btn-primary contact-submit">
                      {t('contact.form.send')}
                    </button>
                  </form>
                </div>
              </FadeInSection>

              <FadeInSection className="contact-info-section">
                <div className="contact-info">
                  <h3>{t('contact.info.title')}</h3>
                  
                  <div className="contact-details">
                    <div className="contact-item">
                      <span className="contact-label">{t('contact.info.name_label')}</span>
                      <span className="contact-value">{t('contact.info.name')}</span>
                    </div>
                    
                    <div className="contact-item">
                      <span className="contact-label">{t('contact.info.location_label')}</span>
                      <span className="contact-value">{t('contact.info.address')}</span>
                    </div>
                    
                    <div className="contact-item">
                      <span className="contact-label">{t('contact.info.email_label')}</span>
                      <a href="mailto:leen@leen.ee" className="btn btn-underline contact-value">
                        {t('contact.info.email')}
                      </a>
                    </div>
                    
                    <div className="contact-item">
                      <span className="contact-label">{t('contact.info.phone_label')}</span>
                      <a href="tel:+372xxxxxxx" className="btn btn-underline contact-value">
                        {t('contact.info.phone')}
                      </a>
                    </div>
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
                  title={t('contact.map.title')}
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
          gap: 96px;
          align-items: start;
          margin-top: 64px;
        }

        .contact-form-container h3 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 500;
          margin-bottom: 32px;
          color: var(--color-ultramarine);
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
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          font-size: 0.9rem;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: var(--font-body);
          font-size: 1rem;
          transition: border-color 0.2s ease;
          background-color: var(--color-background);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-ultramarine);
        }

        .form-input[type="textarea"] {
          resize: vertical;
          min-height: 120px;
        }

        .contact-submit {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          margin-top: 8px;
        }

        .contact-info h3 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 500;
          margin-bottom: 32px;
          color: var(--color-ultramarine);
        }

        .contact-details {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .contact-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .contact-label {
          font-family: var(--font-heading);
          font-size: 0.9rem;
          font-weight: 500;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .contact-value {
          font-size: 1rem;
          line-height: 1.5;
          color: var(--color-text);
        }

        .map-section {
          margin-top: 128px;
          padding-top: 64px;
          border-top: 1px solid #f0f0f0;
        }

        .map-container {
          border-radius: 4px;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .contact-layout {
            grid-template-columns: 1fr;
            gap: 64px;
            margin-top: 48px;
          }

          .contact-form {
            max-width: none;
          }

          .contact-form-container h3,
          .contact-info h3 {
            font-size: 1.25rem;
            margin-bottom: 24px;
          }

          .contact-details {
            gap: 20px;
          }

          .map-section {
            margin-top: 96px;
            padding-top: 48px;
          }
        }
      `}</style>
    </>
  );
};

export default Contact;