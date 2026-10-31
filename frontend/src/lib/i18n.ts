import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { authApi } from './api';

import idTranslation from '../locales/id.json';
import enTranslation from '../locales/en.json';

const getSavedOrBrowserLang = (): string => {
  if (typeof window === 'undefined') return 'id';
  const saved = localStorage.getItem('cde_language');
  if (saved === 'id' || saved === 'en') return saved;
  const nav = navigator.language?.toLowerCase() || '';
  if (nav.startsWith('en')) return 'en';
  return 'id';
};

const initialLang = getSavedOrBrowserLang();
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      id: { translation: idTranslation },
      en: { translation: enTranslation },
    },
    lng: initialLang,
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'cde_language',
      caches: ['localStorage'],
    },
  });

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
    try {
      localStorage.setItem('cde_language', lng);
      if (localStorage.getItem('cde_auth_token')) {
        authApi.updateProfile({ locale: lng }).catch(() => {});
      }
    } catch {}
  }
});

export default i18n;

