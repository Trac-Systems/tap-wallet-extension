import {useState, useEffect} from 'react';
import {UX} from '@/src/ui/component';
import {useApproval} from '../hook';
import WebsiteBar from '../../../component/website-bar';
import LayoutApprove from '../layouts';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {SVG} from '@/src/ui/svg';

interface Props {
  params: {
    data: {
      text: string;
      type: string;
    };
    session: {
      origin: string;
      icon: string;
      name: string;
    };
  };
}
export default function SignMessage({params: {data, session}}: Props) {
  const [, resolveApproval, rejectApproval] = useApproval();
  const walletProvider = useWalletProvider();
  const [loading, setLoading] = useState(false);
  const [isLedger, setIsLedger] = useState(false);

  // Check if current wallet is Ledger
  useEffect(() => {
    const checkWalletType = async () => {
      const activeWallet = await walletProvider.getActiveWallet();
      setIsLedger(activeWallet?.type === 'Hardware Wallet');
    };
    checkWalletType();
  }, [walletProvider]);

  const handleCancel = () => {
    rejectApproval();
  };

  const handleConfirm = () => {
    // Wrap in Promise to prevent button's built-in loading overlay
    (async () => {
      setLoading(true);
      try {
        // For Ledger, we need to wait for the signing to complete before closing popup
        if (isLedger) {
          // Call wallet provider directly to sign and wait for Ledger confirmation
          const signature = await walletProvider.signMessage(data.text);
          // Pass signature object so controller doesn't sign again
          await resolveApproval({ signature });
        } else {
          // For non-Ledger wallets, resolve immediately
          await resolveApproval();
        }
      } catch (error) {
        setLoading(false);
        // If error occurs, reject approval
        rejectApproval(error);
      }
    })();
  };

  return (
    <LayoutApprove
      header={<WebsiteBar session={session} />}
      body={
        <UX.Box style={{flex: 1}} spacing="sm">
          <UX.Text title="Signature request" styleType="body_14_bold" />
          <UX.Text
            title="Only sign this message if you fully understand the content and trust the requesting site."
            styleType="body_12_normal"
          />
          <UX.Text title="You are signing:" styleType="body_12_normal" />
          <UX.Box>
            <div
              style={{
                userSelect: 'text',
                fontFamily: 'Exo-2-Regular',
                fontStyle: 'normal',
                fontSize: 14,
                fontWeight: 400,
                maxHeight: 384,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flexWrap: 'wrap',
              }}>
              {data.text}
            </div>
          </UX.Box>

          {/* Ledger confirmation message */}
          {loading && isLedger && (
            <UX.Box
              layout="row"
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                gap: '8px'
              }}>
              <div style={{width: 16, height: 16}}>
                <SVG.LoadingIcon />
              </div>
              <UX.Text
                title="Please confirm on your Ledger device"
                styleType="body_12_normal"
                customStyles={{color: '#F7931A'}}
              />
            </UX.Box>
          )}
        </UX.Box>
      }
      footer={
        <UX.Box layout="row" spacing="sm">
          <UX.Button
            title="Reject"
            styleType="dark"
            onClick={handleCancel}
            customStyles={{flex: 1}}
          />
          <UX.Button
            title={loading ? 'Signing...' : 'Sign'}
            styleType="primary"
            onClick={handleConfirm}
            isDisable={loading}
            customStyles={{flex: 1}}
          />
        </UX.Box>
      }
    />
  );
}
