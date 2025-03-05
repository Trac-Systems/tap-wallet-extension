import {UX} from '@/src/ui/component';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {satoshisToAmount} from '@/src/ui/helper';
import {
  useInscriptionHook,
  useAccountBalance,
} from '@/src/ui/pages/home-flow/hook';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {InscriptionSelector} from '@/src/ui/redux/reducer/inscription/selector';
import {SVG} from '@/src/ui/svg';
import {
  useAppSelector,
  TOKEN_PAGE_SIZE,
  generateUniqueColors,
} from '@/src/ui/utils';
import {TokenBalance} from '@/src/wallet-instance';
import {isEmpty} from 'lodash';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';

const DmtCollection = () => {
  const navigate = useNavigate();
  const {getTapList} = useInscriptionHook();
  const wallet = useWalletProvider();

  //! State
  const accountBalance = useAccountBalance();
  const tapList = useAppSelector(InscriptionSelector.listTapToken);
  const dmtGroupMap = useAppSelector(AccountSelector.dmtGroupMap);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const randomColors = useAppSelector(GlobalSelector.randomColors);
  const [loading, setLoading] = useState(false);
  const [showDetailItemId, setShowDetailItemId] = useState(null);
  const [tapItem, setTapItem] = useState<TokenBalance[]>([]);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  // const prevTapItemRef = useRef(tapItemTemp);

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
    navigate('/home/list-tap-options', {
      state: {brcTokenBalance: tokenBalance},
    });
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
    // setTapItem(tapList.filter(v => v.tokenInfo?.dmt));
    const dmtTokenList = tapList.filter(v => v.tokenInfo?.dmt);
    const addMissingDmtToken = async () => {
      const dmtTokenMissingMap = Object.fromEntries(
        Object.keys(dmtGroupMap).map(key => [key, true]),
      );

      for (const token of dmtTokenList) {
        if (dmtTokenMissingMap[token.tokenInfo?.ins]) {
          delete dmtTokenMissingMap[token.tokenInfo?.ins];
        }
      }

      const _allTokenInfo = [...dmtTokenList];

      // Add missing token DMT
      for (const depInsId in dmtTokenMissingMap) {
        const data = await wallet.getInscriptionContent(depInsId);
        const tokenBalance: TokenBalance = {
          availableBalance: '',
          overallBalance: '',
          ticker: `dmt-${data?.tick}`,
          transferableBalance: '',
          availableBalanceSafe: '',
          availableBalanceUnSafe: '',
          tokenInfo: {
            tick: `dmt-${data?.tick}`,
            max: '',
            lim: '',
            dec: 0,
            blck: 0,
            tx: '',
            vo: 0,
            ins: depInsId,
            num: 0,
            ts: 0,
            addr: '',
            crsd: false,
            dmt: true,
            elem: undefined,
            prj: undefined,
            dim: undefined,
            dt: undefined,
            prv: '',
          },
        };
        _allTokenInfo.push(tokenBalance);
      }
      setTapItem(_allTokenInfo);
      // prevTapItemRef.current = tapItemTemp; // Update reference
    };

    addMissingDmtToken();
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
    <UX.Box spacing="xl" style={{marginTop: '16px'}}>
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

export default DmtCollection;
