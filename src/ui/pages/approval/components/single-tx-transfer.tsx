import {
  formatNumberValue,
  satoshisToAmount,
} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
import TransferPreviewTable from '@/src/ui/component/redeem-table/transfer-preview-table';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {copyToClipboard} from '@/src/ui/helper';
import LayoutTap from '@/src/ui/layouts/tap';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {
  formatAddressLongText,
  shortAddress,
  useAppSelector,
  validateBtcAddress,
  validateTapTokenAmount,
} from '@/src/ui/utils';
import {
  InscribeOrder,
  RawTxInfo,
  TokenAuth,
  TokenAuthority,
} from '@/src/wallet-instance';
import BigNumber from 'bignumber.js';
import {isEmpty} from 'lodash';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {PinInputRef} from '../../../component/pin-input';
import {useCustomToast} from '../../../component/toast-custom';
import WebsiteBar from '../../../component/website-bar';
import {FeeRateBar} from '../../send-receive/component/fee-rate-bar';
import {
  useFetchUtxosCallback,
  usePrepareSendBTCCallback,
  usePushBitcoinTxCallback,
} from '../../send-receive/hook';
import {useApproval} from '../hook';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';

enum TabKey {
  STEP1,
  STEP2,
  STEP3,
  STEP4,
}

interface RedeemItem {
  tick: string;
  amt: string;
  address: string;
  dta?: string;
}

interface Props {
  params: {
    // data must have an array of RedeemItem
    data: {
      items: RedeemItem[];
    };
    session: {
      origin: string;
      icon: string;
      name: string;
    };
  };
}
interface ContextData {
  session?: any;
  tabKey: TabKey;
  feeRate: number;
  outputValue: number;
  order?: InscribeOrder;
  items: RedeemItem[];
  redeemContent?: TokenAuth;
  currentAuthority?: TokenAuthority;
  rawTxInfo: RawTxInfo;
  rawTx?: string;
  disableBtn?: boolean;
  isLoading?: boolean;
  handleSubmitTx?: () => Promise<void>;
  handleConfirmDone?: () => Promise<void>;
}

interface UpdateContextDataParams {
  ticket?: string;
  session?: any;
  tabKey?: TabKey;
  feeRate?: number;
  outputValue?: number;
  order?: InscribeOrder;
  items?: RedeemItem[];
  redeemContent?: TokenAuth;
  currentAuthority?: TokenAuthority;
  rawTxInfo?: RawTxInfo;
  rawTx?: string;
  disableBtn?: boolean;
  isLoading?: boolean;
  handleSubmitTx?: () => Promise<void>;
  handleConfirmDone?: () => Promise<void>;
}

const defaultOutputValue = 546; //getAddressUtxoDust(account.address);

export const Step1 = ({
  contextData,
  updateContextData,
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) => {
  const account = useAppSelector(AccountSelector.activeAccount);
  const network = useAppSelector(GlobalSelector.networkType);
  const walletProvider = useWalletProvider();

  const [, , rejectApproval] = useApproval();

  // const [inputDisabled, setInputDisabled] = useState(false);

  const [tokenMap, setTokenMap] = useState<{
    [key: string]: {
      availableBalance: BigNumber;
      sendAmount: BigNumber;
    };
  }>({});

  const [insufficientTokens, setInsufficientTokens] = useState<string[]>([]);
  // Change to Map<number, boolean> to simply track invalid items
  const [invalidItemsMap, setInvalidItemsMap] = useState<Map<number, boolean>>(
    new Map(),
  );
  const [validated, setValidated] = useState<boolean>(false);


  // fetch token info on transfer list
  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        updateContextData({isLoading: true});
        const _tokenMap = {};
        const newInvalidItemsMap = new Map<number, boolean>();

        for (let i = 0; i < contextData.items.length; i++) {
          const item = contextData.items[i];
          if (!item) {
            newInvalidItemsMap.set(i, true);
            continue;
          }

          // validate address
          if (!validateBtcAddress(item?.address, network)) {
            newInvalidItemsMap.set(i, true);
            continue;
          }

          // validate ticker
          if (!item?.tick) {
            newInvalidItemsMap.set(i, true);
            continue;
          }

          try {
            if (!_tokenMap[item?.tick]) {
              const v = await walletProvider.getTapSummary(
                account.address,
                item?.tick,
              );
              // validate amount
              if (!validateTapTokenAmount(item.amt, v.tokenInfo.decimal)) {
                newInvalidItemsMap.set(i, true);
                continue;
              }

              _tokenMap[item.tick] = {
                availableBalance: BigNumber(v.tokenBalance.availableBalance),
                sendAmount: BigNumber(item.amt) || BigNumber(0),
                tokenInfo: v.tokenInfo,
              };
            } else {
              // validate amount
              if (
                !validateTapTokenAmount(
                  item.amt,
                  _tokenMap[item.tick].tokenInfo.decimal,
                )
              ) {
                newInvalidItemsMap.set(i, true);
                continue;
              }

              _tokenMap[item.tick].sendAmount = _tokenMap[
                item.tick
              ].sendAmount.plus(BigNumber(item.amt));
            }
          } catch (error) {
            console.error('Error processing item:', error);
            newInvalidItemsMap.set(i, true);
            continue;
          }
        }

        setInvalidItemsMap(newInvalidItemsMap);
        setTokenMap(_tokenMap);
      } catch (error) {
        console.error('Error in fetchTokenInfo:', error);
        rejectApproval('Error processing items');
      } finally {
        updateContextData({isLoading: false});
        setValidated(true);
      }
    };

    fetchTokenInfo();
  }, []);

  // validate sufficient balance for each item on tokenMap
  useEffect(() => {
    try {
      const insufficient: string[] = [];
      for (const [key, value] of Object.entries(tokenMap)) {
        if (value.sendAmount.gt(value.availableBalance)) {
          insufficient.push(key);
        }
      }
      setInsufficientTokens(insufficient);
    } catch (error) {
      console.error('Error checking balances:', error);
      rejectApproval('Error checking token balances');
    }
  }, [tokenMap]);

  // after validated, rejectApproval if insufficient tokens or invalid indexs
  useEffect(() => {
    if (!validated) {
      return;
    }

    // skip if all things are good
    if (insufficientTokens.length === 0 && invalidItemsMap.size === 0) {
      return;
    }

    const tokenList = insufficientTokens.join(', ');
    const indexList = Array.from(invalidItemsMap.keys())
      .map(i => `item #${i}`)
      .join(', ');

    const message =
      'Transaction cannot be processed due to the following issues:\n\n' +
      (insufficientTokens.length
        ? `• Insufficient amount for tokens: ${tokenList}\n`
        : '') +
      (invalidItemsMap.size
        ? `• Invalid one of the following parameters(address, tick, amt) at: ${indexList}\n`
        : '');
    rejectApproval(message);
  }, [validated, insufficientTokens, invalidItemsMap]);

  // generate redeem content
  useEffect(() => {
    if (!validated) {
      return;
    }

    if (!contextData.currentAuthority) {
      return;
    }

    const message = {
      items: contextData.items,
      auth: contextData.currentAuthority?.ins,
      data: '',
    };

    walletProvider.generateTokenAuth(message, 'redeem').then(redeemContent => {
      updateContextData({redeemContent});
    });
  }, [validated, contextData.currentAuthority]);

  // check conditions for disable button
  useEffect(() => {
    updateContextData({disableBtn: true});

    if (contextData.feeRate <= 0) {
      return;
    }

    if (!contextData.outputValue) {
      return;
    }

    if (!validated) {
      return;
    }

    if (!contextData.redeemContent) {
      return;
    }

    updateContextData({disableBtn: false});
  }, [
    contextData.feeRate,
    contextData.outputValue,
    contextData.redeemContent,
    validated,
  ]);

  return (
    <UX.Box layout="column" spacing="xxl" style={{width: '100%'}}>
      <TransferPreviewTable
        items={contextData.items}
        showHeaders={true}
        maxVisibleItems={3}
        customHeaders={{
          token: 'Token name',
          amount: 'Amount',
          receiver: 'Receiver',
        }}
        compact={false}
        enableToggle={true}
      />

      <UX.Box layout="column" spacing="xss">
        <UX.Text
          styleType="heading_16"
          customStyles={{color: 'white'}}
          title="Fee rate"
        />
        <FeeRateBar
          onChange={val => {
            updateContextData({feeRate: val});
          }}
        />
      </UX.Box>
    </UX.Box>
  );
};
export const Step2 = ({
  contextData,
  updateContextData,
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) => {
  // const {order, rawTxInfo} = contextData;
  const fee = contextData.rawTxInfo?.fee || 0;

  const networkFee = useMemo(() => satoshisToAmount(fee), [fee]);
  const outputValue = useMemo(
    () => satoshisToAmount(contextData?.order?.postage || 0),
    [contextData.order.postage],
  );
  const minerFee = useMemo(() => {
    const orderNetworkFee = contextData?.order?.networkFee || 0;
    const sizeToFee = contextData?.order?.sizeToFee || 0;
    return satoshisToAmount(orderNetworkFee + sizeToFee);
  }, [contextData?.order]);
  const serviceFee = useMemo(
    () => satoshisToAmount(contextData?.order?.serviceFee || 0),
    [contextData?.order?.serviceFee],
  );
  const discountServiceFee = useMemo(
    () => satoshisToAmount(contextData?.order?.discountServiceFee || 0),
    [contextData?.order?.discountServiceFee],
  );
  const totalFee = useMemo(() => {
    const orderTotalFee = contextData?.order?.totalFee || 0;
    return satoshisToAmount(orderTotalFee + fee);
  }, [contextData?.order, fee]);
  return (
    <UX.Box spacing="xxl">
      {/* <UX.Box layout="row_center" spacing="xs">
        <UX.Text title={transferAmount} styleType="heading_16" />
        <UX.Text
          title={contextData.ticker}
          styleType="heading_16"
          customStyles={{color: colors.main_500}}
        />
      </UX.Box> */}
      <UX.Box spacing="xs" style={{margin: '16px 0'}}>
        <UX.Text
          title="Preview"
          styleType="body_16_normal"
          customStyles={{color: colors.white}}
        />
        <div
          style={{
            wordBreak: 'break-all',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid rgb(84, 84, 84)',
            backgroundColor: 'rgba(39, 39, 39, 0.42)',
          }}>
          {contextData.redeemContent?.proto
            ? contextData.redeemContent.proto
            : ''}
        </div>
        {/* <UX.Box layout="box">
          <UX.Text
            title={
              contextData.order?.files?.length
                ? order.files[0].filename
                : `{"p":"tap-token","op":"transfer","tick":"${contextData.ticker}","amount":${transferAmount},"addr":"${contextData.addr}","dta":"${contextData.dta}"}`
            }
            styleType="body_10_normal"
          />
        </UX.Box> */}
      </UX.Box>
      <UX.Box spacing="xs">
        <UX.Box layout="row_between">
          <UX.Text title="Payment method fee" styleType="body_16_normal" />
          <UX.Text
            title={networkFee}
            styleType="body_16_normal"
            customStyles={{color: colors.white}}
          />
        </UX.Box>

        <UX.Box layout="row_between">
          <UX.Text
            title="Inscription Output Value"
            styleType="body_16_normal"
          />
          <UX.Text
            title={outputValue}
            styleType="body_16_normal"
            customStyles={{color: colors.white}}
          />
        </UX.Box>
        <UX.Box layout="row_between">
          <UX.Text title="Inscription Network Fee" styleType="body_16_normal" />
          <UX.Text
            title={`${minerFee} BTC`}
            styleType="body_16_normal"
            customStyles={{color: colors.white}}
          />
        </UX.Box>
        <UX.Box layout="row_between">
          <UX.Text title="Service fee" styleType="body_16_normal" />
          {Number(discountServiceFee) > 0 ? (
            <UX.Box layout="row_between">
              <UX.Text
                title={`${discountServiceFee} BTC`}
                styleType="body_16_normal"
                customStyles={{
                  color: colors.white,
                  textDecorationLine: 'line-through',
                }}
              />
            </UX.Box>
          ) : (
            <UX.Text
              title={`${serviceFee} BTC`}
              styleType="body_16_normal"
              customStyles={{color: colors.white}}
            />
          )}
        </UX.Box>
        <UX.Box layout="row_between">
          <UX.Text title="Total" styleType="body_16_normal" />
          <UX.Text
            title={`${totalFee} BTC`}
            styleType="body_16_normal"
            customStyles={{color: colors.main_500}}
          />
        </UX.Box>
      </UX.Box>
    </UX.Box>
  );
};

export const Step3 = ({
  contextData,
  updateContextData,
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) => {
  //! State
  const {showToast} = useCustomToast();
  const {rawTxInfo, order} = contextData;
  const wallet = useWalletProvider();
  const [usdPriceSpendAmount, setUsdPriceSpendAmount] = useState(0);
  // const [usdPriceAmount, setUsdPriceAmount] = useState(0);

  //! Function
  const handleCopied = text => {
    copyToClipboard(text).then(() => {
      showToast({
        type: 'copied',
        title: 'Copied',
      });
    });
  };

  const account = useAppSelector(AccountSelector.activeAccount);
  const activeAccountAddress = account.address;
  const networkFee = useMemo(
    () => satoshisToAmount(rawTxInfo.fee),
    [rawTxInfo.fee],
  );
  // const serviceFee = useMemo(
  //   () => satoshisToAmount(order.serviceFee),
  //   [order.serviceFee],
  // );
  const totalFee = useMemo(
    () => satoshisToAmount(order.totalFee + rawTxInfo.fee),
    [order.totalFee],
  );

  const fetchDataUSD = async () => {
    if (Number(totalFee)) {
      const responseSpendAmount = await wallet.getUSDPrice(Number(totalFee));
      // const responseAmount = await wallet.getUSDPrice(Number(serviceFee));
      setUsdPriceSpendAmount(responseSpendAmount);
      // setUsdPriceAmount(responseAmount);
    } else {
      setUsdPriceSpendAmount(0);
      // setUsdPriceAmount(0);
    }
  };

  useEffect(() => {
    fetchDataUSD();
  }, [totalFee]);

  //! Render
  return (
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
        <UX.Text title={`${totalFee} BTC`} styleType="heading_24" />
        <UX.Box layout="row_center" spacing="xss_s">
          <UX.Text title="≈" styleType="body_14_normal" />
          <UX.Text
            title={`${formatNumberValue(String(usdPriceSpendAmount))} USD`}
            styleType="body_14_normal"
          />
        </UX.Box>
      </UX.Box>
      <UX.Box layout="box" spacing="xl">
        <UX.Box layout="row_between">
          <UX.Text title="From" styleType="body_14_normal" />
          <UX.Text
            title={formatAddressLongText(account.address, 8, 6)}
            styleType="body_14_normal"
            customStyles={{color: 'white'}}
          />
        </UX.Box>
        <UX.Box layout="row_between">
          <UX.Text title="To" styleType="body_14_normal" />
          <UX.Text
            title={formatAddressLongText(order.payAddress, 8, 6)}
            styleType="body_14_normal"
            customStyles={{color: 'white'}}
          />
        </UX.Box>
      </UX.Box>
      <UX.Box layout="box" spacing="xl">
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
            title={`${rawTxInfo.feeRate} sat/vB`}
            styleType="body_14_normal"
            customStyles={{color: 'white'}}
          />
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
              input => input.index === index,
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
                        padding: '0 5px',
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
                    color: isAddressAccount ? colors.main_500 : colors.smoke,
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
          <UX.Box layout="row" spacing="xss" onClick={handleCopied}>
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
  );
};

export const Step4 = ({
  contextData,
  updateContextData,
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) => {
  const pushBitcoinTx = usePushBitcoinTxCallback();
  const [, resolveApproval, rejectApproval] = useApproval();
  const [valueInput, setValueInput] = useState('');
  const checkValue = valueInput.length !== 4;
  const wallet = useWalletProvider();
  const pinInputRef = useRef<PinInputRef>(null);
  const {showToast} = useCustomToast();

  const spendUtxos = useMemo(() => {
    return contextData.rawTxInfo?.inputs.map(input => input.utxo);
  }, [contextData.rawTxInfo?.inputs]);

  const handleSubmit = useCallback(async () => {
    await wallet
      .unlockApp(valueInput)
      .then(() => {
        pushBitcoinTx(contextData.rawTxInfo?.rawtx ?? '', spendUtxos).then(
          ({success, error, txid}) => {
            if (success) {
              // mark order as paid
              wallet.paidOrder(contextData.order?.id);

              resolveApproval({txid});
            } else {
              rejectApproval(error);
            }
          },
        );
      })
      .catch(() => {
        showToast({type: 'error', title: 'wrong pin'});
        setValueInput('');
        pinInputRef.current?.clearPin();
      });
  }, [contextData.rawTxInfo, valueInput]);

  useEffect(() => {
    updateContextData({handleSubmitTx: handleSubmit});
  }, [contextData.rawTxInfo, valueInput]);

  const handleOnChange = (pwd: string) => {
    setValueInput(pwd);
  };
  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!checkValue && 'Enter' == e.key) {
      handleSubmit();
    }
  };
  return (
    <UX.Box layout="column_center" style={{marginTop: '5rem'}} spacing="xl">
      <SVG.UnlockIcon />
      <UX.Text
        title="PIN"
        styleType="heading_24"
        customStyles={{
          marginTop: '16px',
        }}
      />
      <UX.Text
        title="Enter your PIN code to confirm the transaction"
        styleType="body_16_normal"
        customStyles={{textAlign: 'center'}}
      />
      <UX.PinInput
        onChange={handleOnChange}
        onKeyUp={e => handleOnKeyUp(e)}
        ref={pinInputRef}
      />
    </UX.Box>
  );
};

export default function SingleTxTransfer({params: {data, session}}: Props) {
  const prepareSendBTC = usePrepareSendBTCCallback();
  const walletProvider = useWalletProvider();
  const [, , rejectApproval] = useApproval();
  const account = useAppSelector(AccountSelector.activeAccount);

  // check items is empty or invalid type
  if (!data?.items?.length || !Array.isArray(data.items)) {
    rejectApproval('Invalid items');
    return;
  }

  //! State
  const [contextData, setContextData] = useState<ContextData>({
    tabKey: TabKey.STEP1,
    items: data.items,
    session,
    feeRate: 5,
    outputValue: defaultOutputValue,
    rawTxInfo: {
      psbtHex: '',
      rawtx: '',
    },
    disableBtn: true,
    isLoading: false,
  });

  const updateContextData = useCallback(
    (params: UpdateContextDataParams) => {
      // setContextData(Object.assign({}, contextData, params));
      setContextData(prevContext => {
        const newContext = {...prevContext, ...params};
        return newContext;
      });
    },
    [contextData, setContextData],
  );

  //! Render
  const component = useMemo(() => {
    if (contextData.tabKey === TabKey.STEP1) {
      return (
        <Step1
          contextData={contextData}
          updateContextData={updateContextData}
        />
      );
    } else if (contextData.tabKey === TabKey.STEP2) {
      return (
        <Step2
          contextData={contextData}
          updateContextData={updateContextData}
        />
      );
    } else if (contextData.tabKey === TabKey.STEP3) {
      return (
        <Step3
          contextData={contextData}
          updateContextData={updateContextData}
        />
      );
    } else if (contextData.tabKey === TabKey.STEP4) {
      return (
        <Step4
          contextData={contextData}
          updateContextData={updateContextData}
        />
      );
    }
  }, [contextData]);

  // get current authority
  useEffect(() => {
    updateContextData({isLoading: true});
    walletProvider
      .getCurrentAuthority(account.address)
      .then(v => {
        if (!v) {
          rejectApproval('No authority found');
          return;
        }
        updateContextData({currentAuthority: v});
      })
      .finally(() => {
        updateContextData({isLoading: false});
      });
  }, []);

  const {showToast} = useCustomToast();
  const onClickInscribe = useCallback(async () => {
    try {
      // tools.showLoading(true)
      updateContextData({isLoading: true});

      const order = await walletProvider.createOrderRedeem(
        account.address,
        contextData.redeemContent?.proto,
        contextData.feeRate,
        contextData.outputValue,
      );

      const rawTxInfo = await prepareSendBTC({
        toAddressInfo: {address: order.payAddress, domain: ''},
        toAmount: order.totalFee,
        feeRate: contextData.feeRate,
        enableRBF: false,
      });

      updateContextData({
        order,
        rawTxInfo,
        tabKey: TabKey.STEP2,
      });
    } catch (e) {
      showToast({type: 'error', title: e.message});
    } finally {
      updateContextData({isLoading: false});
    }
  }, [
    contextData.feeRate,
    contextData.outputValue,
    contextData.items,
    account.address,
    contextData.redeemContent,
  ]);

  const footer = useMemo(() => {
    switch (contextData.tabKey) {
      case TabKey.STEP1:
        return (
          <UX.Box layout="row" spacing="sm" style={{padding: '10px 0'}}>
            <UX.Button
              title="Cancel"
              styleType="dark"
              onClick={() => rejectApproval('User rejected the request.')}
              customStyles={{flex: 1}}
            />
            <UX.Button
              title="Next"
              styleType="primary"
              isDisable={
                contextData.disableBtn ||
                !contextData.currentAuthority?.ins ||
                contextData.isLoading
              }
              onClick={onClickInscribe}
              customStyles={{flex: 1}}
            />
          </UX.Box>
        );
      case TabKey.STEP2:
        return (
          <UX.Box layout="row" spacing="sm" style={{padding: '10px 0'}}>
            <UX.Button
              title="Back"
              styleType="dark"
              onClick={() => {
                updateContextData({tabKey: TabKey.STEP1});
              }}
              customStyles={{flex: 1}}
            />
            <UX.Button
              title="Next"
              styleType="primary"
              onClick={() => {
                updateContextData({tabKey: TabKey.STEP3});
              }}
              customStyles={{flex: 1}}
            />
          </UX.Box>
        );
      case TabKey.STEP3:
        return (
          <UX.Box layout="row" spacing="sm" style={{padding: '10px 0'}}>
            <UX.Button
              title="Back"
              styleType="dark"
              onClick={() => {
                updateContextData({tabKey: TabKey.STEP1});
              }}
              customStyles={{flex: 1}}
            />
            <UX.Button
              title="Sign & Pay"
              styleType="primary"
              onClick={() => {
                updateContextData({tabKey: TabKey.STEP4});
              }}
              customStyles={{flex: 1}}
            />
          </UX.Box>
        );
      case TabKey.STEP4:
        return (
          <UX.Box style={{padding: '10px 0'}}>
            <UX.Button
              title="Confirm"
              styleType="primary"
              onClick={contextData.handleSubmitTx}
              customStyles={{flex: 1}}
            />
          </UX.Box>
        );
    }
  }, [
    contextData.feeRate,
    contextData.outputValue,
    contextData.tabKey,
    contextData.disableBtn,
    contextData.handleSubmitTx,
  ]);

  return (
    <LayoutTap
      header={<WebsiteBar session={contextData.session} />}
      body={
        <UX.Box style={{width: '100%'}}>
          {component}
          {contextData.isLoading && <UX.Loading />}
        </UX.Box>
      }
      footer={footer}
    />
  );
}
