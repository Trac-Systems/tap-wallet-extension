import {UX} from '@/src/ui/component';
import {copyToClipboard} from '@/src/ui/helper';
import LayoutTap from '@/src/ui/layouts/tap';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {
  InscribeOrder,
  RawTxInfo,
  TokenBalance,
  TokenInfo,
  TokenTransfer,
} from '@/src/wallet-instance';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {
  formatAddressLongText,
  shortAddress,
  useAppSelector,
} from '@/src/ui/utils';
import {useApproval} from '../hook';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {
  usePrepareSendBTCCallback,
  useFetchUtxosCallback,
  usePushBitcoinTxCallback,
} from '../../send-receive/hook';
import BigNumber from 'bignumber.js';
import {getUtxoDustThreshold} from '@/src/background/utils';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {isEmpty} from 'lodash';
import {PinInputRef} from '../../../component/pin-input';
import {useCustomToast} from '../../../component/toast-custom';
import WebsiteBar from '../../../component/website-bar';
import {FeeRateBar} from '../../send-receive/component/fee-rate-bar';
import {OutputValueBar} from '../../send-receive/component/output-value';
import InscriptionPreview from '../../../component/inscription-preview';
import {satoshisToAmount} from '@/src/shared/utils/btc-helper';

enum TabKey {
  STEP1,
  STEP2,
  STEP3,
  STEP4,
  STEP5,
}

interface Props {
  params: {
    data: {
      ticker: string;
      amount: string;
    };
    session: {
      origin: string;
      icon: string;
      name: string;
    };
  };
}
interface ContextData {
  ticker?: string;
  session?: any;
  tabKey: TabKey;
  tokenBalance: TokenBalance;
  transferAmount: string;
  transferableList: TokenTransfer[];
  inscriptionIdSet: Set<string>;
  feeRate: number;
  outputValue: number;
  receiver: string;
  order?: InscribeOrder;
  rawTxInfo: RawTxInfo;
  tokenInfo: TokenInfo;
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
  tokenBalance?: TokenBalance;
  transferAmount?: string;
  transferableList?: TokenTransfer[];
  inscriptionIdSet?: Set<string>;
  feeRate?: number;
  outputValue?: number;
  receiver?: string;
  order?: InscribeOrder;
  rawTxInfo?: RawTxInfo;
  tokenInfo?: TokenInfo;
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
  const wallet = useAppSelector(WalletSelector.activeWallet);
  const walletProvider = useWalletProvider();

  const fetchUtxos = useFetchUtxosCallback();
  const [, , rejectApproval] = useApproval();
  const [inputError, setInputError] = useState('');

  // const [inputDisabled, setInputDisabled] = useState(false);

  const dust = getUtxoDustThreshold(wallet.addressType);

  const {showToast} = useCustomToast();

  useEffect(() => {
    if (!contextData.transferAmount || Number(contextData.transferAmount) < 0) {
      rejectApproval('Amount must be greater than 0');
    }
    setInputError('');
    updateContextData({disableBtn: true});

    if (!contextData.transferAmount) {
      return;
    }

    const amount = new BigNumber(contextData.transferAmount);
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

    if (contextData.feeRate <= 0) {
      return;
    }

    if (contextData.outputValue < dust) {
      setInputError(`OutputValue must be at least ${dust}`);
      return;
    }

    if (!contextData.outputValue) {
      return;
    }

    updateContextData({disableBtn: false});
  }, [
    contextData.transferAmount,
    contextData.feeRate,
    contextData.outputValue,
    contextData.tokenBalance,
  ]);

  useEffect(() => {
    fetchUtxos();
    walletProvider
      .getTapSummary(account.address, contextData.ticker)
      .then(v => {
        updateContextData({
          tokenBalance: v.tokenBalance,
          tokenInfo: v.tokenInfo,
        });
      })
      .catch(e => {
        showToast({type: 'error', title: e.message});
        rejectApproval(e.message);
      });
  }, []);

  const {tokenBalance} = contextData;

  const availableToken = useMemo(() => {
    if (tokenBalance) {
      return tokenBalance.availableBalance;
    }
    return '0';
  }, [tokenBalance]);

  return (
    <UX.Box spacing="xxl">
      <UX.Box spacing="xss">
        <UX.Box layout="row_between">
          <UX.Text
            styleType="heading_16"
            customStyles={{color: 'white'}}
            title="Available"
          />
          <UX.Box layout="row" spacing="xs">
            <UX.Text
              title={availableToken}
              styleType="body_12_bold"
              customStyles={{color: colors.white}}
            />
            <UX.Text
              title={tokenBalance.ticker}
              styleType="body_12_bold"
              customStyles={{color: colors.main_500}}
            />
          </UX.Box>
        </UX.Box>
        <UX.AmountInput
          defaultValue={contextData.transferAmount}
          style={{
            fontSize: '24px',
            lineHeight: '32px',
          }}
          value={contextData.transferAmount}
          onAmountInputChange={amount => {
            updateContextData({transferAmount: amount});
          }}
          disableCoinSvg
          // enableMax={true}
          // onMaxClick={() => {
          //   // setUiState({contextData.transferAmount: totalAvailableAmount.toString()});
          // }}
        />
        {inputError && (
          <UX.Text
            styleType="body_12_bold"
            customStyles={{color: colors.red_700}}
            title={inputError}
          />
        )}
      </UX.Box>

      <UX.Box spacing="xss">
        <UX.Text
          styleType="heading_16"
          customStyles={{color: 'white'}}
          title="OutputValue"
        />
        <OutputValueBar
          defaultValue={defaultOutputValue}
          minValue={dust}
          onChange={val => {
            updateContextData({outputValue: val});
          }}
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
  const {order, transferAmount, rawTxInfo} = contextData;

  const networkFee = useMemo(
    () => satoshisToAmount(rawTxInfo.fee),
    [rawTxInfo.fee],
  );
  const outputValue = useMemo(
    () => satoshisToAmount(order.outputValue),
    [order.outputValue],
  );
  const minerFee = useMemo(
    () => satoshisToAmount(order.minerFee + rawTxInfo.fee),
    [order.minerFee],
  );
  const serviceFee = useMemo(
    () => satoshisToAmount(order.serviceFee),
    [order.serviceFee],
  );
  const totalFee = useMemo(
    () => satoshisToAmount(order.totalFee + rawTxInfo.fee),
    [order.totalFee],
  );
  return (
    <UX.Box spacing="xxl">
      <UX.Box layout="row_center" spacing="xs">
        <UX.Text title={transferAmount} styleType="heading_16" />
        <UX.Text
          title={contextData.ticker}
          styleType="heading_16"
          customStyles={{color: colors.main_500}}
        />
      </UX.Box>
      <UX.Box spacing="xs" style={{margin: '16px 0'}}>
        <UX.Text
          title="Preview"
          styleType="body_16_normal"
          customStyles={{color: colors.white}}
        />
        <UX.Box layout="box">
          <UX.Text
            title={`{"p":"tap-token","op":"transfer","tick":"${contextData.ticker}","amount":${transferAmount}}`}
            styleType="body_10_normal"
          />
        </UX.Box>
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
          <UX.Text
            title={`${serviceFee} BTC`}
            styleType="body_16_normal"
            customStyles={{color: colors.white}}
          />
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
  const minerFee = useMemo(
    () => satoshisToAmount(order.minerFee + rawTxInfo.fee),
    [order.minerFee],
  );
  const serviceFee = useMemo(
    () => satoshisToAmount(order.serviceFee),
    [order.serviceFee],
  );
  const totalFee = useMemo(
    () => satoshisToAmount(order.totalFee + rawTxInfo.fee),
    [order.totalFee],
  );

  //! Render
  return (
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
        <UX.Text title={`${serviceFee} BTC`} styleType="heading_24" />
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
          <UX.Text title="Spend amount" styleType="body_14_normal" />
          <UX.Text
            title={`${totalFee} BTC`}
            styleType="body_14_normal"
            customStyles={{color: 'white'}}
          />
        </UX.Box>
        <UX.Box layout="row_between">
          <UX.Text title="Network fee" styleType="body_14_normal" />
          <UX.Text
            title={`${minerFee} BTC`}
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
            const isToSign = rawTxInfo.inputs?.find(
              inputForSign => inputForSign.data.index === index,
            )
              ? true
              : false;
            return (
              <UX.Box layout="row_between" key={index}>
                <UX.Box layout="row" spacing="xss">
                  <UX.Text
                    title={formatAddressLongText(v?.utxo?.address, 8, 6)}
                    styleType="body_14_normal"
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
            return (
              <UX.Box layout="row_between" key={index}>
                <UX.Text
                  title={formatAddressLongText(v.address, 8, 6)}
                  styleType="body_14_normal"
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
  const [, , rejectApproval] = useApproval();
  const [valueInput, setValueInput] = useState('');
  const checkValue = valueInput.length !== 4;
  const wallet = useWalletProvider();
  const pinInputRef = useRef<PinInputRef>(null);
  const {showToast} = useCustomToast();

  const handleSubmit = useCallback(async () => {
    await wallet
      .unlockApp(valueInput)
      .then(() => {
        pushBitcoinTx(contextData.rawTxInfo?.rawtx ?? '').then(
          ({success, error}) => {
            if (success) {
              updateContextData({
                tabKey: TabKey.STEP5,
              });
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

export const Step5 = ({
  contextData,
  updateContextData,
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) => {
  const {tokenBalance, order} = contextData;
  const wallet = useWalletProvider();
  const {showToast} = useCustomToast();

  const account = useAppSelector(AccountSelector.activeAccount);
  const [, resolveApproval] = useApproval();
  const [result, setResult] = useState<any>();
  const timeCount = useRef(0);

  const checkResult = async () => {
    let _result: any = null;
    try {
      _result = await wallet.getTapSummary(account.address, contextData.ticker);
    } catch (e) {
      const txError = (e as any).message || '';
      if (timeCount.current >= 3) {
        showToast({
          title: txError,
          type: 'error',
        });
      }
    }

    if (!_result && timeCount.current < 3) {
      timeCount.current++;
      setTimeout(checkResult, 2000);
      return;
    }

    setResult(_result);
  };

  useEffect(() => {
    checkResult();
  }, []);

  const onClickConfirm = useCallback(async () => {
    // tools.showLoading(true);
    wallet
      .getTapSummary(account.address, tokenBalance.ticker)
      .then(() => {
        resolveApproval({
          inscriptionId: result.inscriptionId,
          inscriptionNumber: result.inscriptionNumber,
          ticker: tokenBalance.ticker,
          amount: result.amount,
        });
      })
      .finally(() => {
        // tools.showLoading(false);
      });
  }, [result, account, tokenBalance]);

  useEffect(() => {
    updateContextData({handleConfirmDone: onClickConfirm});
  }, [result, account, tokenBalance]);

  if (!result) {
    return (
      <UX.Box layout="column" style={{marginTop: '7rem'}} spacing="xl">
        <UX.Box layout="column_center" spacing="xl">
          <SVG.SendSuccessIcon />
          <UX.Text
            title="Payment Sent"
            styleType="heading_24"
            customStyles={{
              marginTop: '16px',
            }}
          />
          <UX.Text
            title={'Your transaction has been successfully sent'}
            styleType="body_16_normal"
            customStyles={{textAlign: 'center'}}
          />
        </UX.Box>
      </UX.Box>
    );
  }
  return (
    <UX.Box spacing="xxl">
      <UX.Box>
        <InscriptionPreview data={result?.inscription} preset="medium" />
      </UX.Box>
      <UX.Text
        title="The transferable and available balance of Tap will be refresh in a few minutes"
        styleType="body_14_normal"
        customStyles={{color: colors.white, textAlign: 'center'}}
      />
    </UX.Box>
  );
};

export default function InscriptionTransfer({params: {data, session}}: Props) {
  //! State
  const [contextData, setContextData] = useState<ContextData>({
    tabKey: TabKey.STEP1,
    ticker: data.ticker,
    tokenBalance: {} as TokenBalance,
    transferAmount: data.amount,
    session,
    transferableList: [],
    inscriptionIdSet: new Set([]),
    feeRate: 5,
    outputValue: defaultOutputValue,
    receiver: '',
    rawTxInfo: {
      psbtHex: '',
      rawtx: '',
    },
    tokenInfo: {
      totalSupply: '0',
      totalMinted: '0',
      decimal: 18,
      holder: '',
      inscriptionId: '',
    },
    disableBtn: true,
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
    } else {
      {
        return (
          <Step5
            contextData={contextData}
            updateContextData={updateContextData}
          />
        );
      }
    }
  }, [contextData]);

  // handle on click
  const prepareSendBTC = usePrepareSendBTCCallback();
  const account = useAppSelector(AccountSelector.activeAccount);
  const walletProvider = useWalletProvider();
  const {showToast} = useCustomToast();
  const [, , rejectApproval] = useApproval();
  const onClickInscribe = useCallback(async () => {
    try {
      // tools.showLoading(true);
      const order = await walletProvider.createOrderTransfer(
        account.address,
        contextData.ticker,
        contextData.transferAmount,
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
      // tools.showLoading(false);
    }
  }, [
    contextData.feeRate,
    contextData.outputValue,
    contextData.transferAmount,
  ]);

  const footer = useMemo(() => {
    switch (contextData.tabKey) {
      case TabKey.STEP1:
        return (
          <UX.Box layout="row" spacing="sm">
            <UX.Button
              title="Cancel"
              styleType="dark"
              onClick={() => rejectApproval('User rejected the request.')}
              customStyles={{flex: 1}}
            />
            <UX.Button
              title="Next"
              styleType="primary"
              isDisable={contextData.disableBtn}
              onClick={onClickInscribe}
              customStyles={{flex: 1}}
            />
          </UX.Box>
        );
      case TabKey.STEP2:
        return (
          <UX.Box layout="row" spacing="sm">
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
          <UX.Box layout="row" spacing="sm">
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
          <UX.Button
            title="Confirm"
            styleType="primary"
            onClick={contextData.handleSubmitTx}
            customStyles={{flex: 1}}
          />
        );
      case TabKey.STEP5:
        return (
          <UX.Button
            title="Done"
            styleType="primary"
            onClick={contextData.handleConfirmDone}
            customStyles={{flex: 1}}
          />
        );
    }
  }, [
    contextData.feeRate,
    contextData.outputValue,
    contextData.transferAmount,
    contextData.tabKey,
    contextData.disableBtn,
    contextData.handleSubmitTx,
    contextData.handleConfirmDone,
  ]);
  return (
    <LayoutTap
      header={<WebsiteBar session={contextData.session} />}
      body={<UX.Box style={{width: '100%'}}>{component}</UX.Box>}
      footer={footer}
    />
  );
}