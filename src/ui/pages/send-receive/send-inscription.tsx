import {UX} from '@/src/ui/component/index';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {getAddressType} from '@/src/ui/utils';
import {Inscription, RawTxInfo} from '@/src/wallet-instance';
import {useCallback, useEffect, useMemo, useState} from 'react';
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
import {debounce} from 'lodash';

const SendInscription = () => {
  //! State
  const navigate = useNavigate();
  const {state} = useLocation();
  const {inscriptions} = state as {
    inscriptions: Inscription[];
  };
  const setTxStateInfo = useUpdateTxStateInfo();
  const fetchUtxos = useFetchUtxosCallback();
  const [enableRBF, setEnableRBF] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [toInfo, setToInfo] = useState({address: ''});
  const [rawTxInfo, setRawTxInfo] = useState<RawTxInfo>();
  const [error, setError] = useState<string>('');
  const [feeRate, setFeeRate] = useState(5);
  const defaultOutputValue = inscriptions ? inscriptions[0].outputValue : 10000;

  const [outputValue, setOutputValue] = useState(defaultOutputValue);

  // to prevent rerender effect to show message error

  const {showToast} = useCustomToast();

  const onAddressChange = (address: string) => {
    setToInfo({address: address});
    setTxStateInfo({toInfo: {address: address}});
  };

  useEffect(() => {
    const ignoreAssets = inscriptions.map(ins => ins.inscriptionId);
    fetchUtxos(ignoreAssets).finally(() => {});
  }, [inscriptions]);

  const minOutputValue = useMemo(() => {
    if (toInfo.address) {
      const receiverAddressType = getAddressType(toInfo.address);
      const offset = inscriptions.reduce((acc, ins) => {
        if (ins.offset > acc) {
          acc = ins.offset;
        }
        return acc;
      }, 0);
      return Math.max(getUtxoDustThreshold(receiverAddressType), offset +1);
    } else {
      return 0;
    }
  }, [toInfo.address, inscriptions]);

  const prepareSendInscription = usePrepareSendOrdinalsInscriptionCallback();

  useEffect(() => {
    setDisabled(true);
    setError('');

    if (feeRate <= 0) {
      setError('Invalid fee rate');
      return;
    }

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
      inscriptionId: inscriptions[0].inscriptionId,
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

  const debouncedSetOutputValue = useCallback(
    debounce((val: number) => {
      setOutputValue(val);
    }, 400),
    [],
  );

  //! Effect Function
  useEffect(() => {
    return () => {
      debouncedSetOutputValue.cancel();
    };
  }, []);

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
          {toInfo.address && (
            <UX.Box spacing="xss">
              <UX.Text
                styleType="heading_16"
                customStyles={{color: 'white'}}
                title="OutputValue"
              />
              <OutputValueBar
                defaultValue={defaultOutputValue}
                minValue={minOutputValue}
                onChange={val => {
                  debouncedSetOutputValue(val);
                }}
              />
            </UX.Box>
          )}
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
