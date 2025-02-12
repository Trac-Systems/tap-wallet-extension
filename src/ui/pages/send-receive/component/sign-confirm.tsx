import {useNavigate} from 'react-router-dom';
import {UX} from '@/src/ui/component';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {copyToClipboard} from '@/src/ui/helper';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {
  TxType,
  RawTxInfo,
  TokenBalance,
  InscribeOrder,
} from '@/src/wallet-instance';
import {isEmpty} from 'lodash';
import {useEffect, useMemo, useState} from 'react';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {
  formatAddressLongText,
  shortAddress,
  useAppSelector,
} from '@/src/ui/utils';
import {
  formatNumberValue,
  formatTicker,
  satoshisToAmount,
} from '@/src/shared/utils/btc-helper';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';

interface Props {
  params: {
    data: {
      psbtHex: string;
      type: TxType;
      toAddress?: string;
      satoshis?: number;
      feeRate?: number;
      inscriptionId?: string;
      rawTxInfo: RawTxInfo;
    };
    session?: {
      origin: string;
      icon: string;
      name: string;
    };
  };
  order?: InscribeOrder;
  tokenBalance?: TokenBalance;
}

const SignConfirm = ({
  params: {
    data: {psbtHex, type, toAddress, rawTxInfo},
  },
  tokenBalance,
  order,
}: Props) => {
  const navigate = useNavigate();
  const {showToast} = useCustomToast();
  const [isLoading, setIsLoading] = useState(false);
  const [usdPriceSpendAmount, setUsdPriceSpendAmount] = useState(0);
  const [usdPriceAmount, setUsdPriceAmount] = useState(0);

  const wallet = useWalletProvider();

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCopied = text => {
    copyToClipboard(text).then(() => {
      showToast({
        type: 'copied',
        title: 'Copied',
      });
    });
  };

  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const activeAccountAddress = activeAccount.address;

  const isValidData = useMemo(() => {
    if (!psbtHex) {
      return false;
    }
    return true;
  }, []);

  const netSatoshis = useMemo(() => {
    if (isEmpty(rawTxInfo?.inputs) || isEmpty(rawTxInfo?.outputs)) {
      return 0;
    }

    const inValue = rawTxInfo.inputs?.reduce(
      (pre, cur) => cur.utxo.satoshi + pre,
      0,
    );

    const outValue = rawTxInfo.outputs
      ?.filter(v => v.address === activeAccountAddress)
      .reduce((pre, cur) => cur.value + pre, 0);

    if (isNaN(inValue) || isNaN(outValue)) {
      return 0;
    }

    const spend = inValue - outValue;
    return spend;
  }, []);

  const netAmount = satoshisToAmount(netSatoshis);

  const spendSatoshis = useMemo(() => {
    if (isEmpty(rawTxInfo?.inputs) || isEmpty(rawTxInfo?.outputs)) {
      return 0;
    }
    const inValue = rawTxInfo.inputs?.reduce(
      (pre, cur) => cur.utxo.satoshi + pre,
      0,
    );

    const outValue = rawTxInfo.outputs
      ?.filter(v => v.address === activeAccountAddress)
      .reduce((pre, cur) => cur.value + pre, 0);

    if (isNaN(inValue) || isNaN(outValue)) {
      return 0;
    }

    const spend = inValue - outValue;
    return spend;
  }, []);

  toAddress = useMemo(() => {
    return rawTxInfo?.toAddressInfo?.address || '';
  }, [rawTxInfo]);

  const spendAmount = satoshisToAmount(spendSatoshis);

  const networkFee = useMemo(
    () => satoshisToAmount(rawTxInfo?.fee),
    [rawTxInfo?.fee],
  );

  const fetchDataUSD = async () => {
    if (Number(spendSatoshis) || Number(netAmount)) {
      const responseSpendAmount = await wallet.getUSDPrice(
        Number(spendSatoshis),
      );
      const responseAmount = await wallet.getUSDPrice(Number(netAmount));
      setUsdPriceSpendAmount(responseSpendAmount);
      setUsdPriceAmount(responseAmount);
    } else {
      setUsdPriceSpendAmount(0);
      setUsdPriceAmount(0);
    }
  };

  useEffect(() => {
    fetchDataUSD();
  }, [spendSatoshis, netSatoshis]);

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
    <LayoutSendReceive
      header={<UX.TextHeader text="Summary" onBackClick={handleGoBack} />}
      body={
        isValidData && (
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
                title="You are sending"
                styleType="body_16_normal"
                customStyles={{marginTop: '24px', marginBottom: '8px'}}
              />
              {rawTxInfo.ticker ? (
                <UX.Text
                  title={`${rawTxInfo.assetAmount} ${formatTicker(rawTxInfo.ticker)}`}
                  styleType="heading_24"
                  customStyles={{textAlign: 'center'}}
                />
              ) : (
                <>
                  <UX.Text
                    title={`${netAmount} BTC`}
                    styleType="heading_24"
                    customStyles={{textAlign: 'center'}}
                  />
                  <UX.Box layout="row_center" spacing="xss_s">
                    <UX.Text title="≈" styleType="body_14_normal" />
                    <UX.Text
                      title={`${formatNumberValue(String(usdPriceAmount))} USD`}
                      styleType="body_14_normal"
                    />
                  </UX.Box>
                </>
              )}
            </UX.Box>
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
              <UX.Box layout="row_between">
                <UX.Text title="Network fee" styleType="body_14_normal" />
                <UX.Text
                  title={`${networkFee} BTC`}
                  styleType="body_14_normal"
                  customStyles={{color: 'white'}}
                />
              </UX.Box>
              <UX.Box layout="row_between">
                <UX.Text title="Network fee rate" styleType="body_14_normal" />
                <UX.Text
                  title={`${rawTxInfo?.feeRate?.toString()} sat/vB`}
                  styleType="body_14_normal"
                  customStyles={{color: 'white'}}
                />
              </UX.Box>
            </UX.Box>
            <UX.Text title={'FEATURES'} styleType="heading_16" />
            <UX.Box layout="box" spacing="xl">
              <UX.Box layout="row_between">
                <UX.Box layout="row" spacing="xss">
                  {rawTxInfo?.enableRBF ? (
                    <UX.Text
                      title="RBF"
                      styleType="body_14_normal"
                      customStyles={{
                        color: colors.white,
                        background: colors.green_500,
                        padding: '8px 8px',
                        borderRadius: '8px',
                      }}
                    />
                  ) : (
                    <UX.Text
                      title="RBF"
                      styleType="body_14_normal"
                      customStyles={{
                        color: colors.white,
                        background: colors.main_700,
                        padding: '8px 8px',
                        borderRadius: '8px',
                        textDecorationLine: 'line-through',
                      }}
                    />
                  )}
                </UX.Box>
              </UX.Box>
            </UX.Box>
            <UX.Text
              title={`INPUT (${rawTxInfo?.inputs?.length})`}
              styleType="heading_16"
            />
            <UX.Box layout="box" spacing="xl">
              {!isEmpty(rawTxInfo?.inputs) &&
                rawTxInfo?.inputs.map((v, index) => {
                  const isToSign = rawTxInfo.inputForSigns?.find(
                    inputForSign => inputForSign.index === index,
                  )
                    ? true
                    : false;
                  return (
                    <UX.Box layout="row_between" key={index}>
                      <UX.Box layout="row" spacing="xss">
                        <UX.Text
                          title={formatAddressLongText(v?.utxo?.address, 8, 6)}
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
                        title={`${satoshisToAmount(v?.utxo?.satoshi)} BTC`}
                        styleType="body_14_normal"
                        customStyles={{color: 'white'}}
                      />
                    </UX.Box>
                  );
                })}
            </UX.Box>
            <UX.Text
              title={`OUTPUT (${rawTxInfo?.outputs?.length})`}
              styleType="heading_16"
            />
            <UX.Box layout="box" spacing="xl">
              {!isEmpty(rawTxInfo?.outputs) &&
                rawTxInfo?.outputs?.map((v, index) => {
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
                  title={shortAddress(rawTxInfo?.psbtHex, 7)}
                  styleType="body_14_normal"
                />
                <UX.Box
                  layout="row"
                  spacing="xss"
                  onClick={() => handleCopied(rawTxInfo?.psbtHex)}>
                  <UX.Text
                    title={`${rawTxInfo?.psbtHex?.length / 2} bytes`}
                    styleType="body_14_normal"
                    customStyles={{color: 'white'}}
                  />
                  <SVG.CopyPink color="white" width={20} height={20} />
                </UX.Box>
              </UX.Box>
            </UX.Box>
          </UX.Box>
        )
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
            onClick={() =>
              navigate('/home/tx-security', {
                state: {
                  rawtx: rawTxInfo.rawtx,
                  type,
                  tokenBalance,
                  order,
                  spendInputs: rawTxInfo.inputs,
                },
              })
            }
          />
        </UX.Box>
      }
    />
  );
};

export default SignConfirm;
