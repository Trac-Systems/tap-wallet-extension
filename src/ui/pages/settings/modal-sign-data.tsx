import {useState} from 'react';
import {UX} from '../../component';
import {useI18n} from '../../i18n';
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
  const {t} = useI18n();

  return (
    <UX.CustomModal isOpen={open} onClose={onCancel}>
      <UX.Box spacing="xs">
        <UX.Box onClick={onCancel} layout="row_end" style={{cursor: 'pointer'}}>
          <SVG.CloseIcon />
        </UX.Box>
        <UX.Text
          title={t('settings.signDataModal.title')}
          styleType="heading_16"
          customStyles={{color: colors.orange, textAlign: 'center'}}
        />

        <UX.Text
          title={t('settings.signDataModal.description')}
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
            title={t('settings.signDataModal.scamWarning')}
          />
        </UX.Box>

        <UX.Box layout="row" spacing="xs">
          <UX.CheckBox
            checked={understand}
            onChange={() => setUnderstand(!understand)}
          />
          <UX.Text
            title={t('settings.signDataModal.checkbox')}
            styleType="body_12_normal"
            customStyles={{color: colors.white, maxWidth: '80%'}}
          />
        </UX.Box>

        <UX.Box layout="row" spacing="xs">
          <UX.Button
            styleType="dark"
            onClick={onCancel}
            title={t('common.cancel')}
            customStyles={{flex: 1}}
          />
          <UX.Button
            styleType="primary"
            isDisable={!understand}
            onClick={onNext}
            title={t('common.continue')}
            customStyles={{flex: 1}}
          />
        </UX.Box>
      </UX.Box>
    </UX.CustomModal>
  );
};

export default EnableSignDataModal;
