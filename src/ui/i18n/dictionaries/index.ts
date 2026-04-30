import {enUS} from './en-US';
import {deDE} from './de-DE';
import {esES} from './es-ES';
import {ptBR} from './pt-BR';
import {zhCN} from './zh-CN';
import type {Language, TranslationDictionary} from '../types';

export const dictionaries: Record<Language, TranslationDictionary> = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'pt-BR': ptBR,
  'es-ES': esES,
  'de-DE': deDE,
};
