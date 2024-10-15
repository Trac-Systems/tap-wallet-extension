import {
  amountToSatoshis,
  formatAmountNumber,
  satoshisToAmount,
} from '@/src/ui/../shared/utils/btc-helper';
import {UX} from '@/src/ui/component/index';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {TransactionSelector} from '@/src/ui/redux/reducer/transaction/selector';
import {colors} from '@/src/ui/themes/color';
import {AmountInput, useAppSelector, validateAmountInput} from '@/src/ui/utils';
import {COIN_DUST, RawTxInfo} from '@/src/wallet-instance';
import {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import Text from '../../component/text-custom';
import {useCustomToast} from '../../component/toast-custom';
import {useAccountBalance} from '../home-flow/hook';
import {FeeRateBar} from './component/fee-rate-bar';
import {RBFBar} from './component/rbf-bar';
import {
  useFetchUtxosCallback,
  usePrepareSendBTCCallback,
  useSafeBalance,
  useUpdateTxStateInfo,
} from './hook';

const SendBTC = () => {
  //! State
  const navigate = useNavigate();
  const accountBalance = useAccountBalance();
  const safeBalance = useSafeBalance();
  const bitcoinTx = useAppSelector(TransactionSelector.bitcoinTx);
  const setTxStateInfo = useUpdateTxStateInfo();
  const txStateInfo = useAppSelector(TransactionSelector.txStateInfo);
  const fetchUtxos = useFetchUtxosCallback();
  const [enableRBF, setEnableRBF] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [toInfo, setToInfo] = useState({address: ''});
  const [rawTxInfo, setRawTxInfo] = useState<RawTxInfo>();
  const [btcInputError, setBTCInputError] = useState<string>('');
  const inputAmount = txStateInfo.inputAmount;
  const [feeRate, setFeeRate] = useState(5);
  const {showToast} = useCustomToast();
  const [btcSendNumberValue, setBTCSendNumberValue] = useState('');

  const onAddressChange = (address: string) => {
    setToInfo({address: address});
    setTxStateInfo({toInfo: {address: address}});
  };

  const onAmountChange = (input: string) => {
    const formattedInput = input.replace(/,/g, '.');
    if (validateAmountInput(formattedInput, AmountInput.BTC)) {
      setTxStateInfo({inputAmount: formattedInput});
    }
  };

  useEffect(() => {
    fetchUtxos().finally(() => {});
  }, []);

  const prepareSendBTC = usePrepareSendBTCCallback();

  const availableSatoshis = useMemo(() => {
    return amountToSatoshis(safeBalance);
  }, [safeBalance]);

  const toSatoshis = useMemo(() => {
    if (!inputAmount) {
      return 0;
    }
    return amountToSatoshis(inputAmount);
  }, [inputAmount]);

  const spendUnavailableUtxos = useAppSelector(
    TransactionSelector.spendUnavailableUtxos,
  );

  const spendUnavailableSatoshis = useMemo(() => {
    return spendUnavailableUtxos.reduce((acc, cur) => {
      return acc + cur.satoshi;
    }, 0);
  }, [spendUnavailableUtxos]);
  const unavailableSatoshis = accountBalance.amount - availableSatoshis;
  const availableAmount = safeBalance;
  const unavailableAmount = satoshisToAmount(unavailableSatoshis);
  const totalAmount = satoshisToAmount(accountBalance.amount);

  const spendUnavailableAmount = satoshisToAmount(
    unavailableSatoshis - spendUnavailableSatoshis,
  );

  const clearErrorMessage = () => {
    setBTCInputError('');
  };
  useEffect(() => {
    setDisabled(true);
    setBTCInputError('');

    if (!toSatoshis) {
      return;
    }
    if (toSatoshis < COIN_DUST) {
      setBTCInputError(
        `Amount must be at least ${satoshisToAmount(COIN_DUST)} BTC`,
      );
      return;
    }

    if (toSatoshis > availableSatoshis + spendUnavailableSatoshis) {
      setBTCInputError('Amount exceeds your available balance');
      return;
    }

    if (!toInfo.address) {
      return;
    }
    if (feeRate <= 0) {
      return;
    }

    if (
      toInfo.address === bitcoinTx.toAddress &&
      toSatoshis === bitcoinTx.toSatoshis &&
      feeRate === bitcoinTx.feeRate &&
      enableRBF === bitcoinTx.enableRBF
    ) {
      clearErrorMessage();
      setDisabled(false);
      return;
    }

    prepareSendBTC({
      toAddressInfo: toInfo,
      toAmount: toSatoshis,
      feeRate,
      enableRBF,
    })
      .then(data => {
        setRawTxInfo(data);
        clearErrorMessage();
        setDisabled(false);
      })
      .catch(e => {
        setDisabled(true);
        // if (e.code === -2) {
        //   setCustomRateInputError(e.message);
        //   return;
        // }
        showToast({
          title: (e as Error).message || '',
          type: 'error',
        });
      });
  }, [toInfo, inputAmount, feeRate, enableRBF, toSatoshis]);

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = () => {
    navigate('/home/send-btc-confirm', {
      state: {rawTxInfo},
    });
  };
  const onBTCAmountChange = (input: string) => {
    const cleanText = input.replace(/[^0-9.]/g, '');
    const dotCount = (cleanText.match(/\./g) || []).length;
    if (dotCount > 1) {
      return;
    }
    if (validateAmountInput(cleanText, AmountInput.BTC)) {
      setBTCSendNumberValue(cleanText);
      setTxStateInfo({inputAmount: cleanText});
    }
  };

  //! Render
  return (
    <LayoutSendReceive
      header={<UX.TextHeader text="Send BTC" onBackClick={handleGoBack} />}
      body={
        <UX.Box spacing="xxl" style={{width: '100%'}}>
          <UX.Box layout="column" style={{width: '100%'}} spacing="xss">
            <UX.Box layout="row_between">
              <UX.Text
                styleType="heading_16"
                customStyles={{color: 'white'}}
                title="Send"
              />
              <UX.Box layout="row" spacing="xs">
                <UX.Text title="Available:" styleType="body_14_bold" />
                <UX.Text
                  title={`${availableAmount} BTC`}
                  styleType="body_14_bold"
                  customStyles={{color: colors.green_500}}
                />
              </UX.Box>
            </UX.Box>
            <UX.AmountInput
              style={{
                fontSize: '20px',
                lineHeight: '28px',
                background: 'transparent',
              }}
              value={formatAmountNumber(btcSendNumberValue)}
              onAmountInputChange={amount => {
                onBTCAmountChange(amount);
              }}
            />
            <Text
              title={btcInputError}
              styleType="body_14_bold"
              customStyles={{color: colors.red_500, marginTop: '4px'}}
            />
            <UX.Box>
              <UX.Box layout="row_between" style={{width: '100%'}}>
                <UX.Text styleType="body_14_bold" title="Unavailable:" />
                <UX.Box layout="row" spacing="xss_s">
                  <UX.Text
                    title={
                      spendUnavailableSatoshis > 0
                        ? spendUnavailableAmount
                        : unavailableAmount
                    }
                    styleType="body_14_bold"
                  />
                  <UX.Text title="BTC" styleType="body_14_bold" />
                </UX.Box>
              </UX.Box>
              <UX.Box layout="row_between" style={{width: '100%'}}>
                <UX.Text styleType="body_14_bold" title="Total" />
                <UX.Box layout="row" spacing="xss_s">
                  <UX.Text title={totalAmount} styleType="body_14_bold" />
                  <UX.Text title="BTC" styleType="body_14_bold" />
                </UX.Box>
              </UX.Box>
            </UX.Box>
          </UX.Box>
          <UX.Box spacing="xss">
            <UX.Text
              styleType="heading_16"
              customStyles={{color: 'white'}}
              title="Receiver"
            />
            <UX.AddressInput
              style={{
                fontSize: '16px',
                border: 'none',
                background: 'transparent',
                width: '100%',
              }}
              addressInputData={toInfo}
              onAddressInputChange={val => {
                onAddressChange(val?.address);
              }}
              autoFocus={true}
            />
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

            <RBFBar
              onChange={val => {
                setEnableRBF(val);
              }}
            />
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
            isDisable={disabled}
            title="Continue"
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default SendBTC;
