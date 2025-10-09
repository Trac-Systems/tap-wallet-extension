import {UX} from '@/src/ui/component/index';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {colors} from '@/src/ui/themes/color';
import {SVG} from '@/src/ui/svg';
import {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import Text from '../../component/text-custom';
import {useCustomToast} from '../../component/toast-custom';
import {useActiveTracAddress, useTracBalances, useIsTracSingleWallet} from '../home-flow/hook';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useAppSelector} from '../../utils';
import {WalletSelector} from '../../redux/reducer/wallet/selector';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {PinInputRef} from '../../component/pin-input';
import {TracApi} from '../../../background/requests/trac-api';
import {TracApiService} from '../../../background/service/trac-api.service';

const SendTrac = () => {
  //! State
  const navigate = useNavigate();
  const tracAddress = useActiveTracAddress();
  const {total, confirmed, unconfirmed, loading: balancesLoading} = useTracBalances(tracAddress);
  const [disabled, setDisabled] = useState(true);
  const [toInfo, setToInfo] = useState({address: ''});
  const {showToast} = useCustomToast();
  const [tracSendNumberValue, setTracSendNumberValue] = useState('');
  const wallet = useWalletProvider();
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const isTracSingleWallet = useIsTracSingleWallet();
  const [openPinModal, setOpenPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [sending, setSending] = useState(false);
  const pinRef = useRef<PinInputRef>(null);
  const [pendingTxData, setPendingTxData] = useState<any>(null);

  const onAddressChange = (address: string) => {
    setToInfo({address: address});
  };

  const onTracAmountChange = (input: string) => {
    const cleanText = input.replace(/[^0-9.]/g, '');
    const dotCount = (cleanText.match(/\./g) || []).length;
    if (dotCount > 1) {
      return;
    }
    setTracSendNumberValue(cleanText);
  };

  const isTracAddress = (addr: string) => {
    return TracApiService.isValidTracAddress(addr);
  };

  // Check if form is valid
  const isFormValid = isTracAddress(toInfo.address) && 
    tracSendNumberValue.trim() !== '' && 
    parseFloat(tracSendNumberValue) > 0 &&
    parseFloat(tracSendNumberValue) <= parseFloat(confirmed || '0');

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = async () => {
    try {
      // Check if user has enough confirmed balance
      const sendAmount = parseFloat(tracSendNumberValue);
      const confirmedAmount = parseFloat(confirmed || '0');
      
      if (sendAmount > confirmedAmount) {
        showToast({
          title: `Insufficient confirmed balance. Available: ${confirmed || '0'} TNK`,
          type: 'error'
        });
        return;
      }

      const tracCrypto = TracApiService.getTracCryptoInstance();
      if (!tracCrypto) {
        showToast({title: 'TracCryptoApi not available', type: 'error'});
        return;
      }
      
      const validityHex = await TracApi.fetchTransactionValidity();
      
      // Convert input amount to hex using service
      const amountHex = TracApiService.amountToHex(sendAmount);

      setPendingTxData({
        to: toInfo.address,
        amountHex,
        validityHex
      });
      setOpenPinModal(true);
    } catch (e) {
      const err = e as Error;
      showToast({title: err.message || 'Failed to send TNK', type: 'error'});
    }
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
        to: pendingTxData.to,
        amountHex: pendingTxData.amountHex,
        validityHex: pendingTxData.validityHex
      });
      
      const txPayload = TracApiService.buildTransaction(txData, secret);
      
      const result = await TracApi.broadcastTransaction(txPayload);
      
      if (result.success) {
        showToast({title: 'Transaction sent successfully', type: 'success'});
        navigate(-1); // Go back after successful transaction
      } else {
        showToast({title: result.error || 'Transaction failed', type: 'error'});
      }
      
      setOpenPinModal(false);
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

  //! Render
  return (
    <LayoutSendReceive
      header={<UX.TextHeader text="Send TNK" onBackClick={handleGoBack} />}
      body={
        <UX.Box spacing="xxl" style={{width: '100%'}}>
          <UX.Box layout="column" style={{width: '100%'}} spacing="xss">
            <UX.Box layout="row_between" style={{alignItems: 'flex-start'}}>
              <UX.Text
                styleType="heading_16"
                customStyles={{color: 'white'}}
                title="Send"
              />
              <UX.Box layout="column" style={{alignItems: 'flex-end'}}>
                <UX.Box layout="row" spacing="xs">
                    <UX.Text title="Confirmed:" styleType="body_14_bold" />
                    <UX.Text
                    title={`${confirmed || '0'} TNK`}
                    styleType="body_14_bold"
                    customStyles={{color: colors.green_500, marginLeft: 4}}
                    />
                </UX.Box>
                
              </UX.Box>
            </UX.Box>
          
            <UX.Box
              layout="row_between"
              style={{
                background: 'transparent',
                borderRadius: '12px',
                border: '1px solid #3F3F3F',
                padding: '12px 14px',
              }}
            >
              <input
                type="text"
                value={tracSendNumberValue}
                onChange={e => onTracAmountChange(e.target.value)}
                placeholder="0"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: '20px',
                  lineHeight: '28px',
                }}
              />
              <UX.Box
                layout="row_center"
                spacing="xs"
                style={{
                  background: 'transparent',
                  border: '1px solid #3F3F3F',
                  borderRadius: '8px',
                  padding: '6px 10px',
                }}
              >
                <SVG.TracIcon width={22} height={22} />
                <UX.Text title="TNK" styleType="body_14_bold" customStyles={{color: 'white'}} />
              </UX.Box>
            </UX.Box>
            <UX.Box layout="column" style={{width: '100%', alignItems: 'flex-end'}}>
                <UX.Box layout="row" spacing="xs">
                    <UX.Text title="Unconfirmed:" styleType="body_14_bold" />
                    <UX.Text
                    title={`${unconfirmed || '0'} TNK`}
                    styleType="body_14_bold"
                    customStyles={{color: colors.green_500, marginLeft: 4}}
                    />
                </UX.Box>
                
            </UX.Box>
            <UX.Box layout="column" style={{width: '100%', alignItems: 'flex-end'}}>
            <UX.Box layout="row" spacing="xs">
                <UX.Text title="Total:" styleType="body_14_bold" />
                <UX.Text
                  title={`${total || '0'} TNK`}
                  styleType="body_14_bold"
                  customStyles={{color: colors.green_500}}
                />
            </UX.Box>
            </UX.Box>
          </UX.Box>
          <UX.Box spacing="xss">
            <UX.Text
              styleType="heading_16"
              customStyles={{color: 'white'}}
              title="Receiver"
            />
            <UX.Box
              layout="row"
              style={{
                borderRadius: 10,
                padding: '12px 14px',
                border: '1px solid #545454',
                backgroundColor: '#2727276b',
              }}
            >
              <input
                placeholder={'trac address'}
                type={'text'}
                onChange={e => onAddressChange(e.target.value)}
                style={{
                  fontSize: '16px',
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  outline: 'none',
                  color: 'white',
                }}
                defaultValue={toInfo.address}
                autoFocus={true}
              />
            </UX.Box>
          </UX.Box>
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
            isDisable={!isFormValid}
            title="Send"
            onClick={handleNavigate}
          />
          <UX.CustomModal isOpen={openPinModal} onClose={() => setOpenPinModal(false)}>
            <UX.Box layout="column_center" spacing="xl" style={{padding: '16px'}}>
              <SVG.UnlockIcon />
              <UX.Text title="PIN" styleType="heading_24" />
              <UX.Text title="Enter your PIN code to confirm the transaction" styleType="body_16_normal" />
              <UX.PinInput ref={pinRef} onChange={setPinValue} />
              <UX.Button styleType="primary" title={sending ? 'Sending...' : 'Confirm'} isDisable={!pinValue || sending} onClick={onConfirmPin} />
            </UX.Box>
          </UX.CustomModal>
        </UX.Box>
      }
    />
  );
};

export default SendTrac;
