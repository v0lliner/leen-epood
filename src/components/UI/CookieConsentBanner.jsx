import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const CookieConsentBanner = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true and disabled
    analytics: true,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consentStatus = localStorage.getItem('cookie_consent');
    
    if (!consentStatus) {
      // If no consent status found, show the banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // If consent exists, parse the preferences
      try {
        const savedPreferences = JSON.parse(consentStatus);
        if (savedPreferences && typeof savedPreferences === 'object') {
          setPreferences(prev => ({
            ...prev,
            ...savedPreferences
          }));
        }
      } catch (error) {
        console.error('Error parsing saved cookie preferences:', error);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    
    localStorage.setItem('cookie_consent', JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setIsVisible(false);
  };

  const handleDecline = () => {
    const allDeclined = {
      necessary: true, // Necessary cookies are always enabled
      analytics: false,
      marketing: false
    };
    
    localStorage.setItem('cookie_consent', JSON.stringify(allDeclined));
    setPreferences(allDeclined);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie_consent', JSON.stringify(preferences));
    setIsVisible(false);
    setShowPreferences(false);
  };

  const handlePreferenceChange = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleBackToMain = () => {
    setShowPreferences(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="cookie-banner">
      {!showPreferences ? (
        <div className="cookie-content">
          <div className="cookie-text">
            <h3>{t('cookies.title')}</h3>
            <p>{t('cookies.description')}</p>
          </div>
          <div className="cookie-actions">
            <button 
              onClick={() => setShowPreferences(true)}
              className="cookie-btn cookie-btn-secondary"
            >
              {t('cookies.manage')}
            </button>
            <button 
              onClick={handleDecline}
              className="cookie-btn cookie-btn-secondary"
            >
              {t('cookies.decline')}
            </button>
            <button 
              onClick={handleAcceptAll}
              className="cookie-btn cookie-btn-primary"
            >
              {t('cookies.accept')}
            </button>
          </div>
        </div>
      ) : (
        <div className="cookie-preferences">
          <div className="preferences-header">
            <h3>{t('cookies.preferences.title')}</h3>
            <button 
              onClick={handleBackToMain}
              className="back-button"
              aria-label="Tagasi"
            >
              ← Tagasi
            </button>
          </div>
          
          <div className="preferences-list">
            <div className="preference-item">
              <div className="preference-header">
                <label className="preference-label">
                  <input
                    type="checkbox"
                    checked={preferences.necessary}
                    disabled={true}
                    className="preference-checkbox"
                  />
                  <span className="preference-title">{t('cookies.preferences.necessary.title')}</span>
                </label>
              </div>
              <p className="preference-description">{t('cookies.preferences.necessary.description')}</p>
            </div>
            
            <div className="preference-item">
              <div className="preference-header">
                <label className="preference-label">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={() => handlePreferenceChange('analytics')}
                    className="preference-checkbox"
                  />
                  <span className="preference-title">{t('cookies.preferences.analytics.title')}</span>
                </label>
              </div>
              <p className="preference-description">{t('cookies.preferences.analytics.description')}</p>
            </div>
            
            <div className="preference-item">
              <div className="preference-header">
                <label className="preference-label">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={() => handlePreferenceChange('marketing')}
                    className="preference-checkbox"
                  />
                  <span className="preference-title">{t('cookies.preferences.marketing.title')}</span>
                </label>
              </div>
              <p className="preference-description">{t('cookies.preferences.marketing.description')}</p>
            </div>
          </div>
          
          <div className="preferences-actions">
            <Link 
              to="/privaatsuspoliitika" 
              className="cookie-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('cookies.more_info')}
            </Link>
            <button 
              onClick={handleSavePreferences}
              className="cookie-btn cookie-btn-primary"
            >
              {t('cookies.preferences.save')}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .cookie-banner {
          position: fixed;
          bottom: 24px;
          left: 24px;
          right: 24px;
          max-width: 500px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          padding: 24px;
          animation: slide-up 0.5s ease;
        }

        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .cookie-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cookie-text h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin-bottom: 12px;
        }

        .cookie-text p {
          font-size: 0.95rem;
          line-height: 1.5;
          color: var(--color-text);
          margin: 0;
        }

        .cookie-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: flex-end;
        }

        .cookie-btn {
          padding: 10px 16px;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .cookie-btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .cookie-btn-primary:hover {
          opacity: 0.9;
        }

        .cookie-btn-secondary {
          background-color: #f0f0f0;
          color: var(--color-text);
        }

        .cookie-btn-secondary:hover {
          background-color: #e0e0e0;
        }

        /* Preferences panel styles */
        .cookie-preferences {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .preferences-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .preferences-header h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--color-ultramarine);
          margin: 0;
        }

        .back-button {
          background: none;
          border: none;
          color: var(--color-ultramarine);
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .back-button:hover {
          background-color: rgba(47, 62, 156, 0.1);
        }

        .preferences-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .preference-item {
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 16px;
        }

        .preference-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .preference-header {
          margin-bottom: 8px;
        }

        .preference-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .preference-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--color-ultramarine);
        }

        .preference-title {
          font-weight: 500;
          font-size: 1rem;
        }

        .preference-description {
          font-size: 0.85rem;
          color: #666;
          margin: 0;
          padding-left: 26px;
        }

        .preferences-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }

        .cookie-link {
          color: var(--color-ultramarine);
          text-decoration: underline;
          font-size: 0.9rem;
          transition: opacity 0.2s ease;
        }

        .cookie-link:hover {
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .cookie-banner {
            bottom: 0;
            left: 0;
            right: 0;
            max-width: 100%;
            border-radius: 8px 8px 0 0;
            padding: 20px;
          }

          .cookie-actions {
            flex-direction: column;
            width: 100%;
          }

          .cookie-btn {
            width: 100%;
            text-align: center;
          }

          .preferences-actions {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .cookie-link {
            text-align: center;
            margin-bottom: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default CookieConsentBanner;