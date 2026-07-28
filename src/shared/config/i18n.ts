import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import viCommon from '@/locales/vi/common.json';
import enCommon from '@/locales/en/common.json';
import viVideoStudio from '@/locales/vi/video-studio.json';
import enVideoStudio from '@/locales/en/video-studio.json';

void i18n.use(initReactI18next).init({
  resources: {
    vi: { common: viCommon, 'video-studio': viVideoStudio },
    en: { common: enCommon, 'video-studio': enVideoStudio },
  },
  lng: 'vi',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
