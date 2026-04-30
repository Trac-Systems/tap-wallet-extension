import {copyToClipboard} from '../../helper';
import {useTranslatedToast} from '../../i18n/toast';
import type {TranslationParams} from '../../i18n/types';
import Box from '../box-custom';
import Text from '../text-custom';

export function Section({
  value,
  title,
  titleKey,
  titleParams,
  link,
}: {
  value: string | number;
  title?: string;
  titleKey?: string;
  titleParams?: TranslationParams;
  link?: string;
}) {
  const {showTranslatedToast} = useTranslatedToast();
  return (
    <Box style={{overflow: 'hidden'}}>
      <Text
        title={title}
        titleKey={titleKey}
        titleParams={titleParams}
        styleType="body_14_normal"
        customStyles={{color: 'white'}}
      />
      <Text
        title={String(value)}
        styleType={link ? 'link' : 'body_14_normal'}
        customStyles={{maxWidth: '100%', cursor: 'pointer', wordBreak: 'break-all'}}
        onClick={() => {
          if (link) {
            window.open(link);
          } else {
            copyToClipboard(value).then(() => {
              showTranslatedToast({
                type: 'copied',
                titleKey: 'common.copied',
              });
            });
          }
        }}
      />
    </Box>
  );
}
