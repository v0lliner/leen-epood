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

  // Custom Google Maps styling that matches the website's aesthetic
  const mapStyles = [
    {
      "featureType": "all",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#f5f5f5"
        }
      ]
    },
    {
      "featureType": "all",
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "all",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#111111"
        },
        {
          "saturation": 36
        },
        {
          "lightness": 40
        }
      ]
    },
    {
      "featureType": "all",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "visibility": "on"
        },
        {
          "color": "#ffffff"
        },
        {
          "lightness": 16
        }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#fefefe"
        },
        {
          "lightness": 20
        }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#fefefe"
        },
        {
          "lightness": 17
        },
        {
          "weight": 1.2
        }
      ]
    },
    {
      "featureType": "administrative.country",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#2f3e9c"
        }
      ]
    },
    {
      "featureType": "administrative.locality",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#2f3e9c"
        }
      ]
    },
    {
      "featureType": "administrative.neighborhood",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#111111"
        }
      ]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#f5f5f5"
        },
        {
          "lightness": 20
        }
      ]
    },
    {
      "featureType": "landscape.natural",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#e4c9c1"
        },
        {
          "saturation": -20
        },
        {
          "lightness": 20
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#f5f5f5"
        },
        {
          "lightness": 21
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#e4c9c1"
        },
        {
          "saturation": -10
        },
        {
          "lightness": 30
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#ffffff"
        },
        {
          "lightness": 17
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#ffffff"
        },
        {
          "lightness": 29
        },
        {
          "weight": 0.2
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#ffffff"
        },
        {
          "lightness": 18
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#ffffff"
        },
        {
          "lightness": 16
        }
      ]
    },
    {
      "featureType": "transit",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#f2f2f2"
        },
        {
          "lightness": 19
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#2f3e9c"
        },
        {
          "saturation": -20
        },
        {
          "lightness": 40
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
          "saturation": -10
        },
        {
          "lightness": 60
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
                    
                    <button type="submit" className="link-with-arrow contact-submit-btn">
                      {t('contact.form.send')} <span className="arrow-wrapper">→</span>
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
          border-radius: 4px;
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