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
            titleKey="extensionUpdate.title"
            styleType="heading_18"
            customStyles={{color: 'white'}}
          />
          <Text
            titleKey={
              availableVersion
                ? 'extensionUpdate.versionsAvailable'
                : 'extensionUpdate.versionCurrent'
            }
            titleParams={{currentVersion, availableVersion}}
            styleType="body_12_normal"
          />
          <Text
            titleKey="extensionUpdate.description"
            styleType="body_12_normal"
          />
        </Box>

        <Box layout="row" spacing="sm" style={{marginTop: '8px'}}>
          <Button styleType="dark" titleKey="common.later" onClick={onClose} />
          <Button
            styleType="primary"
            titleKey="extensionUpdate.updateNow"
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
