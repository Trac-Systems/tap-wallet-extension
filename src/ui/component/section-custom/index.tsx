import {copyToClipboard} from '../../helper';
import Box from '../box-custom';
import Text from '../text-custom';
import {useCustomToast} from '../toast-custom';

export function Section({
  value,
  title,
  link,
}: {
  value: string | number;
  title: string;
  link?: string;
}) {
  const {showToast} = useCustomToast();
  return (
    <Box style={{overflow: 'hidden'}}>
      <Text
        title={title}
        styleType="body_14_normal"
        customStyles={{color: 'white'}}
      />
      <Text
        title={String(value)}
        styleType={link ? 'link' : 'body_14_normal'}
        customStyles={{maxWidth: '100%', cursor: 'pointer'}}
        onClick={() => {
          if (link) {
            window.open(link);
          } else {
            copyToClipboard(value).then(() => {
              showToast({
                type: 'copied',
                title: 'Copied',
              });
            });
          }
        }}
      />
    </Box>
  );
}
