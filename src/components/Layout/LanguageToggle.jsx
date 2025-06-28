import { useTranslation } from 'react-i18next';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'et' ? 'en' : 'et';
    i18n.changeLanguage(newLang);
  };

  return (
    <button onClick={toggleLanguage} className="language-toggle">
      {i18n.language === 'et' ? 'EN' : 'ET'}
      
      <style jsx>{`
        .language-toggle {
          padding: 8px 16px;
          border: 1px solid var(--color-ultramarine);
          color: var(--color-ultramarine);
          border-radius: 4px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .language-toggle:hover {
          background-color: var(--color-ultramarine);
          color: white;
        }
      `}</style>
    </button>
  );
};

export default LanguageToggle;