import {formatNumberValue, formatTicker} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import LayoutTap from '@/src/ui/layouts/tap';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {useAppSelector} from '@/src/ui/utils';
import {
  AddressTokenSummary,
  Inscription,
  TokenTransfer,
} from '@/src/wallet-instance';
import BigNumber from 'bignumber.js';
import {isEmpty} from 'lodash';
import {useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import CoinCount from '../coin-count';

const ListTapOptions = () => {
  //! Hooks
  const navigate = useNavigate();
  const wallet = useWalletProvider();
  const location = useLocation();
  // TODO: brcTokenBalance is param passing, need check brcTokenBalance when back from other screen
  const {state} = location;
  const brcTokenBalance = state?.brcTokenBalance;
  //! State
  const [loading, setLoading] = useState(false);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [deployInscriptionState, setDeployInscription] =
    useState<Inscription>();
  const [tokenSummary, setTokenSummary] = useState<AddressTokenSummary>({
    tokenBalance: {
      ticker: brcTokenBalance?.ticker,
      overallBalance: '',
      availableBalance: '',
      transferableBalance: '',
      availableBalanceSafe: '',
      availableBalanceUnSafe: '',
    },
    tokenInfo: {
      totalSupply: '',
      totalMinted: '',
      decimal: 18,
      holder: '',
      inscriptionId: '',
      dmt: false,
    },
    historyList: [],
    transferableList: [],
  });

  //! Function
  const handleNavigate = () => {
    const defaultSelected = tokenSummary.transferableList.slice(0, 1);
    const selectedInscriptionIds = defaultSelected.map(v => v.inscriptionId);
    const selectedAmount = defaultSelected.reduce(
      (pre, cur) => new BigNumber(cur.amount).plus(pre),
      new BigNumber(0),
    );
    return navigate('/home/tap-transfer', {
      state: {
        tokenBalance: tokenSummary?.tokenBalance,
        selectedInscriptionIds: selectedInscriptionIds,
        selectedAmount: selectedAmount.toString(),
        ticker: brcTokenBalance?.ticker,
      },
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    wallet
      .getTapSummary(activeAccount.address, brcTokenBalance?.ticker)
      .then((tokenSummaryData: AddressTokenSummary) => {
        if (tokenSummaryData.tokenInfo.holder === activeAccount.address) {
          wallet
            .getInscriptionInfo(tokenSummaryData.tokenInfo?.inscriptionId)
            .then((inscriptions: Inscription[]) => {
              setDeployInscription(
                inscriptions?.length ? inscriptions[0] : undefined,
              );
            })
            .finally(() => {
              setTokenSummary(tokenSummaryData);
              setLoading(false);
            });
        } else {
          setTokenSummary(tokenSummaryData);
          setLoading(false);
        }
      });
  };

  const transferableBalance = useMemo(() => {
    return (
      tokenSummary?.transferableList?.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0,
      ) ?? 0
    );
  }, [tokenSummary.transferableList.length]);

  const balance = useMemo(() => {
    if (!tokenSummary) {
      return '0';
    }
    const balanceNumber =
      Number(tokenSummary?.tokenBalance.availableBalance) + transferableBalance;
    return formatNumberValue(balanceNumber.toString());
  }, [tokenSummary, transferableBalance]);

  const enableTransfer = useMemo(() => {
    let enable = false;
    if (
      tokenSummary.tokenBalance.overallBalance !== '0' &&
      tokenSummary.tokenBalance.overallBalance !== ''
    ) {
      enable = true;
    }
    return enable;
  }, [tokenSummary]);

  const deployInscriptionAsTokenTransfer: TokenTransfer | undefined =
    deployInscriptionState
      ? {
          ...deployInscriptionState,
          ticker: brcTokenBalance?.ticker,
          amount: '0',
          inscriptionNumber: deployInscriptionState?.inscriptionNumber,
          inscriptionId: deployInscriptionState?.inscriptionId,
        }
      : undefined;

  const dataForList: TokenTransfer[] = [
    deployInscriptionAsTokenTransfer,
    ...(tokenSummary.transferableList || []),
  ].filter(Boolean) as TokenTransfer[];

  const tapPreviewItemOnPress = async (item: TokenTransfer) => {
    const inscriptions = await wallet.getInscriptionInfo(item?.inscriptionId);
    const inscription = inscriptions?.length ? inscriptions[0] : undefined;
    navigate('/home/inscription-detail', {
      state: {
        inscriptionId: inscription?.inscriptionId,
        hash: location.hash.replace('#', ''),
      },
    });
  };

  //! Render
  return (
    <LayoutTap
      header={
        <UX.Box>
          <UX.TextHeader
            text="Transfer"
            onBackClick={() => navigate('/home')}
          />
        </UX.Box>
      }
      body={
        <UX.Box>
          <UX.Box layout="row_center" style={{margin: '20px 0'}}>
            <UX.Text
              title={balance}
              styleType="body_16_bold"
              customStyles={{color: colors.white, marginRight: '8px'}}
            />
            <UX.Text
              title={formatTicker(brcTokenBalance?.ticker)}
              styleType="body_14_bold"
              customStyles={{color: colors.main_500, whiteSpace: 'pre'}}
            />
          </UX.Box>
          <UX.Box layout="row" spacing="xl">
            <UX.Button
              title="Transfer"
              isDisable={!enableTransfer}
              onClick={handleNavigate}
              svgIcon={
                <SVG.TransferIcon color="white" width={20} height={20} />
              }
              styleType="primary"
              withIcon
              customStyles={{flex: 1, flexDirection: 'row-reverse'}}
            />
          </UX.Box>
          <UX.Divider color="#fff" />
          {/* Transferable */}
          <UX.Box layout="row_between">
            <UX.Text
              title="Transferable"
              styleType="body_14_normal"
              customStyles={{color: colors.white}}
            />
            <UX.Box layout="row" spacing="xs">
              <UX.Text
                title={`${transferableBalance}`}
                styleType="body_12_bold"
                customStyles={{color: colors.white}}
              />
              <UX.Text
                title={formatTicker(brcTokenBalance?.ticker)}
                styleType="body_12_bold"
                customStyles={{color: colors.main_500, whiteSpace: 'pre'}}
              />
            </UX.Box>
          </UX.Box>
          <UX.Box
            layout="row"
            spacing="xs"
            style={{margin: '16px 0', width: '100%', overflowX: 'scroll'}}>
            {loading ? (
              <UX.Loading />
            ) : (
              dataForList.map((item, index) => {
                return (
                  <UX.Box key={index}>
                    {deployInscriptionState && index === 0 ? (
                      <CoinCount
                        type="DEPLOY"
                        ticker={formatTicker(brcTokenBalance?.ticker)}
                        balance={item?.amount}
                        inscriptionNumber={item?.inscriptionNumber}
                        onClick={() => tapPreviewItemOnPress(item)}
                      />
                    ) : (
                      <CoinCount
                        type="TRANSFER"
                        ticker={formatTicker(brcTokenBalance?.ticker)}
                        balance={item?.amount}
                        inscriptionNumber={item?.inscriptionNumber}
                        onClick={() => tapPreviewItemOnPress(item)}
                      />
                    )}
                  </UX.Box>
                );
              })
            )}
          </UX.Box>
          {!isEmpty(dataForList) ? (
            <UX.Text
              title="Click on the inscription for details. To transfer, click on the Transfer button above."
              styleType="body_14_normal"
              customStyles={{textAlign: 'center'}}
            />
          ) : (
            <></>
          )}
        </UX.Box>
      }
    />
  );
};

export default ListTapOptions;
