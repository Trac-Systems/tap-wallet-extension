import {getUtxoDustThreshold} from '@/src/background/utils';
import {formatTicker} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import LayoutTap from '@/src/ui/layouts/tap';
import {TransactionSelector} from '@/src/ui/redux/reducer/transaction/selector';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {colors} from '@/src/ui/themes/color';
import {getAddressType, useAppSelector} from '@/src/ui/utils';
import {useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {FeeRateBar} from '../../../send-receive/component/fee-rate-bar';
import {OutputValueBar} from '../../../send-receive/component/output-value';
import {RBFBar} from '../../../send-receive/component/rbf-bar';
import {
  useFetchUtxosCallback,
  usePrepareSendOrdinalsInscriptionCallback,
  usePrepareSendOrdinalsInscriptionsCallback,
  useUpdateTxStateInfo,
} from '../../../send-receive/hook';
import TransferApps from '../../../authority/component/trac-apps'
import { useTracAppsLogic, TRAC_APPS_BITCOIN_ADDRESSES } from '../../../authority/hook/use-trac-apps-logic'
import { dta } from '@/src/ui/interfaces'
import {useInscriptionsWithDta} from '../../hook';


interface IProps {
  ticker?: string;
  amount?: string;
  inscriptionIdSet?: Set<string>;
}

const TransferTap = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {showToast} = useCustomToast();
  const {state} = location;
  const defaultOutputValue = 546;
  const {amount, ticker, inscriptionIdSet} = state as IProps;
  const wallet = useAppSelector(WalletSelector.activeWallet);
  const dust = getUtxoDustThreshold(wallet.addressType);
  const setTxStateInfo = useUpdateTxStateInfo();
  const txStateInfo = useAppSelector(TransactionSelector.txStateInfo);
  const [disabled, setDisabled] = useState(true);
  const [toInfo, setToInfo] = useState({address: ''});
  const [outputValueError, setOutputValueError] = useState<string>('');
  const [outputValue, setOutputValue] = useState<number>(defaultOutputValue);
  const fetchUtxos = useFetchUtxosCallback();
  const [isLoading, setIsLoading] = useState(false);
  const prepareSendOrdinalsInscriptions =
    usePrepareSendOrdinalsInscriptionsCallback();
  const prepareSendOrdinalsInscription =
    usePrepareSendOrdinalsInscriptionCallback();
  const [enableRBF, setEnableRBF] = useState(false);
  const getAddressTypeReceiver = getAddressType(toInfo.address);

  const {onUpdateState, getComponentState} = useTracAppsLogic()
  const {isExpanded, selectedApp} = getComponentState(0);

  const {dtaAmount, dtaInscriptionsIds} = useInscriptionsWithDta(
    inscriptionIdSet ? Array.from(inscriptionIdSet) : [],
  );


  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = async () => {
    try {
      setIsLoading(true);

      // Determine if is DTA mode
      const useDtaMode = isExpanded && dtaInscriptionsIds.length > 0;
      
      // Prepare inscriptions IDs
      const inscriptionIds = useDtaMode 
        ? dtaInscriptionsIds 
        : Array.from(inscriptionIdSet);
      
      // Return without inscriptions
      if (inscriptionIds.length === 0) {
        showToast({ title: 'Nenhuma inscrição para enviar.', type: 'error' });
        return;
      }

      // Basic config for conventional transfer
      let finalAddress = toInfo.address;
      let dtaPayload: dta | undefined;
      let finalAssetAmount = amount;

      // Custom config for Trac Apps DTA transfer
      if (useDtaMode && selectedApp) {
          const appNameKey = selectedApp.name.toLowerCase();
          finalAddress = TRAC_APPS_BITCOIN_ADDRESSES[appNameKey];
          
          dtaPayload = {op: "deposit", addr: selectedApp.address};
          finalAssetAmount = dtaAmount.toString();
      }

      // 3. Prepare transaction
      if (inscriptionIds.length === 1) {
        const rawTxInfo = await prepareSendOrdinalsInscription({
          toAddressInfo: {address: finalAddress},
          inscriptionId: inscriptionIds[0],
          feeRate: txStateInfo.feeRate,
          outputValue: outputValue,
          enableRBF,
          assetAmount: finalAssetAmount,
          ticker: ticker,
          dta: dtaPayload,
        });
        navigate('/home/confirm-transaction', {
          state: {rawTxInfo},
        });
      } else {
        const rawTxInfo = await prepareSendOrdinalsInscriptions({
          toAddressInfo: {address: finalAddress},
          inscriptionIds,
          feeRate: txStateInfo.feeRate,
          enableRBF,
          assetAmount: finalAssetAmount,
          ticker: ticker,
          dta: dtaPayload,
        });
        navigate('/home/confirm-transaction', {
          state: {rawTxInfo},
        });
      }
    } catch (e) {
      const error = e as Error;
      showToast({
        title: error.message || '',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleAddressChange = (address: string) => {
    setToInfo({address: address});
    setTxStateInfo({toInfo: {address: address}});
  };

  const isShowOutputValue = useMemo(() => {
    const inscriptionIds = Array.from(inscriptionIdSet);
    return toInfo.address && inscriptionIds.length === 1;
  }, [toInfo.address, inscriptionIdSet]);

  useEffect(() => {
    fetchUtxos().finally(() => {});
  }, []);

  useEffect(() => {
    setDisabled(true);
    setOutputValueError('');

    if (!toInfo.address && !isExpanded || isExpanded && !selectedApp?.address) {
      return;
    }

    if (outputValue < getUtxoDustThreshold(getAddressTypeReceiver)) {
      setOutputValueError(
        `OutputValue must be at least ${getUtxoDustThreshold(getAddressTypeReceiver)}`,
      );
      return;
    }
    setDisabled(false);
  }, [toInfo.address, outputValue, isExpanded, selectedApp, setDisabled, setOutputValueError]);

  if (isLoading) {
    return <UX.Loading />;
  }

  return (
    <LayoutTap
      header={<UX.TextHeader text="Transfer Tap" onBackClick={handleGoBack} />}
      body={
        <UX.Box spacing="xl" style={{width: '100%'}}>
          <UX.Box spacing="xs">
            <UX.Text title="Send" styleType="heading_14" />
            <UX.Input
              style={{whiteSpace: 'pre'}}
              value={`${dtaInscriptionsIds.length > 0 && isExpanded ? dtaAmount : amount} ${formatTicker(ticker)}`}
              disabled
            />
          </UX.Box>
          {!isExpanded && (
            <UX.Box spacing="xs">
            <UX.Text title="Receiver" styleType="heading_14" />
            <UX.AddressInput
              style={{
                fontSize: '16px',
                border: 'none',
                background: 'transparent',
                width: '100%',
              }}
              addressInputData={toInfo}
              onAddressInputChange={val => {
                handleAddressChange(val?.address);
              }}
              autoFocus={true}
            />
          </UX.Box>)}
          {dtaInscriptionsIds.length > 0 && (
            <TransferApps 
              id={0} isExpanded={isExpanded} 
              onUpdateState={onUpdateState} 
              selectedApp={selectedApp} 
              token={ticker}  />
)}

          {isShowOutputValue && (
            <UX.Box spacing="xs">
              <UX.Text
                styleType="heading_14"
                customStyles={{color: 'white'}}
                title="Output Value"
              />
              <OutputValueBar
                defaultValue={defaultOutputValue}
                minValue={dust}
                onChange={val => {
                  setOutputValue(val);
                }}
              />
              {outputValueError && (
                <UX.Text
                  title={outputValueError}
                  customStyles={{color: colors.red_700}}
                  styleType="body_12_bold"
                />
              )}
            </UX.Box>
          )}
          <UX.Box spacing="xs">
            <UX.Text title="Fee rate" styleType="heading_14" />
            <FeeRateBar
              onChange={val => {
                setTxStateInfo({feeRate: val});
              }}
            />
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
            isDisable={disabled}
            styleType="primary"
            title="Next"
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};
export default TransferTap;
