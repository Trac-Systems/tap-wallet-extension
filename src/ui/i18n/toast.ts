import {useCallback} from 'react';
import type {ToastPosition} from 'react-toastify';
import {useCustomToast} from '../component/toast-custom';
import {useI18n} from './context';
import {translate} from './translator';
import type {Language, TranslationParams} from './types';

interface ShowTranslatedToastProps {
  type: 'error' | 'success' | 'copied';
  titleKey: string;
  titleParams?: TranslationParams;
  language?: Language;
  position?: ToastPosition;
}

export const useTranslatedToast = () => {
  const {t} = useI18n();
  const {showToast, isVisible} = useCustomToast();

  const showTranslatedToast = useCallback(
    ({
      type,
      titleKey,
      titleParams,
      language,
      position = 'bottom-center',
    }: ShowTranslatedToastProps) => {
      showToast({
        type,
        title: language
          ? translate(language, titleKey, titleParams)
          : t(titleKey, titleParams),
        position,
      });
    },
    [showToast, t],
  );

  return {showTranslatedToast, isVisible};
};
