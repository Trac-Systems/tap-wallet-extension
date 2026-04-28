import browser from 'webextension-polyfill';
import ModalCustom from '../modal-custom';
import Box from '../box-custom';
import Button from '../button-custom';
import Text from '../text-custom';

interface ExtensionUpdateModalProps {
  isOpen: boolean;
  currentVersion: string;
  availableVersion?: string;
  onClose: () => void;
}

const ExtensionUpdateModal = ({
  isOpen,
  currentVersion,
  availableVersion,
  onClose,
}: ExtensionUpdateModalProps) => {
  return (
    <ModalCustom
      isOpen={isOpen}
      onClose={onClose}
      containerStyle={{
        width: 'calc(100vw - 32px)',
        maxWidth: '380px',
      }}>
      <Box layout="column" spacing="xl" style={{padding: '4px'}}>
        <Box layout="column" spacing="xs">
          <Text
            title="New version available"
            styleType="heading_18"
            customStyles={{color: 'white'}}
          />
          <Text
            title={`The current version is ${currentVersion}.${
              availableVersion ? ` The new version is ${availableVersion}.` : ''
            }`}
            styleType="body_12_normal"
          />
          <Text
            title="Update now to keep using the wallet with the latest fixes."
            styleType="body_12_normal"
          />
        </Box>

        <Box layout="row" spacing="sm" style={{marginTop: '8px'}}>
          <Button styleType="dark" title="Later" onClick={onClose} />
          <Button
            styleType="primary"
            title="Update now"
            onClick={async () => {
              await browser.runtime.reload();
            }}
          />
        </Box>
      </Box>
    </ModalCustom>
  );
};

export default ExtensionUpdateModal;
