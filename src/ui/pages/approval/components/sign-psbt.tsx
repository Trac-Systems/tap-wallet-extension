import {
  formatNumberValue,
  satoshisToAmount,
} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {copyToClipboard} from '@/src/ui/helper';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {
  formatAddressLongText,
  shortAddress,
  useAppSelector,
  validateBtcAddress,
} from '@/src/ui/utils';
import {
  ExtractPsbt,
  InputForSigning,
  RawTxInfo,
  TransactionSigningOptions,
  TxType,
} from '@/src/wallet-instance';
import {isEmpty} from 'lodash';
import {useCallback, useEffect, useMemo, useState} from 'react';
import WebsiteBar from '../../../component/website-bar';
import {useWalletProvider} from '../../../gateway/wallet-provider';
import {GlobalSelector} from '../../../redux/reducer/global/selector';
import {
  usePrepareSendBTCCallback,
  usePrepareSendOrdinalsInscriptionCallback,
  usePrepareSendOrdinalsInscriptionsCallback,
} from '../../send-receive/hook';
import {useApproval} from '../hook';
import LayoutApprove from '../layouts';
interface Props {
  params: {
    data: {
      psbtHex: string;
      options: TransactionSigningOptions;
      type: TxType;
      toAddress?: string;
      satoshis?: number;
      feeRate?: number;
      inscriptionId?: string;
      inscriptionIds?: string[];
      transferAmount: string;
      ticker: string;
      rawTxInfo: RawTxInfo;
    };
    session?: {
      origin: string;
      icon: string;
      name: string;
    };
    onBackClick?: () => void;
  };
}

const SignPsbt = ({
  params: {
    data: {
      psbtHex,
      options,
      satoshis,
      inscriptionId,
      inscriptionIds,
      type,
      toAddress,
      feeRate,
      ticker,
      transferAmount,
    },
    session,
    onBackClick,
  },
}: Props) => {
  //! State
  const {showToast} = useCustomToast();
  const [isLoading, setIsLoading] = useState(false);
  const [rawTxInfo, setRawTxInfo] = useState<RawTxInfo>();
  const [usdPriceSpendAmount, setUsdPriceSpendAmount] = useState(0);
  const [usdPriceAmount, setUsdPriceAmount] = useState(0);
  const [extractTx, setExtractTx] = useState<ExtractPsbt>({
    outputs: [],
    inputs: [],
    feeRate: 0,
    fee: 0,
    features: {
      rbf: false,
    },
  });
  const [inputsForSign, setInputsForSign] = useState<InputForSigning[]>([]);
  const account = useAppSelector(AccountSelector.activeAccount);
  const network = useAppSelector(GlobalSelector.networkType);
  const activeAccountAddress = account.address;
  const walletProvider = useWalletProvider();
  const prepareSendBTC = usePrepareSendBTCCallback();
  const prepareSendInscription = usePrepareSendOrdinalsInscriptionCallback();
  const prepareSendOrdinalsInscriptions =
    usePrepareSendOrdinalsInscriptionsCallback();

  const [, resolveApproval, rejectApproval] = useApproval();

  const handleCancel = () => {
    rejectApproval();
  };

  const handleConfirm = () => {
    resolveApproval({
      psbtHex: rawTxInfo?.psbtHex,
      signed: type !== TxType.SIGN_TX,
    });
  };

  const handleCopied = text => {
    copyToClipboard(text).then(() => {
      showToast({
        type: 'copied',
        title: 'Copied',
      });
    });
  };

  const init = useCallback(async () => {
    if (type === TxType.SIGN_TX) {
      if (!psbtHex) {
        rejectApproval('psbtHex is required');
      }
      const _extractTx = await walletProvider.extractTransactionFromPsbtHex(
        psbtHex,
        false,
      );
      setExtractTx(_extractTx);

      const _inputForSign = await walletProvider.formatOptionsInputForSignings(
        psbtHex,
        options,
      );
      setInputsForSign(_inputForSign);
      return;
    }
    if (!toAddress || !validateBtcAddress(toAddress, network)) {
      rejectApproval('Invalid receiver address');
    }
    if (!feeRate || Number(feeRate) < 0) {
      rejectApproval('Fee rate must be greater than 0');
    }
    const toAddressInfo = {address: toAddress};
    if (type === TxType.SEND_BITCOIN) {
      prepareSendBTC({
        toAddressInfo,
        toAmount: satoshis,
        feeRate,
        enableRBF: false,
      })
        .then(data => {
          setRawTxInfo(data);
        })
        .catch(e => {
          showToast({
            title: e.message,
            type: 'error',
          });

          rejectApproval(e.message);
        });
    }
    if (type === TxType.SEND_ORDINALS_INSCRIPTION) {
      if (inscriptionId) {
        prepareSendInscription({
          toAddressInfo,
          inscriptionId,
          feeRate: feeRate,
          // outputValue: dustThreshold,
          enableRBF: false,
        })
          .then(data => {
            setRawTxInfo(data);
          })
          .catch(e => {
            showToast({
              title: e.message,
              type: 'error',
            });
            rejectApproval(e.message);
          });
      } else {
        if (isEmpty(inscriptionIds)) {
          showToast({
            title: 'Do not have any inscriptions to send',
            type: 'error',
          });

          rejectApproval('Do not have any inscriptions to send');
        }
        prepareSendOrdinalsInscriptions({
          toAddressInfo: {address: toAddress},
          inscriptionIds,
          feeRate: feeRate,
          enableRBF: false,
          assetAmount: transferAmount,
          ticker: ticker,
        })
          .then(data => {
            setRawTxInfo(data);
          })
          .catch(e => {
            showToast({
              title: e.message,
              type: 'error',
            });
            rejectApproval(e.message);
          });
      }
    }
  }, [toAddress, satoshis, feeRate, type]);

  useEffect(() => {
    init();
  }, [toAddress, satoshis, feeRate, type]);

  useEffect(() => {
    walletProvider
      .extractTransactionFromPsbtHex(rawTxInfo?.psbtHex, true)
      .then(data => {
        setExtractTx(data);
      });
  }, [rawTxInfo?.psbtHex && type !== TxType.SIGN_TX]);

  useEffect(() => {
    setInputsForSign(rawTxInfo?.inputForSigns);
  }, [rawTxInfo?.inputForSigns && type !== TxType.SIGN_TX]);

  const netSatoshis = useMemo(() => {
    if (isEmpty(extractTx?.inputs) || isEmpty(extractTx?.outputs)) {
      return 0;
    }
    return extractTx?.outputs
      ?.filter(v => v.address !== activeAccountAddress)
      .reduce((pre, cur) => cur.value + pre, 0);
  }, [extractTx?.inputs, extractTx?.outputs]);
  const netAmount = useMemo(() => satoshisToAmount(netSatoshis), [netSatoshis]);

  const spendSatoshis = useMemo(() => {
    if (isEmpty(extractTx?.inputs) || isEmpty(extractTx?.outputs)) {
      return 0;
    }
    const inValue = extractTx?.inputs?.reduce((pre, cur) => cur.value + pre, 0);

    const outValue = extractTx?.outputs
      ?.filter(v => v.address === activeAccountAddress)
      .reduce((pre, cur) => cur.value + pre, 0);

    if (!inValue || !outValue) {
      return 0;
    }

    const spend = inValue - outValue;
    return spend;
  }, [extractTx?.inputs, extractTx?.outputs]);

  const spendAmount = useMemo(
    () => satoshisToAmount(spendSatoshis),
    [spendSatoshis],
  );

  const networkFee = useMemo(
    () => satoshisToAmount(extractTx?.fee),
    [extractTx?.fee],
  );

  const isEnable = useMemo(() => {
    if (isEmpty(inputsForSign)) {
      return false;
    }
    return true;
  }, [inputsForSign]);

  const fetchDataUSD = async () => {
    if (Number(spendAmount) || Number(netAmount)) {
      const responseSpendAmount = await walletProvider.getUSDPrice(
        Number(spendAmount),
      );
      const responseAmount = await walletProvider.getUSDPrice(
        Number(netAmount),
      );
      setUsdPriceAmount(responseAmount);
      setUsdPriceSpendAmount(responseSpendAmount);
    } else {
      setUsdPriceSpendAmount(0);
      setUsdPriceAmount(0);
    }
  };

  useEffect(() => {
    fetchDataUSD();
  }, [spendAmount, netAmount]);

  useEffect(() => {
    let timer: any;

    if (!netSatoshis || !spendSatoshis) {
      setIsLoading(true);

      timer = setTimeout(() => {
        if (!netSatoshis || !spendSatoshis) {
          setIsLoading(false);
        }
      }, 2000);
    } else {
      setIsLoading(false);
    }

    return () => clearTimeout(timer);
  }, [netSatoshis, spendSatoshis]);

  if (isLoading) {
    return <UX.Loading />;
  }

  //! Render
  return (
    <LayoutApprove
      header={<WebsiteBar session={session} />}
      body={
        <UX.Box layout="column" spacing="xl">
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
              title="You are sending"
              styleType="body_16_normal"
              customStyles={{marginTop: '24px', marginBottom: '8px'}}
            />
            <UX.Text title={`${netAmount} BTC`} styleType="heading_24" />
            <UX.Box layout="row_center" spacing="xss_s">
              <UX.Text title="≈" styleType="body_14_normal" />
              <UX.Text
                title={`${formatNumberValue(String(usdPriceAmount))} USD`}
                styleType="body_14_normal"
              />
            </UX.Box>
          </UX.Box>
          {type !== TxType.SIGN_TX && (
            <UX.Box layout="box" spacing="xl">
              <UX.Box layout="row_between">
                <UX.Text title="From" styleType="body_14_normal" />
                <UX.Text
                  title={formatAddressLongText(activeAccountAddress, 8, 6)}
                  styleType="body_14_normal"
                  customStyles={{color: 'white'}}
                />
              </UX.Box>
              <UX.Box layout="row_between">
                <UX.Text title="To" styleType="body_14_normal" />
                <UX.Text
                  title={formatAddressLongText(toAddress, 8, 6)}
                  styleType="body_14_normal"
                  customStyles={{color: 'white'}}
                />
              </UX.Box>
            </UX.Box>
          )}
          <UX.Box layout="box" spacing="xl">
            <UX.Box>
              <UX.Box layout="row_between">
                <UX.Text title="Spend amount" styleType="body_14_normal" />
                <UX.Text
                  title={`${spendAmount} BTC`}
                  styleType="body_14_normal"
                  customStyles={{color: 'white'}}
                />
              </UX.Box>
              <UX.Box layout="row_end" spacing="xss_s">
                <UX.Text title="≈" styleType="body_14_normal" />
                <UX.Text
                  title={`${formatNumberValue(String(usdPriceSpendAmount))} USD`}
                  styleType="body_14_normal"
                />
              </UX.Box>
            </UX.Box>
            {type !== TxType.SIGN_TX && (
              <>
                <UX.Box layout="row_between">
                  <UX.Text title="Network fee" styleType="body_14_normal" />
                  <UX.Text
                    title={`${networkFee} BTC`}
                    styleType="body_14_normal"
                    customStyles={{color: 'white'}}
                  />
                </UX.Box>
                <UX.Box layout="row_between">
                  <UX.Text
                    title="Network fee rate"
                    styleType="body_14_normal"
                  />
                  <UX.Text
                    title={`${rawTxInfo?.feeRate?.toString()} sat/vB`}
                    styleType="body_14_normal"
                    customStyles={{color: 'white'}}
                  />
                </UX.Box>
              </>
            )}
          </UX.Box>
          <UX.Text
            title={`INPUT (${extractTx?.inputs?.length})`}
            styleType="heading_16"
          />
          <UX.Box layout="box" spacing="xl">
            {!isEmpty(extractTx?.inputs) &&
              extractTx?.inputs.map((v, index) => {
                const isToSign = inputsForSign?.find(
                  inputForSign => inputForSign.index === index,
                )
                  ? true
                  : false;
                return (
                  <UX.Box layout="row_between" key={index}>
                    <UX.Box layout="row" spacing="xss">
                      <UX.Text
                        title={formatAddressLongText(v?.address, 8, 6)}
                        styleType="body_14_normal"
                        customStyles={{
                          color: isToSign ? colors.main_500 : colors.smoke,
                        }}
                      />
                      {isToSign && (
                        <UX.Text
                          title="to sign"
                          styleType="body_14_normal"
                          customStyles={{
                            color: colors.main_500,
                            background: colors.main_100,
                            border: '1px solid #D16B7C',
                            padding: '0 8px',
                            borderRadius: '24px',
                          }}
                        />
                      )}
                    </UX.Box>

                    <UX.Text
                      title={`${satoshisToAmount(v.value)} BTC`}
                      styleType="body_14_normal"
                      customStyles={{color: 'white'}}
                    />
                  </UX.Box>
                );
              })}
          </UX.Box>
          <UX.Text
            title={`OUTPUT (${extractTx?.outputs?.length})`}
            styleType="heading_16"
          />
          <UX.Box layout="box" spacing="xl">
            {!isEmpty(extractTx?.outputs) &&
              extractTx?.outputs?.map((v, index) => {
                const isAddressAccount = v.address === activeAccountAddress;

                return (
                  <UX.Box layout="row_between" key={index}>
                    <UX.Text
                      title={formatAddressLongText(v.address, 8, 6)}
                      styleType="body_14_normal"
                      customStyles={{
                        color: isAddressAccount
                          ? colors.main_500
                          : colors.smoke,
                      }}
                    />
                    <UX.Text
                      title={`${satoshisToAmount(v.value)} BTC`}
                      styleType="body_14_normal"
                      customStyles={{color: 'white'}}
                    />
                  </UX.Box>
                );
              })}
          </UX.Box>
          <UX.Text title="PSBT Data" styleType="heading_16" />
          <UX.Box layout="box" spacing="xl">
            <UX.Box layout="row_between">
              <UX.Text
                title={shortAddress(rawTxInfo?.psbtHex ?? psbtHex, 7)}
                styleType="body_14_normal"
              />
              <UX.Box
                layout="row"
                spacing="xss"
                onClick={() => handleCopied(rawTxInfo?.psbtHex ?? psbtHex)}>
                <UX.Text
                  title={`${rawTxInfo?.psbtHex?.length ?? psbtHex?.length / 2} bytes`}
                  styleType="body_14_normal"
                  customStyles={{color: 'white'}}
                />
                <SVG.CopyPink color="white" width={20} height={20} />
              </UX.Box>
            </UX.Box>
          </UX.Box>
        </UX.Box>
      }
      footer={
        <UX.Box layout="row" spacing="sm">
          <UX.Box style={{flex: 1}}>
            {onBackClick ? (
              <UX.Button
                title="Back"
                styleType="dark"
                onClick={onBackClick}
                customStyles={{flex: 1}}
              />
            ) : (
              <UX.Button
                title="Reject"
                styleType="dark"
                onClick={handleCancel}
                customStyles={{flex: 1}}
              />
            )}
          </UX.Box>
          <UX.Box style={{flex: 1}}>
            <UX.Tooltip isText text={isEnable ? '' : 'No input needs signing'}>
              <UX.Button
                title={type === TxType.SIGN_TX ? 'Sign' : 'Sign & Pay'}
                styleType="primary"
                onClick={handleConfirm}
                customStyles={{flex: 1}}
                isDisable={!isEnable}></UX.Button>
            </UX.Tooltip>
          </UX.Box>
        </UX.Box>
      }
    />
  );
};

export default SignPsbt;
