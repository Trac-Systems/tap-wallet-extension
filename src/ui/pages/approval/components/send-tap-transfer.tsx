import {UX} from '@/src/ui/component';
import LayoutTap from '@/src/ui/layouts/tap';
import {colors} from '@/src/ui/themes/color';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  RawTxInfo,
  TokenBalance,
  TokenInfo,
  TokenTransfer,
  TxType,
} from '@/src/wallet-instance';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {PAGE_SIZE, useAppSelector} from '@/src/ui/utils';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import BigNumber from 'bignumber.js';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import CoinCount from '../../home-flow/components/coin-count';
import WebsiteBar from '../../../component/website-bar';
import {FeeRateBar} from '../../send-receive/component/fee-rate-bar';
import SignPsbt from './sign-psbt';
import {useApproval} from '../hook';
import {isEmpty} from 'lodash';

enum TabKey {
  STEP1,
  STEP2,
  STEP3,
}

interface UpdateContextDataParams {
  toAddress?: string;
  transferAmount?: string;
  transferableList?: TokenTransfer[];
  inscriptionIdSet?: Set<string>;
  feeRate?: number;
  receiver?: string;
  rawTxInfo?: RawTxInfo;
  tabKey?: TabKey;
  session?: {
    origin: string;
    icon: string;
    name: string;
  };
}
interface ContextData {
  toAddress?: string;
  tokenBalance?: TokenBalance;
  transferAmount?: string;
  transferableList?: TokenTransfer[];
  inscriptionIdSet?: Set<string>;
  ticker: string;
  feeRate: number;
  receiver: string;
  rawTxInfo: RawTxInfo;
  tokenInfo: TokenInfo;
  tabKey?: TabKey;
  session?: {
    origin: string;
    icon: string;
    name: string;
  };
}

interface Props {
  params: {
    data: {
      toAddress: string;
      ticker: string;
    };
    session: {
      origin: string;
      icon: string;
      name: string;
    };
  };
}

const StepSelectAssets = ({
  contextData,
  updateContextData,
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) => {
  const wallet = useWalletProvider();
  const {showToast} = useCustomToast();

  // TODO: Need check parameters when back from other screen

  //! State
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [items, setItems] = useState<TokenTransfer[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [totalInscription, setTotalInscription] = useState(0);
  const [, , rejectApproval] = useApproval();

  const totalAmount = items
    .reduce((pre, cur) => new BigNumber(cur.amount).plus(pre), new BigNumber(0))
    .toString();

  const selectedCount = useMemo(() => {
    return contextData.inscriptionIdSet?.size || 0;
  }, [contextData]);

  const disabled = useMemo(() => {
    return new BigNumber(contextData.transferAmount).lte(0);
  }, [contextData.transferAmount]);

  //! Function
  useEffect(() => {
    fetchData();
  }, [contextData.ticker]);

  const fetchData = async () => {
    try {
      const {list, total} = await wallet.getTapTransferAbleList(
        activeAccount.address,
        contextData.ticker,
        1,
        PAGE_SIZE,
      );
      setItems(list);
      setTotalInscription(total);
      if (isEmpty(list)) {
        rejectApproval(
          `Token ${contextData.ticker} don't have in your account`,
        );
      }
    } catch (e) {
      showToast({
        title: (e as Error).message || '',
        type: 'error',
      });
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      updateContextData({
        inscriptionIdSet: new Set(),
        transferAmount: '0',
      });
    } else {
      const inscriptionIdSet = new Set(items.map(v => v.inscriptionId));
      updateContextData({
        inscriptionIdSet,
        transferAmount: totalAmount,
      });
    }
    setAllSelected(!allSelected);
  };

  const handleNext = () => {
    updateContextData({tabKey: TabKey.STEP2});
  };

  //! Render
  return (
    <LayoutTap
      header={<WebsiteBar session={contextData.session} />}
      body={
        <UX.Box>
          <UX.Text title="Transfer Amount" styleType="heading_16" />
          <UX.Box layout="row_center" style={{margin: '20px 0'}} spacing="xs">
            <UX.Text
              title={contextData.transferAmount}
              styleType="heading_16"
            />
            <UX.Text
              title={contextData.ticker}
              styleType="body_16_bold"
              customStyles={{color: colors.main_500}}
            />
          </UX.Box>
          <UX.Text
            title={`
                Transfer Inscription
                (${selectedCount}/${totalInscription})`}
            styleType="heading_16"
          />
          <UX.Box
            layout="row"
            spacing="xs"
            style={{margin: '16px 0', width: '342px', overflowX: 'scroll'}}>
            {items?.map((item: TokenTransfer, index: number) => {
              return (
                <UX.Box key={index}>
                  <CoinCount
                    type="TRANSFER"
                    ticker={contextData.ticker}
                    balance={item?.amount}
                    inscriptionNumber={item?.inscriptionNumber}
                    selected={contextData.inscriptionIdSet?.has(
                      item?.inscriptionId,
                    )}
                    onClick={async () => {
                      if (
                        contextData.inscriptionIdSet?.has(item.inscriptionId)
                      ) {
                        const inscriptionIdSet = new Set(
                          contextData.inscriptionIdSet,
                        );
                        inscriptionIdSet.delete(item.inscriptionId);
                        const transferAmount = new BigNumber(
                          contextData.transferAmount,
                        ).minus(new BigNumber(item.amount));
                        updateContextData({
                          inscriptionIdSet,
                          transferAmount: transferAmount.toString(),
                        });
                        if (allSelected) {
                          setAllSelected(false);
                        }
                      } else {
                        const inscriptionIdSet = new Set(
                          contextData.inscriptionIdSet,
                        );
                        inscriptionIdSet.add(item.inscriptionId);
                        const transferAmount = new BigNumber(
                          contextData.transferAmount,
                        )
                          .plus(new BigNumber(item.amount))
                          .toString();
                        updateContextData({
                          inscriptionIdSet,
                          transferAmount,
                        });
                        if (
                          allSelected === false &&
                          transferAmount === totalAmount
                        ) {
                          setAllSelected(true);
                        }
                      }
                    }}
                  />
                </UX.Box>
              );
            })}
          </UX.Box>
          <UX.Box
            layout="row"
            spacing="xl"
            style={{justifyContent: 'flex-end'}}>
            <UX.RefreshButton buttonOnPress={fetchData} />
            <UX.Box
              layout="row"
              spacing="xs"
              style={{alignItems: 'center'}}
              onClick={handleSelectAll}>
              <UX.CheckBox checked={allSelected} />
              <UX.Text
                title="Select All"
                styleType="body_16_bold"
                customStyles={{color: colors.white}}
              />
            </UX.Box>
          </UX.Box>
          <UX.Text
            title="* To send TAP, you have to inscribe a TRANSFER inscription first"
            styleType="body_12_normal"
            customStyles={{
              color: colors.white,
              textAlign: 'center',
              marginTop: '5px',
            }}
          />
        </UX.Box>
      }
      footer={
        <UX.Box layout="row" spacing="sm">
          <UX.Button
            title="Reject"
            styleType="dark"
            onClick={() => {
              rejectApproval();
            }}
            customStyles={{flex: 1}}
          />
          <UX.Button
            title="Next"
            styleType="primary"
            isDisable={disabled}
            onClick={handleNext}
            customStyles={{flex: 1}}
          />
        </UX.Box>
      }
    />
  );
};

const StepSend = ({
  contextData,
  updateContextData,
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) => {
  const {toAddress, ticker, transferAmount} = contextData;
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    setDisabled(true);
    if (!toAddress) {
      return;
    }
    setDisabled(false);
  }, [toAddress]);

  //! Renders
  return (
    <LayoutTap
      header={<WebsiteBar session={contextData.session} />}
      body={
        <UX.Box spacing="xl" style={{width: '100%'}}>
          <UX.Box spacing="xs">
            <UX.Text title="send" styleType="heading_14" />
            <UX.Input value={`${transferAmount} ${ticker}`} disabled />
          </UX.Box>
          <UX.Box spacing="xs">
            <UX.Text title="receiver" styleType="heading_14" />
            <UX.AddressInput
              style={{
                fontSize: '16px',
                border: 'none',
                background: 'transparent',
                width: '100%',
              }}
              addressInputData={{address: toAddress}}
              onAddressInputChange={val => {
                updateContextData({toAddress: val.address});
              }}
              autoFocus={true}
            />
          </UX.Box>
          <UX.Box spacing="xs">
            <UX.Text title="Fee rate" styleType="heading_14" />
            <FeeRateBar
              onChange={val => {
                updateContextData({feeRate: val});
              }}
            />
          </UX.Box>
        </UX.Box>
      }
      footer={
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
            isDisable={disabled}
            onClick={() => {
              updateContextData({tabKey: TabKey.STEP3});
            }}
            customStyles={{flex: 1}}
          />
        </UX.Box>
      }
    />
  );
};

const StepSign = ({
  contextData,
  updateContextData,
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) => {
  const {
    session,
    toAddress,
    inscriptionIdSet,
    feeRate,
    ticker,
    transferAmount,
  } = contextData;
  let data: any = {
    toAddress,
    feeRate,
    ticker,
    transferAmount,
    type: TxType.SEND_ORDINALS_INSCRIPTION,
  };
  const onBackClick = () => {
    updateContextData({tabKey: TabKey.STEP2});
  };
  const inscriptionIds = Array.from(inscriptionIdSet);
  if (inscriptionIds.length === 0) {
    data = {...data, inscriptionId: inscriptionIds[0]};
  } else {
    data = {...data, inscriptionIds};
  }
  return <SignPsbt params={{session, data, onBackClick}} />;
};

const SendTapTransfer = ({
  params: {
    data: {toAddress, ticker},
    session,
  },
}: Props) => {
  const [contextData, setContextData] = useState<ContextData>({
    tabKey: TabKey.STEP1,
    toAddress,
    ticker,
    transferAmount: '0',
    tokenBalance: {} as TokenBalance,
    session,
    transferableList: [],
    inscriptionIdSet: new Set([]),
    feeRate: 5,
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
        <StepSelectAssets
          contextData={contextData}
          updateContextData={updateContextData}
        />
      );
    } else if (contextData.tabKey === TabKey.STEP2) {
      return (
        <StepSend
          contextData={contextData}
          updateContextData={updateContextData}
        />
      );
    } else {
      return (
        <StepSign
          contextData={contextData}
          updateContextData={updateContextData}
        />
      );
    }
  }, [contextData]);
  return <>{component}</>;
};

export default SendTapTransfer;
