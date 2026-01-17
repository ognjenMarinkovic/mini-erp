import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import sr from '@/locales/sr.json';
import en from '@/locales/en.json';

// Proveri localStorage za sačuvan jezik, inače koristi engleski kao default
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
const defaultLanguage = savedLanguage && (savedLanguage === 'sr' || savedLanguage === 'en') ? savedLanguage : 'en';

i18n.use(initReactI18next).init({
  resources: {
    sr: { translation: sr },
    en: { translation: en },
  },
  lng: defaultLanguage, // default jezik - engleski
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
