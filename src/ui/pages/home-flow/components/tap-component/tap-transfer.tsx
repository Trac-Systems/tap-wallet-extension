import {UX} from '@/src/ui/component';
import LayoutTap from '@/src/ui/layouts/tap';
import {colors} from '@/src/ui/themes/color';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import CoinCount from '../coin-count';
import {
  RawTxInfo,
  TokenBalance,
  TokenInfo,
  TokenTransfer,
} from '@/src/wallet-instance';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {PAGE_SIZE, useAppSelector} from '@/src/ui/utils';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import BigNumber from 'bignumber.js';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import InscribeAttentionModal from '../inscribe-attention-modal';
import {formatNumberValue} from '@/src/shared/utils/btc-helper';

interface UpdateContextDataParams {
  transferAmount?: string;
  transferableList?: TokenTransfer[];
  inscriptionIdSet?: Set<string>;
  feeRate?: number;
  receiver?: string;
  rawTxInfo?: RawTxInfo;
}
interface ContextData {
  tokenBalance: TokenBalance;
  transferAmount: string;
  transferableList: TokenTransfer[];
  inscriptionIdSet: Set<string>;
  ticker: string;
  feeRate: number;
  receiver: string;
  rawTxInfo: RawTxInfo;
  tokenInfo: TokenInfo;
}

const TapTransfer = () => {
  //! Hooks
  const navigate = useNavigate();
  const wallet = useWalletProvider();
  const location = useLocation();
  const {showToast} = useCustomToast();
  const {state} = location;

  // TODO: Need check parameters when back from other screen
  const tokenBalance = state?.tokenBalance || {};
  const selectedAmount = state?.selectedAmount || 0;
  const selectedInscriptionIds = state?.selectedInscriptionIds || [];
  const ticker = state?.ticker || '';
  const isShow = localStorage.getItem('show');

  //! State
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [showAttentionModal, setShowAttentionModal] = useState<boolean>(false);
  const [items, setItems] = useState<TokenTransfer[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [totalInscription, setTotalInscription] = useState(0);
  const [contextData, setContextData] = useState<ContextData>({
    tokenBalance,
    transferAmount: selectedAmount,
    ticker,
    transferableList: [],
    inscriptionIdSet: new Set(selectedInscriptionIds),
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

  const totalAmount = items
    .reduce((pre, cur) => new BigNumber(cur.amount).plus(pre), new BigNumber(0))
    .toString();

  const selectedCount = useMemo(() => {
    return contextData.inscriptionIdSet.size;
  }, [contextData]);

  const disabled = useMemo(() => {
    return new BigNumber(contextData.transferAmount).lte(0);
  }, [contextData.transferAmount]);

  //! Function
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isShow !== '' && isShow) {
      setDoNotShowAgain(true);
    }
  }, []);

  const fetchData = async () => {
    try {
      const {list, total} = await wallet.getTapTransferAbleList(
        activeAccount.address,
        contextData?.tokenBalance?.ticker,
        1,
        PAGE_SIZE,
      );
      setItems(list);
      setTotalInscription(total);
    } catch (e) {
      showToast({
        title: (e as Error).message || '',
        type: 'error',
      });
    }
  };

  const updateContextData = useCallback(
    (params: UpdateContextDataParams) => {
      setContextData(Object.assign({}, contextData, params));
    },
    [contextData, setContextData],
  );

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

  const handleInscriptionTransfer = () => {
    if (isShow) {
      navigate('/home/inscribe-transfer-tap', {
        state: {ticker: tokenBalance.ticker},
      });
      return;
    }
    setShowAttentionModal(true);
  };

  const handleNavigate = () => {
    navigate('/home/transfer-tap', {
      state: {
        ticker: contextData.ticker,
        amount: contextData.transferAmount,
        inscriptionIdSet: contextData.inscriptionIdSet,
      },
    });
  };

  //! Render
  return (
    <LayoutTap
      header={
        <UX.TextHeader text="Transfer" onBackClick={() => navigate(-1)} />
      }
      body={
        <UX.Box>
          <UX.Text title="Transfer Amount" styleType="heading_16" />
          <UX.Box layout="row_center" style={{margin: '20px 0'}} spacing="xs">
            <UX.Text
              title={contextData.transferAmount}
              styleType="heading_16"
            />
            <UX.Text
              title={contextData?.tokenBalance?.ticker}
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
            style={{margin: '16px 0', width: '100%', overflowX: 'scroll'}}>
            {items?.map((item: TokenTransfer, index: number) => {
              return (
                <UX.Box key={index}>
                  <CoinCount
                    type="TRANSFER"
                    ticker={contextData?.tokenBalance?.ticker}
                    balance={item?.amount}
                    inscriptionNumber={item?.inscriptionNumber}
                    selected={contextData.inscriptionIdSet.has(
                      item.inscriptionId,
                    )}
                    onClick={async () => {
                      if (
                        contextData.inscriptionIdSet.has(item.inscriptionId)
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
          <UX.Box
            layout="column_center"
            onClick={handleInscriptionTransfer}
            style={{marginTop: '24px', cursor: 'pointer'}}>
            <UX.Box
              layout="box_border"
              spacing="xs"
              style={{flexDirection: 'column', minWidth: '300px'}}>
              <UX.Text title="Inscribe Transfer" styleType="heading_12" />
              <UX.Box layout="row_center" spacing="xs">
                <UX.Text
                  title="Available"
                  styleType="body_12_normal"
                  customStyles={{color: colors.white}}
                />
                <UX.Text
                  title={formatNumberValue(
                    contextData.tokenBalance.availableBalance,
                  )}
                  styleType="body_12_bold"
                  customStyles={{color: colors.white}}
                />
                <UX.Text
                  title={contextData?.tokenBalance?.ticker}
                  styleType="body_12_normal"
                  customStyles={{color: colors.main_500}}
                />
              </UX.Box>
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
          {isShow ? null : (
            <InscribeAttentionModal
              visible={showAttentionModal}
              isShow={!!JSON.parse(isShow)}
              doNotShowAgain={doNotShowAgain}
              setDoNotShowAgain={setDoNotShowAgain}
              onNext={() => {
                if (doNotShowAgain) {
                  localStorage.setItem('show', JSON.stringify(doNotShowAgain));
                }
                setShowAttentionModal(false);
                navigate('/home/inscribe-transfer-tap', {
                  state: {ticker: tokenBalance.ticker},
                });
              }}
              onCancel={() => {
                setShowAttentionModal(false);
              }}
            />
          )}
        </UX.Box>
      }
      footer={
        <UX.Button
          title="Next"
          styleType="primary"
          onClick={handleNavigate}
          isDisable={disabled}
        />
      }
    />
  );
};

export default TapTransfer;
