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

  const message = `This inscription (${inscriptionNum}) cannot be set as spendable because it shares the same UTXO with a Rune`;

  return (
    <UX.CustomModal isOpen={visible} onClose={onCancel}>
      <UX.Box spacing="xs">
        {/* Close Icon */}
        <UX.Box onClick={onCancel} layout="row_end" style={{cursor: 'pointer'}}>
          <SVG.CloseIcon />
        </UX.Box>

        {/* Warning Title */}
        <UX.Text
          title="Cannot Set as Spendable"
          styleType="heading_16"
          customStyles={{color: colors.orange, textAlign: 'center'}}
        />

        {/* Dynamic Message */}
        <UX.Text
          title={message}
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
            title="Understand"
            customStyles={{flex: 1}}
          />
        </UX.Box> */}
      </UX.Box>
    </UX.CustomModal>
  );
};

export default SpendableContainRuneAttentionModal;
