import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import idTranslation from '../locales/id.json';
import enTranslation from '../locales/en.json';

export const isUserAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(localStorage.getItem('cde_auth_token'));
  } catch {
    return false;
  }
};

export const getEffectiveLanguage = (): 'id' | 'en' => {
  if (typeof window === 'undefined') return 'id';
  try {
    // TAHAP V9: Bahasa efektif untuk tamu selalu Indonesia (id) tanpa menimpa nilai tersimpan.
    // Pilihan tersimpan 'cde_language' dihormati HANYA jika pengguna sudah login.
    if (isUserAuthenticated()) {
      const saved = localStorage.getItem('cde_language');
      if (saved === 'en' || saved === 'id') return saved;
    }
  } catch {}
  return 'id';
};

const isHydratingPrerenderedDom = (): boolean => {
  if (typeof document === 'undefined') return false;
  const rootEl = document.getElementById('root');
  return Boolean(rootEl && rootEl.hasAttribute('data-prerendered-path') && rootEl.hasChildNodes());
};

const initialLang = isHydratingPrerenderedDom() ? 'id' : getEffectiveLanguage();
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
}

export function syncHydratedLanguage(): void {
  const preferred = getEffectiveLanguage();
  if (preferred !== i18n.language) {
    void i18n.changeLanguage(preferred);
  }
}

i18n
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
  });

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
});

export default i18n;
