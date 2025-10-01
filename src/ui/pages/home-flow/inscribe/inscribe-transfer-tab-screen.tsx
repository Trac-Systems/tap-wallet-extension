import {UX} from '@/src/ui/component';
import LayoutTap from '@/src/ui/layouts/tap';
import {useLocation, useNavigate} from 'react-router-dom';
import {FeeRateBar} from '../../send-receive/component/fee-rate-bar';
import {
  InscribeOrder,
  RawTxInfo,
  TokenBalance,
  TokenInfo,
} from '@/src/wallet-instance';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {useAppSelector} from '@/src/ui/utils';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {
  useFetchUtxosCallback,
  usePrepareSendBTCCallback,
} from '../../send-receive/hook';
import {useCallback, useEffect, useState} from 'react';
import BigNumber from 'bignumber.js';
import {getUtxoDustThreshold} from '@/src/background/utils';
import {colors} from '@/src/ui/themes/color';
import {OutputValueBar} from '../../send-receive/component/output-value';
import {RBFBar} from '../../send-receive/component/rbf-bar';
import {
  formatAmountNumber,
  formatNumberValue,
  formatTicker,
} from '@/src/shared/utils/btc-helper';

import TransferApps from '../../authority/component/trac-apps'
// NOTE: TRAC_APPS_BITCOIN_ADDRESSES is not used in TX 1, but we keep the import
import { useTracAppsLogic, TRAC_APPS_BITCOIN_ADDRESSES } from '../../authority/hook/use-trac-apps-logic'

interface ContextData {
  ticker: string;
  session?: any;
  tokenBalance?: TokenBalance;
  order?: InscribeOrder;
  rawTxInfo?: RawTxInfo;
  transferAmount?: string;
  isApproval: boolean;
  tokenInfo?: TokenInfo;
  // Added dtaValue to context for clarity, especially for the confirmation screen
  dtaValue?: string; 
}

interface UpdateContextDataParams {
  ticket?: string;
  session?: any;
  tokenBalance?: TokenBalance;
  order?: InscribeOrder;
  rawTxInfo?: RawTxInfo;
  transferAmount?: string;
  tokenInfo?: TokenInfo;
  data?: string;
}

const InscribeTransferTapScreen = () => {
  //! Hooks
  const navigate = useNavigate();
  const {showToast} = useCustomToast();
  const wallet = useWalletProvider();
  const fetchUtxos = useFetchUtxosCallback();
  const prepareSendBTC = usePrepareSendBTCCallback();

  const location = useLocation();
  const {state} = location;
  const ticker = state?.ticker || '';

  //! State
  const [loading, setLoading] = useState<boolean>(false);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const [feeRate, setFeeRate] = useState(5);
  const [inputAmount, setInputAmount] = useState('');
  const [inputError, setInputError] = useState('');
  const [outputValueError, setOutputValueError] = useState('');
  const [disabled, setDisabled] = useState(true);
  const [inputDisabled, setInputDisabled] = useState(false);
  const defaultOutputValue = 546;
  const [outputValue, setOutputValue] = useState<number>(defaultOutputValue);
  const [enableRBF, setEnableRBF] = useState(false);

  const [contextData, setContextData] = useState<ContextData>({
    ticker: ticker,
    isApproval: false,
  });

  const {onUpdateState, getComponentState} = useTracAppsLogic()
  const {isExpanded, selectedApp} = getComponentState(0);

  const updateContextData = useCallback(
    (params: UpdateContextDataParams) => {
      setContextData(Object.assign({}, contextData, params));
    },
    [contextData, setContextData],
  );

  useEffect(() => {
    if (contextData.transferAmount) {
      setInputAmount(contextData.transferAmount.toString());
      setInputDisabled(true);
    }
  }, []);

  useEffect(() => {
    fetchUtxos();
    wallet
      .getTapSummary(activeAccount.address, contextData.ticker)
      .then(v => {
        updateContextData({
          tokenBalance: v.tokenBalance,
          tokenInfo: v.tokenInfo,
        });
      })
      .catch(e => {
        showToast({
          title: (e as Error).message || '',
          type: 'error',
        });
      });
  }, []);

  useEffect(() => {
    setInputError('');
    setOutputValueError('');
    setDisabled(true);
    if (inputAmount.split('.').length > 1) {
      const decimal = inputAmount.split('.')[1].length;
      const token_decimal = contextData.tokenInfo?.decimal || 0;
      if (decimal > token_decimal) {
        setInputError(
          `This token only supports up to ${token_decimal} decimal places.`,
        );
        return;
      }
    }

    if (!inputAmount) {
      return;
    }

    const amount = new BigNumber(inputAmount);
    if (!amount) {
      return;
    }

    if (!contextData.tokenBalance) {
      return;
    }

    if (amount.lte(0)) {
      return;
    }

    if (amount.gt(contextData.tokenBalance.availableBalance)) {
      setInputError('Insufficient Balance');
      return;
    }

    if (isExpanded && !selectedApp?.address) return;
    
    
    if (feeRate <= 0) {
      return;
    }

    const dust = getUtxoDustThreshold(activeWallet.addressType);
    if (outputValue < dust) {
      setOutputValueError(`OutputValue must be at least ${dust}`);
      return;
    }

    if (!outputValue) {
      return;
    }

    setDisabled(false);
  }, [inputAmount, feeRate, outputValue, contextData.tokenBalance, isExpanded, selectedApp]);

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const amountOnChangeText = (input: string) => {
    if (input.split('.').length > 1) {
      const decimal = input.split('.')[1].length;
      const token_decimal = contextData.tokenInfo?.decimal || 0;
      if (decimal > token_decimal) {
        setInputError(
          `This token only supports up to ${token_decimal} decimal places.`,
        );
        return;
      }
    }

    const cleanText = input.replace(/[^0-9.]/g, '');
    const dotCount = (cleanText.match(/\./g) || []).length;
    if (dotCount > 1) {
      return;
    }
    setInputAmount(cleanText);
  };


  // NEEDS TO COMPLETE THE RAW TX INFO YET
  const inscribeOnPressed = async () => {
    try {
      setLoading(true);
      const amount = inputAmount;
      
      // --------- DTA logic for TX 1 (Make Transferable) ---------
      let data: string;
      
      if (isExpanded && selectedApp?.address) {
          data = `{"p":"tap","op":"token-transfer","tick":"${contextData.ticker}","amt":"${String(amount)}","dta":{"op":"deposit","addr":"${selectedApp.address}"}}`
      }
      
      // The destination address for the Inscription UTXO in TX 1 MUST be the user's own address.
      const inscriptionDestinationAddress = activeAccount.address;

      // --------- Call the Wallet API (Crucial Change) ---------
      // NOTE: This assumes your wallet.createOrderTransfer now accepts dtaValue
      const order = await wallet.createOrderTransfer(
        inscriptionDestinationAddress, // Send the new inscription UTXO back to the user
        contextData.ticker,
        amount,
        feeRate,
        outputValue,
        data
      );
      
      // --------- Prepare BTC Fee Transaction ---------
      const rawTxInfo = await prepareSendBTC({
        toAddressInfo: {address: order.payAddress, domain: ''},
        toAmount: Math.round(order.totalFee),
        feeRate: feeRate,
        enableRBF: enableRBF,
      });
      
      // --------- Navigate to Confirmation ---------
      updateContextData({order, transferAmount: amount, rawTxInfo, data});
      navigate('/home/inscribe-confirm', {
        state: {
          contextDataParam: {
            ...contextData,
            order,
            transferAmount: amount,
            rawTxInfo,
            data,
          },
        },
      });
    } catch (e) {
      showToast({
        title: (e as Error).message || '',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <UX.Loading />;
  }

  //! Renders
  return (
    <LayoutTap
      header={
        <UX.TextHeader text={'Inscribe Transfer'} onBackClick={handleGoBack} />
      }
      body={
        <UX.Box style={{width: '100%'}}>
          <UX.Box spacing="xxl">
            <UX.Box spacing="xss">
              {contextData.tokenBalance ? (
                <UX.Box layout="row_between">
                  <UX.Text
                    styleType="heading_16"
                    customStyles={{color: 'white'}}
                    title="Available"
                  />
                  <UX.Box layout="row" spacing="xs">
                    <UX.Text
                      title={formatNumberValue(
                        contextData?.tokenBalance?.availableBalance ?? '0',
                      )}
                      styleType="body_12_bold"
                      customStyles={{color: colors.white}}
                    />
                    <UX.Text
                      title={formatTicker(contextData?.tokenBalance?.ticker)}
                      styleType="body_12_bold"
                      customStyles={{color: colors.main_500, whiteSpace: 'pre'}}
                    />
                  </UX.Box>
                </UX.Box>
              ) : (
                <UX.Text
                  title={'Loading...'}
                  styleType="body_14_normal"
                  customStyles={{color: colors.smoke}}
                />
              )}

              <UX.AmountInput
                style={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  backgroundColor: 'transparent',
                }}
                disableCoinSvg={true}
                disabled={inputDisabled}
                value={formatAmountNumber(inputAmount)}
                onAmountInputChange={amountOnChangeText}
                placeholder="Amount"
              />
              {inputError && (
                <UX.Text
                  styleType="body_12_bold"
                  customStyles={{color: colors.red_700}}
                  title={inputError}
                />
              )}
            </UX.Box>

            {/* TRAC APPS SELECTION */}
            <TransferApps 
              id={0} isExpanded={isExpanded} 
              onUpdateState={onUpdateState} 
              selectedApp={selectedApp} 
              token={ticker}  />

            <UX.Box spacing="xss">
              <UX.Text
                styleType="heading_16"
                customStyles={{color: 'white'}}
                title="Output Value"
              />
              <OutputValueBar
                defaultValue={defaultOutputValue}
                minValue={defaultOutputValue}
                onChange={val => setOutputValue(val)}
              />
              {outputValueError && (
                <UX.Text
                  styleType="body_12_bold"
                  customStyles={{color: colors.red_700}}
                  title={outputValueError}
                />
              )}
            </UX.Box>
            <UX.Box spacing="xss">
              <UX.Text
                styleType="heading_16"
                customStyles={{color: 'white'}}
                title="Fee rate"
              />
              <FeeRateBar
                onChange={val => {
                  setFeeRate(val);
                }}
              />
            </UX.Box>
          </UX.Box>
          <RBFBar
            onChange={val => {
              setEnableRBF(val);
            }}
          />
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
            title={'Next'}
            isDisable={disabled}
            onClick={inscribeOnPressed}
          />
        </UX.Box>
      }
    />
  );
};
export default InscribeTransferTapScreen;