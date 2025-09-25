import {UX} from '@/src/ui/component/index';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {colors} from '@/src/ui/themes/color';
import {SVG} from '@/src/ui/svg';
import {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import Text from '../../component/text-custom';
import {useCustomToast} from '../../component/toast-custom';
import {useActiveTracAddress, useTracBalanceByAddress} from '../home-flow/hook';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useAppSelector} from '../../utils';
import {WalletSelector} from '../../redux/reducer/wallet/selector';
import {PinInputRef} from '../../component/pin-input';

const SendTrac = () => {
  //! State
  const navigate = useNavigate();
  const tracAddress = useActiveTracAddress();
  const {balance: tracBalance, loading: tracLoading} = useTracBalanceByAddress(tracAddress);
  const [confirmedBalance, setConfirmedBalance] = useState<string>('0');
  const [unconfirmedBalance, setUnconfirmedBalance] = useState<string>('0');
  const [disabled, setDisabled] = useState(true);
  const [toInfo, setToInfo] = useState({address: ''});
  const {showToast} = useCustomToast();
  const [tracSendNumberValue, setTracSendNumberValue] = useState('');
  const wallet = useWalletProvider();
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
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
    const a = addr.trim();
    if (!a) return false;
    // Basic TRAC address check: must start with 'trac' and be bech32-like lowercase
    return /^trac[0-9a-z]+$/.test(a);
  };

  // Check if form is valid
  const isFormValid = isTracAddress(toInfo.address) && tracSendNumberValue.trim() !== '' && parseFloat(tracSendNumberValue) > 0;

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  // Fetch TRAC balances (confirmed/unconfirmed/total)
  const fetchTracBalance = async () => {
    try {
      if (!tracAddress) return;
      const base = 'http://trac.intern.ungueltig.com:1337';
      const get = async (confirmed: boolean) => {
        const resp = await fetch(`${base}/balance/${tracAddress}?confirmed=${confirmed ? 'true' : 'false'}`);
        if (!resp.ok) return '0';
        const data = await resp.json().catch(() => ({} as any));
        return (data?.balance ?? '0') as string;
      };
      const confirmedVal = await get(true);
      const unconfirmedVal = await get(false);
      setConfirmedBalance(confirmedVal);
      setUnconfirmedBalance(unconfirmedVal);
    } catch {}
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTracBalance(); }, [tracAddress]);

  // Helpers
  const normalizeTxvHex = (txv: string): string => {
    let clean = (txv || '').toLowerCase().trim();
    if (clean.startsWith('0x')) clean = clean.slice(2);
    clean = clean.replace(/[^0-9a-f]/g, '');
    if (clean.length >= 64) clean = clean.slice(-64);
    if (clean.length !== 64) {
      throw new Error('Invalid "validity" format. Should be a 32-byte hex string');
    }
    return clean;
  };

  const fetchTxvValidityFrom = async (_url: string): Promise<string> => {
    // restore fixed endpoint as before
    const resp = await fetch('http://trac.intern.ungueltig.com:1337/txv');
    if (!resp.ok) {
      throw new Error(`Fetch /txv failed: ${resp.status}`);
    }
    const data = (await resp.json()) as {txv?: string};
    if (!data?.txv) {
      throw new Error('Missing txv in response');
    }
    return normalizeTxvHex(data.txv);
  };

  const decimalToHex = (value) => {
    const n = BigInt(String(value || '0'));
    return n.toString(16);
  };

  const toSecretBuffer = (secret: any) => {
    if (!secret) return secret;
    if (typeof secret === 'string') {
      return Buffer.from(secret.replace(/^0x/, ''), 'hex');
    }
    return secret;
  };

  const handleNavigate = async () => {
    try {
      const w = window as any;
      const tracCrypto: any = w.TracCryptoApi || w.tracCrypto;
      if (!tracCrypto?.transaction?.preBuild) {
        showToast({title: 'TracCryptoApi not available', type: 'error'});
        return;
      }
      const from = tracAddress;
      const to = toInfo.address;
      const validityHex = await fetchTxvValidityFrom('');
      const amountHex = decimalToHex(tracSendNumberValue);

      const txData = await tracCrypto.transaction.preBuild(from, to, amountHex, validityHex);
      // Store txData and open PIN modal to derive secret from mnemonic
      setPendingTxData(txData);
      setOpenPinModal(true);
    } catch (e) {
      const err = e as Error;
      showToast({title: err.message || 'Failed to send TNK', type: 'error'});
    }
  };

  const onConfirmPin = async () => {
    try {
      setSending(true);
      const w = window as any;
      const tracCrypto: any = w.TracCryptoApi || w.tracCrypto;
      const mnemonicData = await wallet.getMnemonics(pinValue, activeWallet);
      console.log('[TNK] mnemonicData:', mnemonicData);
      const generated = await tracCrypto.address.generate('trac', mnemonicData.mnemonic, null);
      const secret = toSecretBuffer(generated.secretKey);
      console.log('[TNK] secret:', secret);
      const txData = pendingTxData;
      console.log('[TNK] txData:', txData);
      const txPayload = tracCrypto.transaction.build(txData, secret);
      const resp = await fetch('http://trac.intern.ungueltig.com:1337/broadcast-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: txPayload }),
      });
      const json = await resp.json().catch(() => ({}));
      if (resp.ok) showToast({title: 'Broadcasted successfully', type: 'success'});
      else showToast({title: json?.error || 'Broadcast failed', type: 'error'});
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
                    title={`${confirmedBalance} TNK`}
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
                    title={`${unconfirmedBalance} TNK`}
                    styleType="body_14_bold"
                    customStyles={{color: colors.green_500, marginLeft: 4}}
                    />
                </UX.Box>
                
            </UX.Box>
            <UX.Box layout="column" style={{width: '100%', alignItems: 'flex-end'}}>
            <UX.Box layout="row" spacing="xs">
                <UX.Text title="Total:" styleType="body_14_bold" />
                <UX.Text
                  title={`${tracBalance} TNK`}
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
