import {CSSProperties, useState} from 'react';
import {toast, ToastPosition, ToastOptions} from 'react-toastify';
import {colors} from '../../themes/color';
import {SVG} from '../../svg';
import Text from '../text-custom';
import {useOptionalI18n} from '../../i18n/context';
import type {TranslationParams} from '../../i18n/types';

interface UseCustomToastProps {
  type: 'error' | 'success' | 'copied';
  title?: string;
  titleKey?: string;
  titleParams?: TranslationParams;
  position?: ToastPosition;
  duration?: number;
}
const BaseCssToast = {
  alignSelf: 'end',
  padding: '16px 12px',
  borderRadius: '6px',
  borderBottomWidth: 6,
  backgroundColor: colors.black_2,
} as CSSProperties;

const typeProperties = {
  success: {
    ...BaseCssToast,
    borderBottom: `6px solid ${colors.green_700}`,
  } as CSSProperties,

  error: {
    ...BaseCssToast,
    borderBottom: `6px solid ${colors.red_700}`,
  } as CSSProperties,

  copied: {
    ...BaseCssToast,
    backgroundColor: 'white',
    borderBottom: 'none',
  } as CSSProperties,
};

export const useCustomToast = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const i18n = useOptionalI18n();
  const showToast = ({
    type = 'success',
    title,
    titleKey,
    titleParams,
    position = 'bottom-center',
  }: UseCustomToastProps) => {
    if (isVisible) return;
    const displayTitle =
      titleKey && i18n ? i18n.t(titleKey, titleParams) : title ?? '';

    setIsVisible(true);
    const toastContent = (
      <div
        className="toast"
        style={{
          ...typeProperties[type],
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
        <Text
          title={displayTitle}
          customStyles={{
            color: type === 'copied' ? colors.green_700 : colors.white,
          }}
          styleType="body_16_bold"
        />
        {type === 'copied' && <SVG.CopiedIcon />}
      </div>
    );

    const toastOptions: ToastOptions<unknown> = {
      position,
      onClose: () => setIsVisible(false),
    };

    toast(toastContent, toastOptions);
  };

  return {showToast, isVisible};
};
