import {formatNumberValue, formatTicker} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import LayoutTap from '@/src/ui/layouts/tap';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {InscriptionSelector} from '@/src/ui/redux/reducer/inscription/selector';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
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
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import CoinCount from '../coin-count';

const ListTapOptions = () => {
  //! Hooks
  const navigate = useNavigate();
  const wallet = useWalletProvider();
  const location = useLocation();
  // TODO: brcTokenBalance is param passing, need check brcTokenBalance when back from other screen
  const {id: encodedId} = useParams();
  const id = encodedId ? decodeURIComponent(encodedId) : '';

  //! State
  const currentAuthority = useAppSelector(AccountSelector.currentAuthority);
  const [loading, setLoading] = useState(false);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const isLedgerWallet = activeWallet.type === 'Hardware Wallet';
  const [deployInscriptionState, setDeployInscription] =
    useState<Inscription>();
  const [tokenSummary, setTokenSummary] = useState<AddressTokenSummary>({
    tokenBalance: {
      ticker: id,
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
        ticker: id,
      },
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const fetchData = () => {
    setLoading(true);
    wallet
      .getTapSummary(activeAccount.address, id)
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

  useEffect(() => {
    if (!activeAccount?.address || !id) return;
    fetchData();
  }, [activeAccount?.address, id]);

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
          ticker: id,
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
        hash: location.pathname,
      },
    });
  };

  const tokens = currentAuthority?.auth || [];
  const isExistToken = tokens?.includes(id);
  const isValidToken = currentAuthority && !isLedgerWallet && (!tokens.length || isExistToken);  

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
        <UX.Box layout="column" style={{height: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column'}}>
          <UX.Box style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            <UX.Text
              title="Total balance"
              styleType="body_16_normal"
              customStyles={{marginBottom: 8, textAlign: 'center'}}
            />
            <UX.Box layout="row_center" style={{marginBottom: 20}}>
              <UX.Text
                title={balance}
                styleType="body_20_extra_bold"
                customStyles={{color: colors.white, marginRight: '8px'}}
              />
              <UX.Text
                title={formatTicker(id)}
                styleType="body_20_extra_bold"
                customStyles={{color: colors.main_500, whiteSpace: 'pre'}}
              />
            </UX.Box>
            {isValidToken && (
              <>
                <UX.Box layout="row" spacing="xl">
                  <UX.Button
                    title={'1-TX Transfer'}
                    isDisable={!enableTransfer}
                    onClick={() => {
                      navigate('/transfer-authority', {
                        state: {ticker: id},
                      });
                    }}
                    svgIcon={
                      <SVG.TransferIcon color="white" width={20} height={20} />
                    }
                    styleType="primary"
                    withIcon
                    customStyles={{flex: 1, flexDirection: 'row-reverse'}}
                  />
                </UX.Box>
                <UX.Text
                  onClick={handleNavigate}
                  title="Use Native Transfer"
                  styleType="body_16_bold"
                  customStyles={{
                    margin: '20px 0',
                    color: 'white',
                    textDecoration: 'underline',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                />
              </>
            )}
            {!isValidToken && (
              <UX.Box layout="row" spacing="xl">
                <UX.Button
                  title={'Transfer'}
                  isDisable={!enableTransfer}
                  onClick={() => {
                    handleNavigate();
                  }}
                  svgIcon={
                    <SVG.TransferIcon color="white" width={20} height={20} />
                  }
                  styleType="primary"
                  withIcon
                  customStyles={{
                    flex: 1,
                    flexDirection: 'row-reverse',
                    marginBottom: 20,
                  }}
                />
              </UX.Box>
            )}
            
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
                  title={formatTicker(id)}
                  styleType="body_12_bold"
                  customStyles={{color: colors.main_500, whiteSpace: 'pre'}}
                />
              </UX.Box>
            </UX.Box>
            {!isEmpty(dataForList) ? (
              <UX.Text
                title="Click on the inscription for details. To transfer, click on the Transfer button above."
                styleType="body_14_normal"
                customStyles={{marginTop: '16px'}}
              />
            ) : (
              <></>
            )}
            <UX.Box
              layout="row"
              spacing="xs"
              style={{margin: '16px 0', width: '100%', overflowX: 'scroll'}}>
              {loading ? (
                <UX.Loading />
              ) : (
                dataForList.map((item, index) => {
                  if(deployInscriptionState && index === 0) return null;
                  return (
                  <UX.Box key={index}>
                        <CoinCount
                          type="TRANSFER"
                          ticker={formatTicker(id)}
                          balance={item?.amount}
                          inscriptionNumber={item?.inscriptionNumber}
                          onClick={() => tapPreviewItemOnPress(item)}
                        />
                    </UX.Box>
                  );
                })
              )}
            </UX.Box>
          </UX.Box>
          {/* Token details dưới cùng */}
          <UX.Box  style={{marginTop: 0, marginBottom: 16}}>
            <UX.Box>
              <UX.Divider color="#fff" />
            </UX.Box>
            <UX.Text title="Token details" styleType="body_14_normal" customStyles={{color: colors.white, marginBottom: 16, textAlign: 'left'}} />
            <UX.Box style={{background: colors.black_2, borderRadius: 16, padding: 16}}>
              <UX.Box layout="row_between" style={{marginBottom: 16}}>
                <UX.Text title="Deploy Inscription" styleType="body_14_normal" />
                <UX.Text 
                  title={tokenSummary.tokenInfo.inscriptionId ? `${tokenSummary.tokenInfo.inscriptionId.slice(0,6)}...${tokenSummary.tokenInfo.inscriptionId.slice(-6)}` : '—'} 
                  styleType="body_14_normal" 
                  customStyles={{
                    color: colors.white, 
                    textAlign: 'right', 
                    fontWeight: 500, 
                    fontFamily: 'Exo', 
                    fontSize: 14, 
                    lineHeight: '22px', 
                    letterSpacing: 0,
                    cursor: tokenSummary.tokenInfo.inscriptionId ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (tokenSummary.tokenInfo.inscriptionId) {
                      tapPreviewItemOnPress({inscriptionId: tokenSummary.tokenInfo.inscriptionId} as TokenTransfer);
                    }
                  }}
                />
              </UX.Box>
              <UX.Box layout="row_between" style={{marginBottom: 16}}>
                <UX.Text title="Ticker" styleType="body_14_normal" />
                <UX.Text title={tokenSummary.tokenBalance.ticker || '—'} styleType="body_14_normal" customStyles={{color: colors.white, textAlign: 'right', fontWeight: 500, fontFamily: 'Exo', fontSize: 14, lineHeight: '22px', letterSpacing: 0}} />
              </UX.Box>
              <UX.Box layout="row_between" style={{marginBottom: 16}}>
                <UX.Text title="Minted" styleType="body_14_normal" />
                <UX.Text title={tokenSummary.tokenInfo.totalMinted ? formatNumberValue(tokenSummary.tokenInfo.totalMinted) : '—'} styleType="body_14_normal" customStyles={{color: colors.white, textAlign: 'right', fontWeight: 500, fontFamily: 'Exo', fontSize: 14, lineHeight: '22px', letterSpacing: 0}} />
              </UX.Box>
              <UX.Box layout="row_between" style={{marginBottom: 16}}>
                <UX.Text title="Supply" styleType="body_14_normal" />
                <UX.Text title={tokenSummary.tokenInfo.totalSupply ? formatNumberValue(tokenSummary.tokenInfo.totalSupply) : '—'} styleType="body_14_normal" customStyles={{color: colors.white, textAlign: 'right', fontWeight: 500, fontFamily: 'Exo', fontSize: 14, lineHeight: '22px', letterSpacing: 0}} />
              </UX.Box>
              <UX.Box layout="row_between">
                <UX.Text title="Decimal" styleType="body_14_normal" />
                <UX.Text title={tokenSummary.tokenInfo.decimal?.toString() || '—'} styleType="body_14_normal" customStyles={{color: colors.white, textAlign: 'right', fontWeight: 500, fontFamily: 'Exo', fontSize: 14, lineHeight: '22px', letterSpacing: 0}} />
              </UX.Box>
            </UX.Box>
          </UX.Box>
        </UX.Box>
      }
    />
  );
};

export default ListTapOptions;
