import ModalCustom from '../modal-custom';
import Box from '../box-custom';
import Text from '../text-custom';
import {SVG} from '../../svg';
import {colors} from '../../themes/color';

interface LedgerSignModalProps {
  isOpen: boolean;
}

const LedgerSignModal = ({isOpen}: LedgerSignModalProps) => {
  return (
    <ModalCustom
      isOpen={isOpen}
      onClose={() => {}}
      containerStyle={{
        backgroundColor: '#1b1b1f',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '360px',
      }}>
      <Box layout="column_center" spacing="xl" style={{width: '100%'}}>
        <Box
          layout="column_center"
          spacing="xs"
          style={{alignItems: 'center', textAlign: 'center'}}>
          <Box
            layout="column_center"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}>
            <SVG.LoadingSpinner width="42" height="42" />
          </Box>
          <Text
            title="Confirm on Ledger"
            styleType="heading_20"
            customStyles={{color: colors.white}}
          />
          <Text
            title="Please review and approve the request on your Ledger device."
            styleType="body_14_normal"
            customStyles={{
              color: colors.gray,
              textAlign: 'center',
              marginTop: '6px',
            }}
          />
        </Box>
      </Box>
    </ModalCustom>
  );
};

export default LedgerSignModal;

