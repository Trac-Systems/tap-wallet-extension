import {satoshisToAmount} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {InscriptionSelector} from '@/src/ui/redux/reducer/inscription/selector';
import {SVG} from '@/src/ui/svg';
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
import {debounce, isEmpty} from 'lodash';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAccountBalance, useInscriptionHook} from '../hook';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';

const TapListChild = () => {
  const navigate = useNavigate();
  const {getTapList} = useInscriptionHook();

  //! State
  const accountBalance = useAccountBalance();
  const walletProvider = useWalletProvider();
  const dispatch = useAppDispatch();
  const tapList = useAppSelector(InscriptionSelector.listTapToken);
  const totalTapToken = useAppSelector(InscriptionSelector.totalTap);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const randomColors = useAppSelector(GlobalSelector.randomColors);
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
    debounce((value: string) => {
      const tokenList = allTapToken.length > 0 ? allTapToken : tapList;
      const filteredData = tokenList?.filter(data =>
        data.ticker.toLowerCase().includes(value.toLowerCase()),
      );
      setTapItem(filteredData);
    }, 400),
    [tapList, allTapToken],
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
    const timer = setTimeout(() => {
      getTapList(pagination.currentPage);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [pagination.currentPage, activeAccount.address]);

  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, []);

  useEffect(() => {
    setTapItem(tapList);
  }, [tapList.length]);

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

  // fetch all tap token
  useEffect(() => {
    setLoading(true);
    walletProvider
      .getAllTapToken(activeAccount.address)
      .then(res => {
        setAllTapToken(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [activeAccount.address]);

  const hidePagination = useMemo(() => {
    return tokenValue.length > 0 || !tapList?.length;
  }, [tokenValue, tapList]);

  //! Render
  if (loading) {
    return (
      <UX.Box layout="row_center">
        <SVG.LoadingIcon />
      </UX.Box>
    );
  }

  return (
    <UX.Box spacing="xl">
      <UX.Box layout="row" spacing="xs" className="search-box-token">
        <SVG.SearchIcon />
        <input
          placeholder="Search for token"
          className="search-box-token-input"
          onChange={handleChange}
          value={tokenValue}
        />
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
          style={{cursor: 'pointer'}}
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
      <UX.Box layout="box">
        <UX.Box layout="row_between" style={{width: '100%'}}>
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
              customStyles={{color: 'white', marginLeft: '8px'}}
            />
          </UX.Box>

          <UX.Text
            title={`${balanceValue}`}
            styleType="body_16_normal"
            customStyles={{color: 'white'}}
          />
        </UX.Box>
      </UX.Box>
      {tapItem.map((tokenBalance: TokenBalance, index: number) => {
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
            total={totalTapToken || tapItem.length}
            onChange={pagination => {
              setPagination(pagination);
            }}
          />
        </UX.Box>
      )}
    </UX.Box>
  );
};

export default TapListChild;
