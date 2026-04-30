import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {getStoredLanguage, setStoredLanguage} from './storage';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type Language,
  type Translate,
  type TranslatePlural,
  type TranslationParams,
} from './types';
import {translate, translatePlural} from './translator';

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  supportedLanguages: readonly Language[];
  languageLabels: Record<Language, string>;
  t: Translate;
  tp: TranslatePlural;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export const I18nProvider = ({
  children,
  initialLanguage,
}: I18nProviderProps) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    const storedLanguage = getStoredLanguage();
    setLanguageState(storedLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    setStoredLanguage(nextLanguage);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) =>
      translate(language, key, params),
    [language],
  );

  const tp = useCallback(
    (key: string, count: number, params?: TranslationParams) =>
      translatePlural(language, key, count, params),
    [language],
  );

  const languageLabels = useMemo(
    () =>
      SUPPORTED_LANGUAGES.reduce(
        (labels, supportedLanguage) => ({
          ...labels,
          [supportedLanguage]: translate(
            language,
            `language.${supportedLanguage}`,
          ),
        }),
        {} as Record<Language, string>,
      ),
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES,
      languageLabels,
      t,
      tp,
    }),
    [language, languageLabels, setLanguage, t, tp],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
};

export const useOptionalI18n = () => useContext(I18nContext);

export const getDefaultLanguage = () => DEFAULT_LANGUAGE;
