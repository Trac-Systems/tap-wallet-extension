import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useAppSelector} from '@/src/ui/utils';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AddressTokenSummary} from '@/src/wallet-instance';
import {formatNumberValue, formatTicker} from '@/src/shared/utils/btc-helper';

interface TapBalanceItemProps {
  ticker: string;
  overallBalance: string;
  handleNavigate?: () => void;
  tagColor?: string;
}
const TapBalanceItem = (props: TapBalanceItemProps) => {
  const {ticker, overallBalance, handleNavigate, tagColor} = props;

  //! hooks
  const wallet = useWalletProvider();

  //! Ref
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [isExpandView, setExpandView] = useState(false);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [tokenSummary, setTokenSummary] = useState<AddressTokenSummary>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      setLoading(true);
      wallet
        .getTapSummary(activeAccount.address, ticker)
        .then(data => setTokenSummary(data));
    } catch (error) {
      console.log('Failed to get tap summary: ', error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, []);

  const transferableBalanceSafe = useMemo(() => {
    return (
      tokenSummary?.transferableList?.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0,
      ) ?? 0
    );
  }, [tokenSummary?.transferableList.length, activeAccount.address]);

  const balance = useMemo(() => {
    if (!tokenSummary) {
      return formatNumberValue(overallBalance);
    }
    return (
      Number(tokenSummary?.tokenBalance.availableBalance) +
      transferableBalanceSafe
    );
  }, [tokenSummary, activeAccount.address, overallBalance]);

  const deploy_count = tokenSummary
    ? tokenSummary.tokenInfo.holder === activeAccount.address
      ? 1
      : 0
    : 0;
  let _names: string[] = [];
  const _amounts: string[] = [];
  let _transferAble = 0;
  if (deploy_count > 0) {
    _names.push('Deploy');
    _amounts.push('');
  }
  if (tokenSummary) {
    tokenSummary.transferableList.forEach(v => {
      _names.push('Transfer');
      _amounts.push(v.amount);
      _transferAble += Number(v.amount);
    });
  }

  for (let i = 0; i < _names.length; i++) {
    if (i === 3) {
      if (_names.length > 4) {
        if (deploy_count > 0) {
          _names[i] = `${_names.length - 3}+`;
        } else {
          _names[i] = `${_names.length - 2}+`;
        }
        _amounts[i] = '';
      }
      break;
    }
  }
  _names = _names.splice(0, 4);

  //! Function
  const handleShowDetailList = (
    ticker: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    e.stopPropagation();
    setExpandView(!isExpandView);
    if (!tokenSummary) {
      try {
        wallet
          .getTapSummary(activeAccount.address, ticker)
          .then(data => setTokenSummary(data));
      } catch (error) {
        console.log('Failed to get tap summary: ', error);
      }
    }
  };
  if (loading) {
    return (
      <UX.Box layout="row_center">
        <SVG.LoadingIcon />
      </UX.Box>
    );
  }

  return (
    <UX.Box
      onClick={handleNavigate}
      ref={el => (cardRefs.current[ticker] = el)}
      layout="box"
      key={ticker}
      style={{
        flexDirection: 'column',
        alignItems: 'flex-start',
        cursor: 'pointer',
        borderRadius: '10px',
      }}>
      <UX.Box layout="row_between" style={{width: '100%'}}>
        <UX.Box
          layout="row"
          style={{
            justifyItems: 'center',
            alignItems: 'center',
          }}>
          <UX.Box
            layout="row"
            spacing="xlg"
            style={{
              height: '32px',
              width: '32px',
              minWidth: '32px',
              borderRadius: '50%',
              background: `${tagColor}`,
              marginRight: '8px',
            }}
          />
          <UX.Tooltip text={formatTicker(ticker)} isText>
            <UX.Text
              title={formatTicker(ticker)}
              styleType="body_16_normal"
              customStyles={{
                display: 'block',
                color: 'white',
                maxWidth: '150px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'pre',
              }}
            />
          </UX.Tooltip>
        </UX.Box>

        <UX.Tooltip text={formatNumberValue(String((balance)))} isText>
          <UX.Box
            layout="row"
            style={{cursor: 'pointer', overflow: 'hidden'}}
            onClick={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleShowDetailList(ticker, e)
            }>
            <UX.Text
              title={`${formatNumberValue(String((balance)))}`}
              styleType="body_16_normal"
              customStyles={{
                color: 'white',
                maxWidth: '100px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            />
            <SVG.ArrowDownIcon />
          </UX.Box>
        </UX.Tooltip>
      </UX.Box>
      {isExpandView ? (
        <>
          <UX.Divider />
          <UX.Box layout="row_between" style={{width: '100%', marginBottom: 8}}>
            <UX.Text
              title={'Transferable'}
              styleType="body_14_normal"
              customStyles={{
                color: '#FFFFFFB0',
                width: 'fit-content',
              }}
            />
            <UX.Text
              title={`${_transferAble}`}
              styleType="body_14_normal"
              customStyles={{
                color: '#FFFFFFB0',
                width: 'fit-content',
              }}
            />
          </UX.Box>
          <UX.Box
            layout="row"
            spacing="xss_s"
            style={{
              flex: 1,
            }}>
            {_names.slice(0, 3).map((item, index) => {
              return (
                <UX.Box
                  layout="column_center"
                  key={index}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: '7px',
                    overflow: 'hidden',
                    background: '#D16B7C',
                  }}>
                  {index === 2 ? (
                    <UX.Text
                      title={_amounts.length - 2 + '+'}
                      styleType="body_14_bold"
                      customStyles={{
                        color: 'white',
                        width: 'fit-content',
                      }}
                    />
                  ) : (
                    <>
                      <UX.Text
                        title={item}
                        styleType="body_14_bold"
                        customStyles={{
                          color: 'white',
                          width: 'fit-content',
                        }}
                      />
                      {item === 'Transfer' && (
                        <UX.Text
                          title={_amounts[index]}
                          styleType="body_14_bold"
                          customStyles={{
                            color: 'white',
                            width: 'fit-content',
                          }}
                        />
                      )}
                    </>
                  )}
                </UX.Box>
              );
            })}
          </UX.Box>
        </>
      ) : null}
    </UX.Box>
  );
};

export default TapBalanceItem;
