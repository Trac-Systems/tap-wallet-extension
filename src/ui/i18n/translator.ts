import {dictionaries} from './dictionaries';
import {
  DEFAULT_LANGUAGE,
  type Language,
  type TranslationParams,
} from './types';

const interpolate = (template: string, params?: TranslationParams) => {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined || value === null ? match : String(value);
  });
};

export const translate = (
  language: Language,
  key: string,
  params?: TranslationParams,
) => {
  const template =
    dictionaries[language]?.[key] ??
    dictionaries[DEFAULT_LANGUAGE]?.[key] ??
    key;

  return interpolate(template, params);
};

export const translatePlural = (
  language: Language,
  key: string,
  count: number,
  params?: TranslationParams,
) => {
  const suffix = count === 1 ? 'one' : 'other';
  const pluralKey = `${key}.${suffix}`;
  const fallbackPluralKey = `${key}.other`;
  const nextParams = {
    count,
    ...params,
  };
  const template =
    dictionaries[language]?.[pluralKey] ??
    dictionaries[language]?.[fallbackPluralKey] ??
    dictionaries[DEFAULT_LANGUAGE]?.[pluralKey] ??
    dictionaries[DEFAULT_LANGUAGE]?.[fallbackPluralKey] ??
    dictionaries[language]?.[key] ??
    dictionaries[DEFAULT_LANGUAGE]?.[key] ??
    key;

  return interpolate(template, nextParams);
};
