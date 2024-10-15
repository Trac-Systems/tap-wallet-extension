import {useState} from 'react';
import {UX} from '../../component';
import {SVG} from '../../svg';
import {colors} from '../../themes/color';

interface EnableSignDataModalProps {
  open: boolean;
  onNext: () => void;
  onCancel: () => void;
}
const EnableSignDataModal = (props: EnableSignDataModalProps) => {
  //! State
  const {open, onNext, onCancel} = props;
  const [understand, setUnderstand] = useState(false);

  return (
    <UX.CustomModal isOpen={open} onClose={onCancel}>
      <UX.Box spacing="xs">
        <UX.Box onClick={onCancel} layout="row_end" style={{cursor: 'pointer'}}>
          <SVG.CloseIcon />
        </UX.Box>
        <UX.Text
          title="Use at your own risk"
          styleType="heading_16"
          customStyles={{color: colors.orange, textAlign: 'center'}}
        />

        <UX.Text
          title="Allowing signData requests can make you vulnerable to phishing
          attacks. Always review the URL and be careful when signing messages
          that contain code."
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
            title={'If you\'ve been asked to turn this setting on, you might be getting scammed.'}
          />
        </UX.Box>

        <UX.Box layout="row" spacing="xs">
          <UX.CheckBox
            checked={understand}
            onChange={() => setUnderstand(!understand)}
          />
          <UX.Text
            title="I understand that I can lose all of my funds and NFTs if I enable
            signData requests."
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
            isDisable={!understand}
            onClick={onNext}
            title="Continue"
            customStyles={{flex: 1}}
          />
        </UX.Box>
      </UX.Box>
    </UX.CustomModal>
  );
};

export default EnableSignDataModal;
