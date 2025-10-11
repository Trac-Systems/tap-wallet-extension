import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {useAccountBalance, useActiveTracAddress, useTracBalances, useIsTracSingleWallet} from '../hook';
import {satoshisToAmount, formatTracBalance} from '@/src/shared/utils/btc-helper';

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
  
  // Format TNK balance from API with 8 decimal places limit
  const tnkBalance = tracLoading ? "-" : formatTracBalance(tracBalance);

  return (
    <UX.Box style={{padding: '16px'}} spacing="xl">
      <UX.Box layout="row_center">
        <div style={{width: 36, height: 4, background: '#3F3F3F', borderRadius: 999}} />
      </UX.Box>
      <UX.Text title="Send Coins" styleType="heading_20" />

      <UX.Box spacing="xl">
        {isTracSingle ? null : (
          <UX.Box
            layout="box_border"
            style={{cursor: 'pointer'}}
            onClick={() => {
              onSelectBTC();
              // Don't close modal automatically - let parent decide
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
              // Don't close modal automatically - let parent decide
            }}
          >
            <UX.Box layout="row_between" style={{width: '100%', alignItems: 'flex-start'}}>
              <UX.Box layout="row_center" spacing="xs">
                <SVG.TracIcon width={28} height={28} />
                <UX.Text title="Send TNK" styleType="body_16_bold"/>
              </UX.Box>
              <UX.Tooltip text={tracBalance} isText>
                <UX.Text 
                  title={tnkBalance} 
                  styleType="body_16_bold" 
                  customStyles={{
                    textAlign: 'right',
                    wordBreak: 'break-all',
                    maxWidth: '60%'
                  }}
                />
              </UX.Tooltip>
            </UX.Box>
          </UX.Box>
        ) : null}
      </UX.Box>

      <UX.Button styleType="dark" title="Close" onClick={handleClose} />
    </UX.Box>
  );
}
