import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setSubmitError('');
    setSubmitSuccess(false);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/php/mailer.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setSubmitError(data.message || 'Sõnumi saatmine ebaõnnestus. Palun proovige hiljem uuesti.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('Võrguühenduse viga. Palun proovige hiljem uuesti.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom Google Maps styling that matches the website's aesthetic
  const mapStyles = [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#f5f5f5"
        }
      ]
    },
    {
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#616161"
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#f5f5f5"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#bdbdbd"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#eeeeee"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#e5e5e5"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#9e9e9e"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#ffffff"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#dadada"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#616161"
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#9e9e9e"
        }
      ]
    },
    {
      "featureType": "transit.line",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#e5e5e5"
        }
      ]
    },
    {
      "featureType": "transit.station",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#eeeeee"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#c9c9c9"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#2f3e9c"
        },
        {
          "lightness": 75
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#9e9e9e"
        }
      ]
    }
  ];

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
                      <label htmlFor="phone">{t('contact.form.phone')}</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="+372 5xxx xxxx"
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
                      
                      {submitError && (
                        <div className="form-error">
                          {submitError}
                        </div>
                      )}
                      
                      {submitSuccess && (
                        <div className="form-success">
                          {t('contact.form.success_message')}
                        </div>
                      )}
                    </div>
                    
                    <button 
                      type="submit" 
                      className="link-with-arrow contact-submit-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saadan...' : t('contact.form.send')} <span className="arrow-wrapper">→</span>
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
                      <a href="tel:+37253801413" className="btn btn-underline contact-value">
                        {t('contact.info.phone')}
                      </a>
                    </div>
                    
                    <div className="contact-item">
                      <span className="contact-label">{t('contact.info.social_label')}</span>
                      <div className="social-links">
                        <a href="https://www.facebook.com/leenvaranen" target="_blank" rel="noopener noreferrer" className="btn btn-underline social-link">
                          {t('footer.facebook')}
                        </a>
                        <span className="social-separator">·</span>
                        <a href="https://www.instagram.com/leen.tailor/" target="_blank" rel="noopener noreferrer" className="btn btn-underline social-link">
                          {t('footer.instagram')}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            </div>

            <FadeInSection className="map-section">
              <div className="map-container">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBJNslJaIJX4bXJuwD03zHhCiLmWCzQuZ8&q=Jõeääre,Märjamaa,Rapla+vald,Estonia&zoom=14&maptype=roadmap`}
                  width="100%"
                  height="400"
                  style={{ 
                    border: 0,
                    borderRadius: '8px', 
                    boxShadow: '0 4px 12px rgba(47, 62, 156, 0.1)',
                    filter: 'contrast(1.1) saturate(0.8) brightness(1.05)'
                  }}
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

      <style>{`
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
          width: 100%;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-ultramarine);
        }

        .form-input[type="textarea"] {
          resize: vertical;
          min-height: 120px;
        }

        .contact-submit-btn {
          font-size: 1.125rem;
          margin-top: 8px;
          background: none;
          border: none;
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-ultramarine);
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 12px 0;
        }

        .contact-submit-btn:hover {
          opacity: 0.8;
        }

        .form-error {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #fcc;
          margin-top: 16px;
          font-size: 0.9rem;
        }

        .form-success {
          background-color: #efe;
          color: #363;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #cfc;
          margin-top: 16px;
          font-size: 0.9rem;
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

        .social-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .social-link {
          color: var(--color-ultramarine);
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .social-link:hover {
          opacity: 0.7;
        }

        .social-separator {
          color: #666;
        }

        .map-section {
          margin-top: 128px;
          padding-top: 64px;
          border-top: 1px solid #f0f0f0;
        }

        .map-container {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(47, 62, 156, 0.1);
          border: 1px solid rgba(47, 62, 156, 0.1);
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

          .form-input {
            padding: 10px 14px;
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