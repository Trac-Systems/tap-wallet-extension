import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';

interface SpendableContainRuneAttentionModalProps {
  onCancel?: () => void;
  visible: boolean;
  inscriptionNum: string;
}
const SpendableContainRuneAttentionModal = (
  props: SpendableContainRuneAttentionModalProps,
) => {
  const {onCancel, visible, inscriptionNum} = props;

  return (
    <UX.CustomModal isOpen={visible} onClose={onCancel}>
      <UX.Box spacing="xs">
        {/* Close Icon */}
        <UX.Box onClick={onCancel} layout="row_end" style={{cursor: 'pointer'}}>
          <SVG.CloseIcon />
        </UX.Box>

        {/* Warning Title */}
        <UX.Text
          titleKey="inscription.cannotSetSpendable"
          styleType="heading_16"
          customStyles={{color: colors.orange, textAlign: 'center'}}
        />

        {/* Dynamic Message */}
        <UX.Text
          titleKey="inscription.cannotSetSpendableRune"
          titleParams={{inscriptionNum}}
          styleType="body_14_bold"
          customStyles={{
            color: colors.red_500,
            textAlign: 'center',
            marginBottom: '15px',
          }}
        />

        {/* Single "Understand" Button */}
        {/* <UX.Box layout="row" spacing="xs">
          <UX.Button
            styleType="primary"
            onClick={onCancel}
            titleKey="common.understand"
            customStyles={{flex: 1}}
          />
        </UX.Box> */}
      </UX.Box>
    </UX.CustomModal>
  );
};

export default SpendableContainRuneAttentionModal;
