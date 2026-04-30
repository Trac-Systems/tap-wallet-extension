import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type Language,
} from './types';

const LANGUAGE_STORAGE_KEY = 'tap-wallet-language';

export const isSupportedLanguage = (value: unknown): value is Language => {
  return (
    typeof value === 'string' &&
    SUPPORTED_LANGUAGES.includes(value as Language)
  );
};

export const getStoredLanguage = (): Language => {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  try {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(storedLanguage)
      ? storedLanguage
      : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

export const setStoredLanguage = (language: Language) => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Language persistence is best-effort only.
  }
};
