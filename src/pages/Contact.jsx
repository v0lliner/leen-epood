import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import SEOHead from '../components/Layout/SEOHead';
import FadeInSection from '../components/UI/FadeInSection';

const Contact = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Validate form data
      if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        throw new Error('Palun täitke kõik kohustuslikud väljad');
      }
      
      // Send form data to PHP endpoint
      const response = await fetch('/php/mailer.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      // Parse response
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Sõnumi saatmine ebaõnnestus');
      }
      
      // Success
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'Sõnumi saatmine ebaõnnestus');
    } finally {
      setLoading(false);
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
                  </div>
                </div>
              </FadeInSection>
            </div>
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
        
        .contact-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #fcc;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }
        
        .success-message {
          text-align: center;
          padding: 32px 0;
        }
        
        .success-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background-color: #d4edda;
          color: #155724;
          border-radius: 50%;
          font-size: 32px;
          margin-bottom: 16px;
        }
        
        .success-message h4 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 16px;
          font-size: 1.25rem;
        }
        
        .success-message p {
          color: #666;
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
          
          .success-message {
            padding: 24px 0;
          }
          
          .success-icon {
            width: 56px;
            height: 56px;
            font-size: 28px;
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