import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {useAppSelector} from '@/src/ui/utils';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {copyToClipboard, shortAddress} from '@/src/ui/helper';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useActiveTracAddress, useIsTracSingleWallet} from '@/src/ui/pages/home-flow/hook';
import {ADDRESS_TYPES} from '@/src/wallet-instance';
import QRCode from 'qrcode.react';
import {useState, useEffect} from 'react';

interface ModalReceiveProps {
  handleClose: () => void;
  isOpen?: boolean;
}

export default function ModalReceive(props: ModalReceiveProps) {
  const {handleClose, isOpen} = props;
  const {showToast} = useCustomToast();
  const account = useAppSelector(AccountSelector.activeAccount);
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const tracAddress = useActiveTracAddress();
  const isTracSingle = useIsTracSingleWallet();
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  
  // Get current address type name (limit to 3 characters + dots)
  const currentAddressTypeName = (ADDRESS_TYPES[activeWallet.addressType]?.name || 'Unknown').substring(0, 3) + '..';
  const fullAddressTypeName = ADDRESS_TYPES[activeWallet.addressType]?.name || 'Unknown';
  

  const onCopy = async (addr?: string) => {
    try {
      await copyToClipboard(addr || account.address || '');
      showToast({type: 'copied', title: 'Copied'});
    } catch {}
  };

  const handleShowQRCode = (address: string) => {
    setSelectedAddress(address);
    setShowQRCode(true);
  };

  const handleBackToAddresses = () => {
    setShowQRCode(false);
    setSelectedAddress('');
  };

  // Reset QR code state when modal closes
  const handleModalClose = () => {
    setShowQRCode(false);
    setSelectedAddress('');
    props.handleClose();
  };

  // Reset QR state when modal closes
  useEffect(() => {
    if (isOpen === false) {
      setShowQRCode(false);
      setSelectedAddress('');
    }
  }, [isOpen]);

  return (
    <UX.Box style={{padding: '16px', backgroundColor: '#191919'}} spacing="xl">
      <UX.Box layout="row_center">
        <div style={{width: 36, height: 4, background: '#3F3F3F', borderRadius: 999}} />
      </UX.Box>
      
      {showQRCode ? (
        <>
          <UX.Box layout="row_center" spacing="xs">
            <UX.Box 
              style={{cursor: 'pointer', padding: '8px'}}
              onClick={handleBackToAddresses}
            >
              <SVG.ArrowBackIcon width={20} height={20} />
            </UX.Box>
            <UX.Text title="QR Code" styleType="heading_20" />
          </UX.Box>
          
          <UX.Box layout="column_center" spacing="xl">
            <UX.Box layout="column_center" spacing="sm">
              <UX.Text
                title="Scan QR code to receive"
                styleType="body_14_normal"
                customStyles={{color: '#888', textAlign: 'center'}}
              />
              <QRCode
                value={selectedAddress}
                renderAs="svg"
                size={200}
                style={{
                  border: '1px solid #545454',
                  borderRadius: '10px',
                  padding: '10px',
                  backgroundColor: 'white'
                }}
              />
            </UX.Box>
            
            <UX.Box 
              layout="row_center" 
              spacing="xs"
              style={{cursor: 'pointer'}}
              onClick={() => onCopy(selectedAddress)}
            >
              <UX.Text
                title={shortAddress(selectedAddress, 8)}
                styleType="body_14_normal"
                customStyles={{
                  wordWrap: 'break-word',
                  textAlign: 'center',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #545454',
                  backgroundColor: '#2A2A2A'
                }}
              />
              <SVG.CopyPink color="white" width={18} height={18} />
            </UX.Box>
          </UX.Box>
        </>
      ) : (
        <>
          <UX.Text title="Receive" styleType="heading_20" />

          <UX.Box spacing="xl">
            {isTracSingle ? null : (
              <UX.Box
                layout="box_border"
                style={{cursor: 'pointer'}}
                onClick={() => onCopy(account.address)}
              >
                <UX.Box layout="row_center" spacing="xs">
                  <SVG.BitcoinIcon width={28} height={28} />
                  <UX.Tooltip text={fullAddressTypeName} isText>
                    <UX.Text title={`Bitcoin (${currentAddressTypeName})`} styleType="body_16_bold" />
                  </UX.Tooltip>
                </UX.Box>
                <UX.Box layout="row_between" spacing="xs">
                  <UX.Box layout="row_center" spacing="xs">
                    <UX.Text title={shortAddress(account.address, 4)} styleType="body_14_normal" />
                    <SVG.CopyPink color="white" width={18} height={18} />
                  </UX.Box>
                  <UX.Box 
                    layout="row_center" 
                    spacing="xs"
                    style={{cursor: 'pointer'}}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowQRCode(account.address);
                    }}
                  >
                    <UX.Text title="QR CODE" styleType="body_12_normal" customStyles={{color: '#888'}} />
                  </UX.Box>
                </UX.Box>
              </UX.Box>
            )}

            {tracAddress ? (
              <UX.Box
                layout="box_border"
                style={{cursor: 'pointer'}}
                onClick={() => onCopy(tracAddress)}
              >
                <UX.Box layout="row_center" spacing="xs">
                  <SVG.TracIcon width={28} height={28} />
                  <UX.Text title="Trac Network" styleType="body_16_bold" />
                </UX.Box>
                <UX.Box layout="row_between" spacing="xs">
                  <UX.Box layout="row_center" spacing="xs">
                    <UX.Text title={shortAddress(tracAddress, 4)} styleType="body_14_normal" />
                    <SVG.CopyPink color="white" width={18} height={18} />
                  </UX.Box>
                  <UX.Box 
                    layout="row_center" 
                    spacing="xs"
                    style={{cursor: 'pointer'}}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowQRCode(tracAddress);
                    }}
                  >
                    <UX.Text title="QR CODE" styleType="body_12_normal" customStyles={{color: '#888'}} />
                  </UX.Box>
                </UX.Box>
              </UX.Box>
            ) : null}
          </UX.Box>

          <UX.Button styleType="dark" title="Close" onClick={handleModalClose} />
        </>
      )}
    </UX.Box>
  );
}


