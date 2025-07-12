import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import et from '../translations/et.json';
import en from '../translations/en.json';

const resources = {
  et: { translation: et },
  en: { translation: en }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'et',
    fallbackLng: 'et',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;