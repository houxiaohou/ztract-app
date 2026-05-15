import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enBilling from '@/locales/en/billing.json';
import enProjects from '@/locales/en/projects.json';
import enDocuments from '@/locales/en/documents.json';
import enSchemas from '@/locales/en/schemas.json';
import enParsedData from '@/locales/en/parsed-data.json';
import zhCommon from '@/locales/zh/common.json';
import zhAuth from '@/locales/zh/auth.json';
import zhBilling from '@/locales/zh/billing.json';
import zhProjects from '@/locales/zh/projects.json';
import zhDocuments from '@/locales/zh/documents.json';
import zhSchemas from '@/locales/zh/schemas.json';
import zhParsedData from '@/locales/zh/parsed-data.json';

export const defaultNS = 'common';

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    billing: enBilling,
    projects: enProjects,
    documents: enDocuments,
    schemas: enSchemas,
    'parsed-data': enParsedData,
  },
  zh: {
    common: zhCommon,
    auth: zhAuth,
    billing: zhBilling,
    projects: zhProjects,
    documents: zhDocuments,
    schemas: zhSchemas,
    'parsed-data': zhParsedData,
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
    ns: [
      'common',
      'auth',
      'billing',
      'projects',
      'documents',
      'schemas',
      'parsed-data',
    ],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
