import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './resources';

export type AppLanguage = 'ko' | 'en';

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'ko' || value === 'en';
}

export function getDeviceLanguage(): AppLanguage {
  const tag = getLocales()[0]?.languageTag.toLowerCase();
  return tag?.startsWith('ko') ? 'ko' : 'en';
}

export const i18n = createInstance();
void i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['ko', 'en'],
  interpolation: { escapeValue: false },
  initAsync: false,
  react: { useSuspense: false },
});
