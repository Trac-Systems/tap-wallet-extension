import {UX} from '@/src/ui/component/index';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {colors} from '@/src/ui/themes/color';
import {SVG} from '@/src/ui/svg';
import {useState, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useCustomToast} from '../../component/toast-custom';
import Text from '../../component/text-custom';
import {useActiveTracAddress} from '../home-flow/hook';
import {useAppSelector} from '../../utils';
import {WalletSelector} from '../../redux/reducer/wallet/selector';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {TracApiService} from '../../../background/service/trac-api.service';
import {TracApi} from '../../../background/requests/trac-api';
import {Network} from '../../../wallet-instance';
import {formatNumberValue} from '@/src/shared/utils/btc-helper';

interface TracSummaryData {
  to: string;
  amountHex: string;
  validityHex: string;
  amount: string;
  fee: string;
}

const SendTracSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {summaryData}: {summaryData: TracSummaryData} = location.state;
  
  const tracAddress = useActiveTracAddress();
  const wallet = useWalletProvider();
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const networkType = useAppSelector(GlobalSelector.networkType);
  const {showToast} = useCustomToast();
  const [usdPriceSpendAmount, setUsdPriceSpendAmount] = useState('0.00');
  const [usdPriceFee, setUsdPriceFee] = useState('0.00');

  // Convert fee from hex to decimal (dec 18)
  const formatFee = (feeHex: string) => {
    try {
      const feeDecimal = TracApiService.balanceToDisplay(feeHex);
      return parseFloat(feeDecimal).toFixed(8);
    } catch (error) {
      console.error('Error formatting fee:', error);
      return '0.00000000';
    }
  };

  // Fetch USD price for spend amount
  useEffect(() => {
    const fetchUSDPrice = async () => {
      if (Number(summaryData.amount) > 0) {
        const usdPrice = await wallet.getTracUSDPrice(Number(summaryData.amount));
        setUsdPriceSpendAmount(usdPrice);
      } else {
        setUsdPriceSpendAmount('0.00');
      }
    };
    fetchUSDPrice();
  }, [summaryData.amount]);

  // Fetch USD price for fee
  useEffect(() => {
    const fetchUSDPriceFee = async () => {
      if (summaryData.fee) {
        const feeAmount = parseFloat(TracApiService.balanceToDisplay(summaryData.fee));
        if (feeAmount > 0) {
          const usdPrice = await wallet.getTracUSDPrice(feeAmount);
          setUsdPriceFee(usdPrice);
        } else {
          setUsdPriceFee('0.00');
        }
      } else {
        setUsdPriceFee('0.00');
      }
    };
    fetchUSDPriceFee();
  }, [summaryData.fee]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleConfirm = async () => {
    try {
      // Get secret without PIN, using unlocked session
      let secret: Buffer;
      try {
        const tracPrivateKey = await wallet.getTracPrivateKeyUnlocked(
          activeWallet.index,
          activeAccount.index,
        );
        secret = Buffer.from(tracPrivateKey, 'hex');
      } catch (e) {
        // If not Single Wallet or no stored TRAC key, derive from mnemonic (unlocked)
        const mnemonicData = await wallet.getMnemonicsUnlocked(activeWallet);
        const generated = await TracApiService.generateKeypairFromMnemonic(
          mnemonicData.mnemonic,
          activeAccount.index,
        );
        secret = TracApiService.toSecretBuffer(generated.secretKey);
      }

      const tracCrypto = TracApiService.getTracCryptoInstance();
      if (!tracCrypto) {
        throw new Error('TracCryptoApi not available');
      }
      const chainId = networkType === Network.MAINNET
        ? tracCrypto.MAINNET_ID
        : tracCrypto.TESTNET_ID;

      const txData = await TracApiService.preBuildTransaction({
        from: tracAddress,
        to: summaryData.to,
        amountHex: summaryData.amountHex,
        validityHex: summaryData.validityHex,
      }, chainId);

      const txPayload = TracApiService.buildTransaction(txData, secret);
      const result = await TracApi.broadcastTransaction(txPayload, networkType);
      if (result.success) {
        // Decode payload to get transaction hash
        const txHash = TracApiService.decodePayload(txPayload);
        showToast({title: 'Transaction sent successfully', type: 'success'});
        navigate('/home/send-trac-success', { 
          state: { txHash } 
        });
      } else {
        showToast({title: result.error || 'Transaction failed', type: 'error'});
      }
    } catch (err: any) {
      showToast({title: err?.message || 'Failed to send transaction', type: 'error'});
    }
  };

  const formatAddressLongText = (address: string, start: number, end: number) => {
    if (!address) return '';
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  return (
    <LayoutSendReceive
      header={<UX.TextHeader text="Summary" onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column" spacing="xl" style={{width: '100%'}}>
          <UX.Box layout="column_center">
            <UX.Box
              style={{
                padding: '18px',
                borderRadius: '100%',
                background: colors.red_100,
                width: 'fit-content',
              }}>
              <SVG.ArrowUpRight />
            </UX.Box>
            <UX.Text
              title="Spend Amount"
              styleType="body_16_normal"
              customStyles={{marginTop: '24px', marginBottom: '8px'}}
            />
            <UX.Text
              title={`${summaryData.amount} TNK`}
              styleType="heading_24"
              customStyles={{textAlign: 'center'}}
            />
            <UX.Box layout="row_center" spacing="xss_s">
              <UX.Text title="≈" styleType="body_14_normal" />
              <UX.Text
                title={`${formatNumberValue(usdPriceSpendAmount)} USD`}
                styleType="body_14_normal"
              />
            </UX.Box>
          </UX.Box>
          
          <UX.Box layout="box" spacing="xl">
            <UX.Box layout="row_between">
              <UX.Text title="From" styleType="body_14_normal" />
              <UX.Text
                title={formatAddressLongText(tracAddress || '', 8, 6)}
                styleType="body_14_normal"
                customStyles={{color: 'white'}}
              />
            </UX.Box>
            <UX.Box layout="row_between">
              <UX.Text title="To" styleType="body_14_normal" />
              <UX.Text
                title={formatAddressLongText(summaryData.to, 8, 6)}
                styleType="body_14_normal"
                customStyles={{color: 'white'}}
              />
            </UX.Box>
          </UX.Box>
          
          <UX.Box layout="box" spacing="xl">
            <UX.Box layout="row_between" style={{alignItems: 'flex-start'}}>
              <UX.Text title="Network fee" styleType="body_14_normal" />
              <UX.Box layout="column" style={{alignItems: 'flex-end'}}>
                <UX.Text
                  title={`${formatFee(summaryData.fee)} TNK`}
                  styleType="body_14_normal"
                  customStyles={{color: 'white'}}
                />
                <Text
                  title={`≈ ${Number(usdPriceFee).toLocaleString()} USD`}
                  styleType="body_12_normal"
                  customStyles={{color: colors.smoke, marginTop: 2}}
                />
              </UX.Box>
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
            title="Sign & Pay"
            onClick={handleConfirm}
          />
        </UX.Box>
      }
    />
  );
};

export default SendTracSummary;
