import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {useState} from 'react';

interface InscribeAttentionModalProps {
  onNext?: () => void;
  onCancel?: () => void;
  visible: boolean;
}
const InscribeAttentionModal = (props: InscribeAttentionModalProps) => {
  const {onNext, onCancel, visible} = props;
  const [isUnderstand, setUnderstand] = useState(false);

  return (
    <UX.CustomModal isOpen={visible} onClose={onCancel}>
      <UX.Box spacing="xs">
        <UX.Box onClick={onCancel} layout="row_end" style={{cursor: 'pointer'}}>
          <SVG.CloseIcon />
        </UX.Box>
        <UX.Text
          title="May be use at your own risk"
          styleType="heading_16"
          customStyles={{color: colors.orange, textAlign: 'center'}}
        />

        <UX.Text
          title="Please make sure the previous transaction has been confirmed!"
          styleType="body_14_normal"
          customStyles={{color: colors.white}}
        />

        <UX.Box
          layout="box_border"
          spacing="sm"
          style={{background: colors.red_700}}>
          <SVG.WaringIcon />
          <UX.Text
            styleType="body_14_bold"
            customStyles={{color: colors.white, maxWidth: '80%'}}
            title={`If there is any unconfirmed inscription transfer in your wallet,
            part of your available balance may include unconfirmed balance.
            Please take precautions while making continuous transactions.`}
          />
        </UX.Box>

        <UX.Box layout="row" spacing="xs">
          <UX.CheckBox
            checked={isUnderstand}
            onChange={() => setUnderstand(!isUnderstand)}
          />
          <UX.Text
            title="I understand and I accept the risk"
            styleType="body_12_normal"
            customStyles={{color: colors.white, maxWidth: '80%'}}
          />
        </UX.Box>

        <UX.Box layout="row" spacing="xs">
          <UX.Button
            styleType="dark"
            onClick={onCancel}
            title="Cancel"
            customStyles={{flex: 1}}
          />
          <UX.Button
            styleType="primary"
            isDisable={!isUnderstand}
            onClick={onNext}
            title="Continue"
            customStyles={{flex: 1}}
          />
        </UX.Box>
      </UX.Box>
    </UX.CustomModal>
  );
};

export default InscribeAttentionModal;
