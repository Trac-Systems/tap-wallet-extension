import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';

interface SpendableAssetAttentionModalProps {
  onNext?: () => void;
  onCancel?: () => void;
  visible: boolean;
  extraInscriptionsCount: number;
  isSpendable: boolean;
}

const SpendableAssetAttentionModal = (
  props: SpendableAssetAttentionModalProps,
) => {
  const {onNext, onCancel, visible, extraInscriptionsCount, isSpendable} =
    props;
  return (
    <UX.CustomModal isOpen={visible} onClose={onCancel}>
      <UX.Box spacing="xs">
        {/* Close Icon */}
        <UX.Box onClick={onCancel} layout="row_end" style={{cursor: 'pointer'}}>
          <SVG.CloseIcon />
        </UX.Box>

        {/* Main Warning Title */}
        <UX.Text
          titleKey="inscription.multipleConnectedUtxo"
          styleType="heading_16"
          customStyles={{color: colors.orange, textAlign: 'center'}}
        />

        {/* Dynamic Message Showing Extra Inscriptions */}
        <UX.Text
          titleKey={
            isSpendable
              ? 'inscription.extraConnectedSpendable'
              : 'inscription.extraConnectedDeselect'
          }
          titleParams={{count: extraInscriptionsCount}}
          styleType="body_14_bold"
          customStyles={{
            color: colors.red_500,
            textAlign: 'center',
            marginBottom: '15px',
          }}
        />

        {/* Buttons for User Actions */}
        <UX.Box layout="row" spacing="xs">
          <UX.Button
            styleType="dark"
            onClick={onCancel}
            titleKey="common.cancel"
            customStyles={{flex: 1}}
          />
          <UX.Button
            styleType="primary"
            onClick={onNext}
            titleKey="common.continue"
            customStyles={{flex: 1}}
          />
        </UX.Box>
      </UX.Box>
    </UX.CustomModal>
  );
};

export default SpendableAssetAttentionModal;
