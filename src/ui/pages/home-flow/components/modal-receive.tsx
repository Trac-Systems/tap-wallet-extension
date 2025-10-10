import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {useAppSelector} from '@/src/ui/utils';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {copyToClipboard, shortAddress} from '@/src/ui/helper';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useActiveTracAddress, useIsTracSingleWallet} from '@/src/ui/pages/home-flow/hook';
import {ADDRESS_TYPES} from '@/src/wallet-instance';

interface ModalReceiveProps {
  handleClose: () => void;
}

export default function ModalReceive(props: ModalReceiveProps) {
  const {handleClose} = props;
  const {showToast} = useCustomToast();
  const account = useAppSelector(AccountSelector.activeAccount);
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const tracAddress = useActiveTracAddress();
  const isTracSingle = useIsTracSingleWallet();
  
  // Get current address type name
  const currentAddressTypeName = ADDRESS_TYPES[activeWallet.addressType]?.name || 'Unknown';
  

  const onCopy = async (addr?: string) => {
    try {
      await copyToClipboard(addr || account.address || '');
      showToast({type: 'copied', title: 'Copied'});
    } catch {}
  };

  return (
    <UX.Box style={{padding: '16px'}} spacing="xl">
      <UX.Box layout="row_center">
        <div style={{width: 36, height: 4, background: '#3F3F3F', borderRadius: 999}} />
      </UX.Box>
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
              <UX.Text title={`Bitcoin (${currentAddressTypeName})`} styleType="body_16_bold" />
            </UX.Box>
            <UX.Box layout="row_center" spacing="xs">
              <UX.Text title={shortAddress(account.address, 4)} styleType="body_14_normal" />
              <SVG.CopyPink color="white" width={18} height={18} />
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
            <UX.Box layout="row_center" spacing="xs">
              <UX.Text title={shortAddress(tracAddress, 4)} styleType="body_14_normal" />
              <SVG.CopyPink color="white" width={18} height={18} />
            </UX.Box>
          </UX.Box>
        ) : null}
      </UX.Box>

      <UX.Button styleType="dark" title="Close" onClick={handleClose} />
    </UX.Box>
  );
}


