import {UX} from '@/src/ui/component/index';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {getAddressType} from '@/src/ui/utils';
import {Inscription, RawTxInfo} from '@/src/wallet-instance';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useCustomToast} from '../../component/toast-custom';
import {FeeRateBar} from './component/fee-rate-bar';
import {RBFBar} from './component/rbf-bar';
import Text from '../../component/text-custom';
import {
  useFetchUtxosCallback,
  usePrepareSendOrdinalsInscriptionCallback,
  useUpdateTxStateInfo,
} from './hook';
import InscriptionPreview from '@/src/ui/component/inscription-preview';
import {OutputValueBar} from '@/src/ui/pages/send-receive/component/output-value';
import {getUtxoDustThreshold} from '@/src/background/utils';
import {colors} from '@/src/ui/themes/color';

const SendInscription = () => {
  //! State
  const navigate = useNavigate();
  const {state} = useLocation();
  const {inscription} = state as {
    inscription: Inscription;
  };
  const setTxStateInfo = useUpdateTxStateInfo();
  const fetchUtxos = useFetchUtxosCallback();
  const [enableRBF, setEnableRBF] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [toInfo, setToInfo] = useState({address: ''});
  const [rawTxInfo, setRawTxInfo] = useState<RawTxInfo>();
  const [error, setError] = useState<string>('');
  const [feeRate, setFeeRate] = useState(5);
  const defaultOutputValue = inscription ? inscription.outputValue : 10000;

  const [outputValue, setOutputValue] = useState(defaultOutputValue);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);

  // to prevent rerender effect to show message error

  const {showToast} = useCustomToast();

  const onAddressChange = (address: string) => {
    setToInfo({address: address});
    setTxStateInfo({toInfo: {address: address}});
  };

  useEffect(() => {
    fetchUtxos().finally(() => {});
  }, []);

  //   const walletProvider = useWalletProvider();

  useEffect(() => {
    setInscriptions([inscription]);
    // walletProvider.getInscriptionUtxoDetail(inscription.inscriptionId).then((v) => {
    //   setInscriptions(v.inscriptions);
    // });
  }, []);

  const minOutputValue = useMemo(() => {
    if (toInfo.address) {
      const receiverAddressType = getAddressType(toInfo.address);
      return getUtxoDustThreshold(receiverAddressType);
    } else {
      return 0;
    }
  }, [toInfo.address]);

  const prepareSendInscription = usePrepareSendOrdinalsInscriptionCallback();

  const clearErrorMessage = () => {
    setError('');
  };

  useEffect(() => {
    setDisabled(true);
    setError('');

    if (feeRate <= 0) {
      setError('Invalid fee rate');
      return;
    }

    const dustUtxo = inscription.outputValue;
    // try {
    //   if (toInfo.address) {
    //     dustUtxo = getAddressUtxoDust(toInfo.address);
    //   }
    // } catch (e) {
    //   // console.log(e);
    // }

    const maxOffset = inscriptions.reduce((pre, cur) => {
      return Math.max(pre, cur.offset);
    }, 0);

    const minOutputValue = Math.max(maxOffset + 1, dustUtxo);

    if (outputValue < minOutputValue) {
      setError(`OutputValue must be at least ${minOutputValue}`);
      return;
    }

    if (!outputValue) {
      return;
    }

    if (!toInfo.address) {
      return;
    }

    prepareSendInscription({
      toAddressInfo: toInfo,
      inscriptionId: inscription.inscriptionId,
      feeRate,
      outputValue,
      enableRBF,
    })
      .then(data => {
        setRawTxInfo(data);
        setDisabled(false);
      })
      .catch(e => {
        showToast({
          title: (e as Error).message || '',
          type: 'error',
        });
      });
  }, [toInfo, feeRate, outputValue, enableRBF]);

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = () => {
    navigate('/home/send-inscription-confirm', {
      state: {rawTxInfo},
    });
  };

  //! Render
  return (
    <LayoutSendReceive
      header={
        <UX.TextHeader text="Send Inscription" onBackClick={handleGoBack} />
      }
      body={
        <UX.Box spacing="xxl" style={{width: '100%'}}>
          <UX.Box layout="row" style={{width: '100%'}} spacing="xss">
            {inscriptions.map(v => (
              <InscriptionPreview
                key={v.inscriptionId}
                data={v}
                preset="small"
              />
            ))}
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
            {toInfo.address && (
              <OutputValueBar
                defaultValue={defaultOutputValue}
                minValue={minOutputValue}
                onChange={val => {
                  setOutputValue(val);
                }}
              />
            )}
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
          <Text
            title={error}
            styleType="body_14_bold"
            customStyles={{color: colors.red_500, marginTop: '4px'}}
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
            isDisable={disabled}
            title="Continue"
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default SendInscription;
