import { satoshisToAmount } from '@/src/shared/utils/btc-helper';
import { UX } from '@/src/ui/component';
import { AccountSelector } from '@/src/ui/redux/reducer/account/selector';
import { GlobalSelector } from '@/src/ui/redux/reducer/global/selector';
import { InscriptionSelector } from '@/src/ui/redux/reducer/inscription/selector';
import { SVG } from '@/src/ui/svg';
import {
  generateUniqueColors,
  TOKEN_PAGE_SIZE,
  useAppDispatch,
  useAppSelector,
} from '@/src/ui/utils';
import {
  InscribeOrder,
  OrderType,
  TappingStatus,
  TokenAuthority,
  TokenBalance,
} from '@/src/wallet-instance';
import { debounce, isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountBalance, useInscriptionHook, useTokenInfo, useAllInscriptions, useActiveTracAddress, useTracBalanceByAddress } from '../hook';
import { useWalletProvider } from '@/src/ui/gateway/wallet-provider';
import { AccountActions } from '@/src/ui/redux/reducer/account/slice';

interface TapListChildProps {
  onOpenFilter?: () => void;
  networkFilters?: { bitcoin: boolean; trac: boolean };
}

const TapListChild = (props: TapListChildProps) => {
  const { onOpenFilter, networkFilters = { bitcoin: true, trac: true } } = props;
  const navigate = useNavigate();
  const { getTapList } = useInscriptionHook();
  const { getTokenInfoAndStore, loadingTicker } = useTokenInfo();
  const { fetchAllInscriptions } = useAllInscriptions();
  const tokenInfoMap = useAppSelector(state => state.inscriptionReducer.tokenInfoMap);

  //! State
  const accountBalance = useAccountBalance();
  const walletProvider = useWalletProvider();
  const dispatch = useAppDispatch();
  const tapList = useAppSelector(InscriptionSelector.listTapToken);
  const totalTapToken = useAppSelector(InscriptionSelector.totalTap);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const randomColors = useAppSelector(GlobalSelector.randomColors);
  const tracAddress = useActiveTracAddress();
  const { balance: tracBalance } = useTracBalanceByAddress(tracAddress || undefined);
  const [loading, setLoading] = useState(false);
  const [showDetailItemId, setShowDetailItemId] = useState(null);
  const [tokenValue, setTokenValue] = useState('');
  const [tapItem, setTapItem] = useState<TokenBalance[]>([]);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: TOKEN_PAGE_SIZE,
  });
  const [currentAuthority, setCurrentAuthority] = useState<TokenAuthority>();
  const [orderNeedTap, setOrderNeedTap] = useState<InscribeOrder | null>();
  const [orderAuthorityPending, setOrderAuthorityPending] =
    useState<InscribeOrder | null>();
  const [isGettingAuthorityStatus, setIsGettingAuthorityStatus] =
    useState(false);

  const [allTapToken, setAllTapToken] = useState<TokenBalance[]>([]);
  const [hasLoadedAllTokens, setHasLoadedAllTokens] = useState(false);
  const [isLoadingAllTokens, setIsLoadingAllTokens] = useState(false);

  const currentAccountRef = useRef<string>('');

  const fetchAuthorityOrders = async () => {
    const orders = await walletProvider.getAuthorityOrders(
      activeAccount.address,
    );
    const pendingAuthorityOrder = orders?.length ? orders[0] : null;
    if (pendingAuthorityOrder) {
      // check authority is canceled or not
      const isCanceled = await walletProvider.getAuthorityCanceled(
        pendingAuthorityOrder.files[0].inscriptionId,
      );
      if (!isCanceled) {
        setOrderAuthorityPending(pendingAuthorityOrder);
        return;
      }
    }
    setOrderNeedTap(null);
  };

  const fetchHaveAuthorityNeedTap = async () => {
    const orders = await walletProvider.getOrderReadyToTap(
      activeAccount.address,
      OrderType.AUTHORITY,
    );
    let orderNeedTap = orders?.length ? orders[0] : null;
    if (orderNeedTap) {
      const isCanceled = await walletProvider.getAuthorityCanceled(
        orderNeedTap.files[0].inscriptionId,
      );
      if (isCanceled) {
        orderNeedTap = null;
      }
    }
    setOrderNeedTap(orderNeedTap);
    return orderNeedTap;
  };

  // fetch current authority
  useEffect(() => {
    const fetchCurrentAuthority = async () => {
      try {
        setIsGettingAuthorityStatus(true);
        const authority = await walletProvider.getCurrentAuthority(
          activeAccount.address,
        );
        setCurrentAuthority(authority);
        // update current authority
        dispatch(AccountActions.setCurrentAuthority(authority));

        // trigger fetch have authority need tap
        if (!authority) {
          const orderNeedTap = await fetchHaveAuthorityNeedTap();

          // if have no order need tap, fetch authority order tapping or creating
          if (!orderNeedTap) {
            await fetchAuthorityOrders();
          }
        }
      } catch (error) {
        console.log('error', error);
      } finally {
        setIsGettingAuthorityStatus(false);
      }
    };
    fetchCurrentAuthority();
  }, [activeAccount.address]);

  const listRandomColor: string[] = useMemo(() => {
    if (!isEmpty(randomColors)) {
      return randomColors;
    } else {
      return generateUniqueColors(TOKEN_PAGE_SIZE);
    }
  }, [randomColors]);

  //! Function
  const balanceValue = useMemo(() => {
    return satoshisToAmount(accountBalance.amount);
  }, [accountBalance.amount]);

  const handleClickOutside = (event: MouseEvent) => {
    if (showDetailItemId !== null) {
      const clickedOutside = !cardRefs.current[showDetailItemId]?.contains(
        event.target as Node,
      );
      if (clickedOutside) {
        setShowDetailItemId(null);
      }
    }
  };

  const handleNavigate = (tokenBalance: TokenBalance) => {
    navigate(`/home/list-tap-options/${tokenBalance.ticker}`);
  };

  const debouncedFetch = useCallback(
    debounce(async (value: string) => {
      if (value.length > 0 && !hasLoadedAllTokens && !isLoadingAllTokens) {
        setIsLoadingAllTokens(true);
        try {
          const allTokens = await walletProvider.getAllTapToken(activeAccount.address);
          setAllTapToken(allTokens);
          setHasLoadedAllTokens(true);
          const filteredData = allTokens?.filter(data =>
            data.ticker.toLowerCase().includes(value.toLowerCase()),
          );
          setTapItem(filteredData);
        } catch (error) {
          const filteredData = tapList?.filter(data =>
            data.ticker.toLowerCase().includes(value.toLowerCase()),
          );
          setTapItem(filteredData);
        } finally {
          setIsLoadingAllTokens(false);
        }
      } else if (value.length > 0 && hasLoadedAllTokens) {
        const filteredData = allTapToken?.filter(data =>
          data.ticker.toLowerCase().includes(value.toLowerCase()),
        );
        setTapItem(filteredData);
      } else if (value.length === 0) {
        setTapItem([]); // Clear search results
      }
    }, 400),
    [tapList, allTapToken, hasLoadedAllTokens, isLoadingAllTokens, activeAccount.address],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenValue(e.target.value);
    debouncedFetch(e.target.value);
  };

  //! Effect function
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetailItemId]);

  useEffect(() => {
    setLoading(true);
    const timer = async () => {
      currentAccountRef.current = activeAccount.address;
      
      try {
        await getTapList(pagination.currentPage);
        if (currentAccountRef.current === activeAccount.address) {
          setLoading(false);
        }
      } catch (error) {
        if (currentAccountRef.current === activeAccount.address) {
          setLoading(false);
        }
      }
    };
    timer()
  }, [pagination.currentPage, activeAccount.address]);

  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, []);

  useEffect(() => {
    fetchAllInscriptions();
  }, []);

  const mangeAuthorityTitle = useMemo(() => {
    if (isGettingAuthorityStatus) {
      return 'Loading...';
    }
    if (orderNeedTap) {
      return 'Confirm your 1-TX Transfer NOW';
    }
    if (currentAuthority || orderAuthorityPending) {
      return 'Manage Authority';
    }
    return 'Enable 1-TX Transfer';
  }, [
    currentAuthority,
    orderNeedTap,
    orderAuthorityPending,
    isGettingAuthorityStatus,
  ]);

  const hidePagination = useMemo(() => {
    return tokenValue.length > 0 || !tapList?.length;
  }, [tokenValue, tapList]);

  const displayData = useMemo(() => {
    if (tokenValue.length > 0) {
      return tapItem;
    }
    return tapList;
  }, [tokenValue, tapItem, tapList]);

  useEffect(() => {
    const fetchSequentially = async () => {
      for (const tokenBalance of displayData) {
        const ticker = tokenBalance.ticker;
        if (ticker && !tokenInfoMap[ticker]) {
          if (!loadingTicker) {
            getTokenInfoAndStore(ticker);
          } else {
            break;
          }
        }
      }
    };
    fetchSequentially();
  }, [displayData, tokenInfoMap, loadingTicker]);

  //! Render
  if (loading) {
    return (
      <UX.Box layout="row_center">
        <SVG.LoadingIcon />
      </UX.Box>
    );
  }

  return (
    <>
      <UX.Box spacing="xl">
        <UX.Box layout="row_between" spacing="xs" style={{ alignItems: 'center' }}>
          <UX.Box layout="row" spacing="xs" className="search-box-token" style={{ flex: 1 }}>
            <SVG.SearchIcon />
            <input
              placeholder="Search for token"
              className="search-box-token-input"
              onChange={handleChange}
              value={tokenValue}
            />
          </UX.Box>
          <UX.Box
            onClick={onOpenFilter}
            style={{ cursor: 'pointer', padding: '8px', marginLeft: '8px' }}>
            <SVG.FilterIcon />
          </UX.Box>
        </UX.Box>

        {currentAuthority ? (
          <UX.Button
            styleType={'primary'}
            title="1-TX Transfer"
            onClick={() => navigate('/transfer-authority')}
          />
        ) : (
          <UX.Box
            layout="box_border"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (orderNeedTap) {
                navigate('/authority-detail', {
                  state: {
                    inscriptionId: orderNeedTap.files[0].inscriptionId,
                    order: orderNeedTap,
                  },
                });
              } else if (orderAuthorityPending) {
                // if authority is tapping, navigate to authority detail
                if (
                  orderAuthorityPending.tappingStatus === TappingStatus.TAPPING
                ) {
                  navigate('/authority-detail', {
                    state: {
                      inscriptionId: orderAuthorityPending.files[0].inscriptionId,
                      order: orderAuthorityPending,
                    },
                  });
                } else {
                  // if authority is not tapping, navigate to authority warning
                  navigate('/authority-warning');
                }
              } else if (isGettingAuthorityStatus) {
                // disable button
                return;
              } else {
                navigate('/handle-create-authority');
              }
            }}>
            <UX.Text title={mangeAuthorityTitle} styleType="body_16_bold" />
            <SVG.ArrowIconRight width={23} height={18} />
          </UX.Box>
        )}


        {networkFilters.bitcoin && (
          <UX.Box layout="box">
            <UX.Box layout="row_between" style={{ width: '100%' }}>
              <UX.Box
                layout="row"
                style={{
                  justifyItems: 'center',
                  alignItems: 'center',
                }}>
                <SVG.BitcoinIcon width={32} height={32} />
                <UX.Text
                  title={'BTC'}
                  styleType="body_16_normal"
                  customStyles={{ color: 'white', marginLeft: '8px' }}
                />
              </UX.Box>

              <UX.Text
                title={`${balanceValue}`}
                styleType="body_16_normal"
                customStyles={{ color: 'white' }}
              />
            </UX.Box>
          </UX.Box>
        )}
        {/* TRAC row - visible when TRAC filter is on and we have an address */}
        {networkFilters.trac && !!tracAddress && (
          <UX.Box layout="box">
            <UX.Box layout="row_between" style={{ width: '100%' }}>
              <UX.Box
                layout="row"
                style={{
                  justifyItems: 'center',
                  alignItems: 'center',
                }}>
                <SVG.TracIcon width={32} height={32} />
                <UX.Text
                  title={'TNK'}
                  styleType="body_16_normal"
                  customStyles={{ color: 'white', marginLeft: '8px' }}
                />
              </UX.Box>

              <UX.Text
                title={tracBalance}
                styleType="body_16_normal"
                customStyles={{ color: 'white' }}
              />
            </UX.Box>
          </UX.Box>
        )}

        {networkFilters.bitcoin && displayData.map((tokenBalance: TokenBalance, index: number) => {
          const indexCheck = index < 20 ? index : index % 20;
          const tagColor = listRandomColor[indexCheck];
          return (
            <UX.TapBalanceItem
              {...tokenBalance}
              key={tokenBalance.ticker}
              handleNavigate={() => handleNavigate(tokenBalance)}
              tagColor={tagColor}
            />
          );
        })}

        {!hidePagination && (
          <UX.Box layout="row_center">
            <UX.Pagination
              pagination={pagination}
              total={totalTapToken || displayData.length}
              onChange={pagination => {
                setPagination(pagination);
              }}
            />
          </UX.Box>
        )}
      </UX.Box>
    </>
  );
};

export default TapListChild;
