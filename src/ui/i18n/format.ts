import {useCallback} from 'react';
import {useI18n} from './context';
import type {Language} from './types';

export const getIntlLocale = (language: Language) => language;

export const formatLocaleNumber = (
  language: Language,
  value: number | string,
  options?: Intl.NumberFormatOptions,
) => {
  const numericValue = typeof value === 'string' ? Number(value) : value;

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat(getIntlLocale(language), options).format(
    numericValue,
  );
};

export const formatLocaleDate = (
  language: Language,
  value: Date | number | string,
  options?: Intl.DateTimeFormatOptions,
) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(getIntlLocale(language), options).format(date);
};

export const useLocaleFormat = () => {
  const {language} = useI18n();

  const formatNumber = useCallback(
    (value: number | string, options?: Intl.NumberFormatOptions) =>
      formatLocaleNumber(language, value, options),
    [language],
  );

  const formatDate = useCallback(
    (value: Date | number | string, options?: Intl.DateTimeFormatOptions) =>
      formatLocaleDate(language, value, options),
    [language],
  );

  return {
    formatDate,
    formatNumber,
    locale: getIntlLocale(language),
  };
};
