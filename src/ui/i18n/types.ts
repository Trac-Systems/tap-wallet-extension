export const DEFAULT_LANGUAGE = 'en-US' as const;

export const SUPPORTED_LANGUAGES = [
  'en-US',
  'zh-CN',
  'pt-BR',
  'es-ES',
  'de-DE',
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export type TranslationParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type TranslationDictionary = Record<string, string>;

export type Translate = (
  key: string,
  params?: TranslationParams,
) => string;

export type TranslatePlural = (
  key: string,
  count: number,
  params?: TranslationParams,
) => string;
