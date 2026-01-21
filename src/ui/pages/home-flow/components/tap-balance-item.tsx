import {formatNumberValue, formatTicker, calculateAmount} from '@/src/shared/utils/btc-helper';
import {TapTokenInfo} from '@/src/shared/utils/tap-response-adapter';
import {UX} from '@/src/ui/component';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {SVG} from '@/src/ui/svg';
import {useAppSelector} from '@/src/ui/utils';
import {AddressTokenSummary} from '@/src/wallet-instance';
import React, {useMemo, useRef, useState} from 'react';
import {useTokenUSDPrice} from '@/src/ui/hook/use-token-usd-price';

interface TapBalanceItemProps {
  ticker: string;
  overallBalance: string;
  handleNavigate?: () => void;
  tagColor?: string;
  tokenInfo?: TapTokenInfo;
}

const TapBalanceItem = (props: TapBalanceItemProps) => {
  const wallet = useWalletProvider();
  const {ticker, overallBalance, handleNavigate, tagColor} = props;

  //! Ref
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [isExpandView, setExpandView] = useState(false);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [tokenSummary, setTokenSummary] = useState<AddressTokenSummary>();
  const tokenInfoMap = useAppSelector(state => state.inscriptionReducer.tokenInfoMap);
  const tokenInfo = tokenInfoMap[ticker];
  const decimal = tokenInfo?.dec;

  const balance = useMemo(() => {
    if (!tokenInfo || !overallBalance || decimal === undefined) {
      return null;
    }

    const balanceNumber = parseFloat(overallBalance);
    if (isNaN(balanceNumber)) {
      return null;
    }

    return formatNumberValue(calculateAmount(overallBalance, decimal));
  }, [overallBalance, decimal]);

  const balanceNumeric = useMemo(() => {
    if (!tokenInfo || !overallBalance || decimal === undefined) {
      return 0;
    }
    const calculated = calculateAmount(overallBalance, decimal);
    return parseFloat(calculated);
  }, [overallBalance, decimal, tokenInfo]);

  // Use custom hook for USD price fetching
  const { usdValue, isLoading: isLoadingUsd, isSupported } = useTokenUSDPrice({
    ticker,
    amount: balanceNumeric,
  });

 


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
        setTokenSummary(undefined);
      }
    }
  };

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
      <UX.Box layout="row" style={{width: '100%', alignItems: 'center'}}>
        <UX.Box
          layout="row"
          style={{
            justifyItems: 'center',
            alignItems: 'center',
            flex: 1,
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

        <UX.Box layout="row" style={{alignItems: 'center'}}>
          {!balance ? (
            <UX.Box style={{alignItems: 'flex-end'}}>
              <span style={{width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}>
                <SVG.LoadingIcon />
              </span>
            </UX.Box>
          ) : (
            <UX.Box layout="column" style={{alignItems: 'flex-end'}}>
              <UX.Tooltip text={balance ?? ''} isText>
                <UX.Text
                  title={`${balance}`}
                  styleType="body_16_normal"
                  customStyles={{
                    color: 'white',
                    maxWidth: '100px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                  }}
                />
              </UX.Tooltip>
              {isSupported && (
                <UX.Box layout="row" spacing="xss_s">
                  {isLoadingUsd ? (
                    <UX.Text
                      title="..."
                      styleType="body_12_normal"
                      customStyles={{color: '#FFFFFFB0'}}
                    />
                  ) : (
                    <>
                      <UX.Text title="≈" styleType="body_12_normal" customStyles={{color: '#FFFFFFB0'}} />
                      <UX.Text
                        title={`${usdValue}`}
                        styleType="body_12_normal"
                        customStyles={{color: '#FFFFFFB0'}}
                      />
                      <UX.Text title="USD" styleType="body_12_normal" customStyles={{color: '#FFFFFFB0'}} />
                    </>
                  )}
                </UX.Box>
              )}
            </UX.Box>
          )}

          <UX.Box
            style={{cursor: 'pointer', marginLeft: '4px'}}
            onClick={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleShowDetailList(ticker, e)
            }>
            <SVG.ArrowDownIcon />
          </UX.Box>
        </UX.Box>
      </UX.Box>
      {isExpandView ? (
        <>
          <UX.Divider />
          {/* TransferAble of Items */}
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
                    width: '80px',
                    height: '80px',
                    borderRadius: '7px',
                    overflow: 'hidden',
                    background: '#D16B7C',
                    position: 'relative',
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
