import {useEffect, useState} from 'react';
import {SVG} from '@/src/ui/svg';
import {UX} from '..';
import {colors} from '@/src/ui/themes/color';

const RefreshButton = ({buttonOnPress}) => {
  let timeout: NodeJS.Timeout | null = null;
  const [leftTime, setLeftTime] = useState(0);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    return () => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
    };
  }, [timeout]);

  const wait = (seconds: number) => {
    if (seconds > 0) {
      setLeftTime(seconds);
      timeout = setTimeout(() => {
        wait(seconds - 1);
      }, 1000);
      return;
    }
    setDisabled(false);
  };

  return (
    <UX.Box
      layout="row"
      spacing="xs"
      style={{alignItems: 'center'}}
      onClick={() => {
        if (disabled) {
          return;
        }
        setDisabled(true);
        wait(5);
        buttonOnPress();
      }}>
      <SVG.RefreshIcon width={16} height={16} />
      <UX.Text
        title={disabled ? `${leftTime} secs` : 'refresh'}
        styleType="body_16_bold"
        customStyles={{color: colors.white}}
      />
    </UX.Box>
  );
};

export default RefreshButton;
