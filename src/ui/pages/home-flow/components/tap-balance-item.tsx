import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {getRenderDmtLink, useAppSelector} from '@/src/ui/utils';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AddressTokenSummary} from '@/src/wallet-instance';
import {formatNumberValue, formatTicker} from '@/src/shared/utils/btc-helper';
import {colors} from '@/src/ui/themes/color';
import {TapTokenInfo} from '@/src/shared/utils/tap-response-adapter';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';

interface TapBalanceItemProps {
  ticker: string;
  overallBalance: string;
  handleNavigate?: () => void;
  tagColor?: string;
  tokenInfo?: TapTokenInfo;
}

const TapBalanceItem = (props: TapBalanceItemProps) => {
  const wallet = useWalletProvider();
  const network = useAppSelector(GlobalSelector.networkType);
  const dmtCollectibleMap = useAppSelector(AccountSelector.dmtCollectibleMap);

  const {ticker, overallBalance, handleNavigate, tagColor, tokenInfo} = props;

  const renderDmtLink = useMemo(() => {
    return getRenderDmtLink(network);
  }, [network]);

  //! Ref
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [isExpandView, setExpandView] = useState(false);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const dmtGroupMap = useAppSelector(AccountSelector.dmtGroupMap);
  const [tokenSummary, setTokenSummary] = useState<AddressTokenSummary>();
  const [loading, setLoading] = useState(false);
  const [mintList, setMintList] = useState([]);

  useEffect(() => {
    setMintList(dmtGroupMap[tokenInfo?.ins]);
  }, [tokenInfo, dmtGroupMap]);

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
      return overallBalance.toString();
    }
    const balanceNumber =
      Number(tokenSummary?.tokenBalance.availableBalance) +
      transferableBalanceSafe;
    return formatNumberValue(balanceNumber.toString());
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

        <UX.Tooltip text={balance} isText>
          <UX.Box
            layout="row"
            style={{cursor: 'pointer', overflow: 'hidden'}}
            onClick={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleShowDetailList(ticker, e)
            }>
            <UX.Text
              title={`${balance}`}
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

          {tokenInfo?.dmt ? (
            <>
              {/* Collections of items */}
              <UX.Box
                layout="row_between"
                style={{width: '100%', marginTop: 10, marginBottom: 8}}>
                <UX.Text
                  title={'Collectibles'}
                  styleType="body_14_normal"
                  customStyles={{
                    color: '#FFFFFFB0',
                    width: 'fit-content',
                  }}
                />
                <UX.Text
                  title={`${mintList.length}`}
                  styleType="body_14_normal"
                  customStyles={{
                    color: '#FFFFFFB0',
                    width: 'fit-content',
                  }}
                />
              </UX.Box>
              <UX.Box layout="row" spacing="xss_s">
                {mintList.map((item, index) => {
                  if (index > 1) {
                    return;
                  }
                  return (
                    <div
                      key={item?.ins}
                      onClick={handleNavigate}
                      style={{cursor: 'pointer'}}>
                      <iframe
                        key={item?.ins}
                        width="80px"
                        height="80px"
                        sandbox="allow-scripts allow-same-origin"
                        src={`${renderDmtLink}?contentInscriptionId=${dmtCollectibleMap[item].contentInscriptionId}&dmtInscriptionId=${item}&block=${dmtCollectibleMap[item].block}`}></iframe>
                    </div>
                  );
                })}
                {mintList.length > 3 ? (
                  <UX.Box
                    layout="row_center"
                    style={{
                      width: '80px',
                      height: '80px',
                      border: '1px solid #fff',
                    }}>
                    <UX.Text
                      title={mintList.length - 2 + '+'}
                      styleType="body_14_bold"
                      customStyles={{
                        color: 'white',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: colors.main_500,
                      }}
                    />
                  </UX.Box>
                ) : null}
              </UX.Box>
            </>
          ) : null}
        </>
      ) : null}
    </UX.Box>
  );
};

export default TapBalanceItem;
