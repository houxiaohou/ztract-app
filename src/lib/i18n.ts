import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import zhCommon from '@/locales/zh/common.json';
import zhAuth from '@/locales/zh/auth.json';

export const defaultNS = 'common';

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
  },
  zh: {
    common: zhCommon,
    auth: zhAuth,
  },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh'],
    defaultNS,
    ns: ['common', 'auth'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
