import Text from '../text-custom';
import {colors} from '../../themes/color';
import Button from '../button-custom';

interface IProps {
  top?: number;
  left?: number;
}
export const TickerDMT = (props: IProps) => {
  const {top = 11, left = 11} = props;
  return (
    <Text
      styleType="body_14_normal"
      title="DMT"
      customStyles={{
        background: colors.green_500,
        color: colors.white,
        borderRadius: '24px',
        width: 'fit-content',
        height: 'auto',
        lineHeight: 'normal',
        padding: '5px 10px',
        position: 'absolute',
        top: top,
        left: left,
      }}
    />
  );
};

export const TickerSpendable = (props: IProps) => {
  const {top = 11, left = 11} = props;
  return (
    <Button
      title="Spendable"
      styleType="primary"
      customStyles={{
        width: 'fit-content',
        height: 'auto',
        lineHeight: 'normal',
        padding: '5px 10px',
        fontSize: '14px',
        position: 'absolute',
        top: top,
        left: left,
      }}
    />
  );
};
