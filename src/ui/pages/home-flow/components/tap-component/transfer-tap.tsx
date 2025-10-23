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
  const [filteredAmount, setFilteredAmount] = useState<string>("0");
  const [filteredInscriptionIds, setFilteredInscriptionIds] = useState<string[]>([]);

  const {onUpdateState, getComponentState} = useTracAppsLogic()
  const {isExpanded, selectedApp} = getComponentState(0);

  const {dtaAmount, dtaInscriptions, dtaInscriptionsIds} = useInscriptionsWithDta(
    inscriptionIdSet ? Array.from(inscriptionIdSet) : [],
  );  

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = async () => {
    try {
      setIsLoading(true);
      // Prepare inscriptions IDs
      const inscriptionIds = filteredInscriptionIds;
      const finalAmount = filteredAmount;

      // Determine if is DTA mode
      const useDtaMode = isExpanded && inscriptionIds.length > 0 && selectedApp?.address;
      
      // Return without inscriptions
      if (inscriptionIds.length === 0) {
        showToast({ title: 'No inscription to transfer.', type: 'error' });
        return;
      }

      // Basic config for conventional transfer
      let finalAddress = toInfo.address;
      let dtaPayload: string | undefined = undefined;
      
      // Custom config for Trac Apps DTA transfer
      if (useDtaMode) {
          const appNameKey = selectedApp.name.toLowerCase();
          finalAddress = TRAC_APPS_BITCOIN_ADDRESSES[appNameKey];
          dtaPayload = JSON.stringify({op: "deposit", addr: selectedApp.address});
      }

      // Prepare transaction
      if (inscriptionIds.length === 1) {
        const rawTxInfo = await prepareSendOrdinalsInscription({
          toAddressInfo: {address: finalAddress},
          inscriptionId: filteredInscriptionIds[0],
          feeRate: txStateInfo.feeRate,
          outputValue: outputValue,
          enableRBF,
          assetAmount: finalAmount,
          ticker: ticker,
          dta: dtaPayload,
        });
        navigate('/home/confirm-transaction', {
          state: {rawTxInfo},
        });
      } else {
        const rawTxInfo = await prepareSendOrdinalsInscriptions({
          toAddressInfo: {address: finalAddress},
          inscriptionIds: filteredInscriptionIds,
          feeRate: txStateInfo.feeRate,
          enableRBF,
          assetAmount: finalAmount,
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

  useEffect(() => {
    let _filteredAmount = 0;
    let _filteredInscriptionIds: string[] = [];
    const useDtaMode = isExpanded && dtaInscriptions.length > 0;

    if (useDtaMode && selectedApp && selectedApp?.address !== "") {
      const targetAppName = selectedApp.name.toLowerCase();      
      const filteredInscriptions = dtaInscriptions.filter(inscription => {
        try {
          const payload = JSON.parse(inscription?.dta as string); 
          return payload.appName && payload.appName === targetAppName;
        } catch (e) {
          return false;
        }
      });

      _filteredInscriptionIds = filteredInscriptions.map(inscription => inscription.inscriptionId);
      _filteredAmount = filteredInscriptions.reduce((sum, inscription) => {
        return sum + (parseInt(inscription.amt || '0'));
      }, 0);

    } else if (useDtaMode) {
      _filteredAmount = dtaAmount;
      _filteredInscriptionIds = dtaInscriptionsIds;
      
    } else {
      _filteredAmount = parseInt(amount || '0');
      _filteredInscriptionIds = inscriptionIdSet ? Array.from(inscriptionIdSet) : [];
    }

    setFilteredAmount(_filteredAmount.toString());
    setFilteredInscriptionIds(_filteredInscriptionIds);

  }, [amount, inscriptionIdSet, dtaAmount, dtaInscriptions, dtaInscriptionsIds, isExpanded, selectedApp]); 

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
              value={`${filteredAmount} ${formatTicker(ticker)}`}
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

          {isExpanded && !selectedApp && dtaInscriptionsIds.length > 0 && (
            <UX.Box spacing="xl" className='' style={{backgroundColor: colors.gray, textAlign: "center", borderRadius: 20, padding: 10, paddingLeft: 50, paddingRight: 50}}>
              <UX.Text
                  title="The inscriptions ready to transfer to a Trac App are set. Select an app to proceed."
                  styleType='body_12_bold'
              />
            </UX.Box>
          )}

          {isExpanded && selectedApp && selectedApp?.address !== "" && dtaInscriptionsIds.length > 0 && (
            <UX.Box spacing="xl" className='' style={{backgroundColor: colors.red_700, textAlign: "center", borderRadius: 20, padding: 10, paddingLeft: 50, paddingRight: 50}}>
              <UX.Text
                  title={`You are only transferring inscriptions destinated to ${selectedApp.name}. Make sure this is correct before proceed.`}
                  customStyles={{color: colors.white}}
                  styleType='body_12_bold'
              />
            </UX.Box>
          )}

          {isShowOutputValue && (
            <UX.Box spacing="xs">
              <UX.Text
                styleType="heading_14"
                customStyles={{color: colors.white}}
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
