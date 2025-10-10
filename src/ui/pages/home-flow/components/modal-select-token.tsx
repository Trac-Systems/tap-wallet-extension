import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {useAccountBalance, useActiveTracAddress, useTracBalances, useIsTracSingleWallet} from '../hook';
import {satoshisToAmount} from '@/src/shared/utils/btc-helper';

interface ModalSelectTokenProps {
  handleClose: () => void;
  onSelectBTC: () => void;
  onSelectTNK: () => void;
}

export default function ModalSelectToken(props: ModalSelectTokenProps) {
  const {handleClose, onSelectBTC, onSelectTNK} = props;
  const accountBalance = useAccountBalance();
  const tracAddress = useActiveTracAddress();
  const {total: tracBalance, loading: tracLoading} = useTracBalances(tracAddress);
  const isTracSingle = useIsTracSingleWallet();

  // Format BTC balance using same method as tap-list-child
  const btcBalance = satoshisToAmount(accountBalance.amount);
  
  // Format TNK balance from API
  const tnkBalance = tracLoading ? "Loading..." : tracBalance;

  return (
    <UX.Box style={{padding: '16px'}} spacing="xl">
      <UX.Box layout="row_center">
        <div style={{width: 36, height: 4, background: '#3F3F3F', borderRadius: 999}} />
      </UX.Box>
      <UX.Text title="Select Token" styleType="heading_20" />

      <UX.Box spacing="xl">
        {isTracSingle ? null : (
          <UX.Box
            layout="box_border"
            style={{cursor: 'pointer'}}
            onClick={() => {
              onSelectBTC();
              handleClose();
            }}
          >
            <UX.Box layout="row_between" style={{width: '100%'}}>
              <UX.Box layout="row_center" spacing="xs">
                <SVG.BitcoinIcon width={28} height={28} />
                <UX.Text title="Send BTC" styleType="body_16_bold" />
              </UX.Box>
              <UX.Text title={btcBalance} styleType="body_16_bold" />
            </UX.Box>
          </UX.Box>
        )}

        {tracAddress ? (
          <UX.Box
            layout="box_border"
            style={{cursor: 'pointer'}}
            onClick={() => {
              onSelectTNK();
              handleClose();
            }}
          >
            <UX.Box layout="row_between" style={{width: '100%'}}>
              <UX.Box layout="row_center" spacing="xs">
                <SVG.TracIcon width={28} height={28} />
                <UX.Text title="Send TNK" styleType="body_16_bold" />
              </UX.Box>
              <UX.Text title={tnkBalance} styleType="body_16_bold" />
            </UX.Box>
          </UX.Box>
        ) : null}
      </UX.Box>

      <UX.Button styleType="dark" title="Close" onClick={handleClose} />
    </UX.Box>
  );
}
