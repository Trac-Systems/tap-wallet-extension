import {UX} from '@/src/ui/component/index';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {SVG} from '@/src/ui/svg';
import {useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useCustomToast} from '../../component/toast-custom';
import {useActiveTracAddress, useIsTracSingleWallet} from '../home-flow/hook';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useAppSelector} from '../../utils';
import {WalletSelector} from '../../redux/reducer/wallet/selector';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {PinInputRef} from '../../component/pin-input';
import {TracApi} from '../../../background/requests/trac-api';
import {TracApiService} from '../../../background/service/trac-api.service';

interface TracSummaryData {
  to: string;
  amountHex: string;
  validityHex: string;
  amount: string;
  fee: string;
}

const SendTracPin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {summaryData}: {summaryData: TracSummaryData} = location.state;
  
  const tracAddress = useActiveTracAddress();
  const {showToast} = useCustomToast();
  const wallet = useWalletProvider();
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const isTracSingleWallet = useIsTracSingleWallet();
  
  const [pinValue, setPinValue] = useState('');
  const [sending, setSending] = useState(false);
  const pinRef = useRef<PinInputRef>(null);

  const handleGoBack = () => {
    navigate(-1);
  };

  const onConfirmPin = async () => {
    try {
      setSending(true);
      
      let secret: Buffer;
      
      if (isTracSingleWallet) {
        // For TRAC Single wallet: get TRAC private key directly (in original format)
        const tracPrivateKey = await (wallet as any).getTracPrivateKey(pinValue, activeWallet.index, activeAccount.index);
        secret = Buffer.from(tracPrivateKey, 'hex'); // Use original hex format
      } else {
        // For mnemonic wallet: generate keypair from mnemonic
        const mnemonicData = await wallet.getMnemonics(pinValue, activeWallet);
        if (!mnemonicData || !mnemonicData.mnemonic) {
          throw new Error("Failed to get mnemonic from wallet. Please check your PIN.");
        }
        
        const generated = await TracApiService.generateKeypairFromMnemonic(
          mnemonicData.mnemonic,
          activeAccount.index
        );
        
        secret = TracApiService.toSecretBuffer(generated.secretKey);
      }
      
      const txData = await TracApiService.preBuildTransaction({
        from: tracAddress, // Use active TRAC address
        to: summaryData.to,
        amountHex: summaryData.amountHex,
        validityHex: summaryData.validityHex
      });
      
      const txPayload = TracApiService.buildTransaction(txData, secret);
      
      const result = await TracApi.broadcastTransaction(txPayload);
      
      if (result.success) {
        navigate('/home/send-trac-success', { state: { txid: result.txid } });
      } else {
        showToast({title: result.error || 'Transaction failed', type: 'error'});
      }
      
      setPinValue('');
      pinRef.current?.clearPin();
    } catch (e) {
      pinRef.current?.clearPin();
      const err = e as Error;
      showToast({title: err.message || 'PIN invalid', type: 'error'});
    } finally {
      setSending(false);
    }
  };

  return (
    <LayoutSendReceive
      header={<UX.TextHeader text="Enter PIN" onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" spacing="xl" style={{padding: '16px'}}>
          <SVG.UnlockIcon />
          <UX.Text title="PIN" styleType="heading_24" />
          <UX.Text title="Enter your PIN code to confirm the transaction" styleType="body_16_normal" />
          <UX.PinInput ref={pinRef} onChange={setPinValue} />
        </UX.Box>
      }
      footer={
        <UX.Box
          layout="column"
          spacing="xl"
          style={{
            padding: '10px 0',
          }}>
          <UX.Button 
            styleType="primary" 
            title={sending ? 'Sending...' : 'Confirm'} 
            isDisable={!pinValue || sending} 
            onClick={onConfirmPin} 
          />
        </UX.Box>
      }
    />
  );
};

export default SendTracPin;
