import {UX} from '@/src/ui/component';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  generateUniqueColors,
  TOKEN_PAGE_SIZE,
  useAppSelector,
} from '@/src/ui/utils';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {InscriptionSelector} from '@/src/ui/redux/reducer/inscription/selector';
import {isEmpty} from 'lodash';
import {TokenBalance} from '@/src/wallet-instance';
import {useAccountBalance, useInscriptionHook} from '../hook';
import {useNavigate} from 'react-router-dom';
import {SVG} from '@/src/ui/svg';
import {satoshisToAmount} from '@/src/shared/utils/btc-helper';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';

const TapList = () => {
  const navigate = useNavigate();
  const {getTapList} = useInscriptionHook();
  const accountBalance = useAccountBalance();
  //! State
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const randomColors = useAppSelector(GlobalSelector.randomColors);
  const [loading, setLoading] = useState(false);
  const [showDetailItemId, setShowDetailItemId] = useState(null);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const tapList = useAppSelector(InscriptionSelector.listTapToken);
  const totalTapToken = useAppSelector(InscriptionSelector.totalTap);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: TOKEN_PAGE_SIZE,
  });

  const listRandomColor: string[] = useMemo(() => {
    if (!isEmpty(randomColors)) {
      return randomColors;
    } else {
      return generateUniqueColors(TOKEN_PAGE_SIZE);
    }
  }, [randomColors]);

  //! Function
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      getTapList(1);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [activeAccount.address]);

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

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetailItemId]);

  const handleNavigate = (tokenBalance: TokenBalance) => {
    navigate('/home/list-tap-options', {
      state: {brcTokenBalance: tokenBalance},
    });
  };

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
      {tapList.map((tokenBalance: TokenBalance, index: number) => {
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
      {!isEmpty(tapList) && (
        <UX.Box layout="row_center">
          <UX.Pagination
            pagination={pagination}
            total={totalTapToken}
            onChange={pagination => {
              getTapList(pagination.currentPage);
              setPagination(pagination);
            }}
          />
        </UX.Box>
      )}
    </UX.Box>
  );
};

export default TapList;
