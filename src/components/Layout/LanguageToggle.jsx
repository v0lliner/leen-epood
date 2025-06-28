import { useTranslation } from 'react-i18next';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'et' ? 'en' : 'et';
    i18n.changeLanguage(newLang);
  };

  return (
    <button onClick={toggleLanguage} className="btn btn-underline">
      {i18n.language === 'et' ? 'EN' : 'ET'}
    </button>
  );
};

export default LanguageToggle;