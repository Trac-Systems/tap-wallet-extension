import {satoshisToAmount} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {InscriptionSelector} from '@/src/ui/redux/reducer/inscription/selector';
import {SVG} from '@/src/ui/svg';
import {
  generateUniqueColors,
  TOKEN_PAGE_SIZE,
  useAppSelector,
} from '@/src/ui/utils';
import {TokenBalance} from '@/src/wallet-instance';
import {debounce, isEmpty} from 'lodash';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAccountBalance, useInscriptionHook} from '../hook';

const TapListChild = () => {
  const navigate = useNavigate();
  const {getTapList} = useInscriptionHook();

  //! State
  const accountBalance = useAccountBalance();
  const tapList = useAppSelector(InscriptionSelector.listTapToken);
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
  const tickerDemo = 'thuy';
  const isAuthority = useAppSelector(GlobalSelector.isAuthority);
  
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
      const filteredData = tapList?.filter(data =>
        data.ticker.toLowerCase().includes(value.toLowerCase()),
      );
      setTapItem(filteredData);
    }, 400),
    [tapList],
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
      <UX.Box
        layout="box_border"
        style={{cursor: 'pointer'}}
        onClick={() => {
          if (!isAuthority) {
            navigate('/manage-authority');
          } else {
            navigate('/create-authority', {
              state: {
                type: 'create',
              },
            });
          }
        }}>
        <UX.Text title={isAuthority ? "Enable tx transfer" : 'Manage Authority'} styleType="body_16_bold" />
        <SVG.ArrowIconRight width={23} height={18} />
      </UX.Box>
      {isAuthority && <UX.Button
        styleType={'primary'}
        title="1-TX Transfer"
        onClick={() =>
          navigate('/transfer-authority')
        }
      />}
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
      {tapItem.length > 0 ? (
        <UX.Box layout="row_center">
          <UX.Pagination
            pagination={pagination}
            total={tapItem.length}
            onChange={pagination => {
              setPagination(pagination);
            }}
          />
        </UX.Box>
      ) : null}
    </UX.Box>
  );
};

export default TapListChild;
