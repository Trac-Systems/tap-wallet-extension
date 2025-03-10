import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {getRenderDmtLink, useAppSelector} from '@/src/ui/utils';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AddressTokenSummary} from '@/src/wallet-instance';
import {formatTicker} from '@/src/shared/utils/btc-helper';
import {colors} from '@/src/ui/themes/color';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';

interface TapDmtGroupItemProps {
  contentInscriptionId: string;
  ticker: string;
  handleNavigate?: () => void;
  tagColor?: string;
}

const TapDmtGroupItem = (props: TapDmtGroupItemProps) => {
  const wallet = useWalletProvider();
  const network = useAppSelector(GlobalSelector.networkType);
  const dmtCollectibleMap = useAppSelector(AccountSelector.dmtCollectibleMap);
  const {contentInscriptionId, ticker, handleNavigate, tagColor} = props;

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

        <UX.Box
          layout="row"
          style={{cursor: 'pointer', overflow: 'hidden'}}
          onClick={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleShowDetailList(ticker, e)
          }>
          <SVG.ArrowDownIcon />
        </UX.Box>
      </UX.Box>
      {isExpandView ? (
        <>
          <UX.Divider />
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
          </UX.Box>
          <UX.Box layout="row" spacing="xss_s">
            {dmtGroupMap[contentInscriptionId]?.dmtInscriptionIds?.map(
              (item, index) => {
                if (index > 1) {
                  return;
                }
                return (
                  <div
                    key={item}
                    onClick={handleNavigate}
                    style={{
                      cursor: 'pointer',
                      display: 'flex', // Makes it a flex container
                      flexDirection: 'column', // Ensures children stack vertically
                      alignItems: 'center', // Centers items horizontally (optional)
                    }}>
                    <iframe
                      key={item}
                      width="80px"
                      height="80px"
                      sandbox="allow-scripts allow-same-origin"
                      src={`${renderDmtLink}/${dmtCollectibleMap[item].contentInscriptionId}/${item}?block=${dmtCollectibleMap[item]?.block}`}
                    />

                    <UX.Text
                      title={`#${dmtCollectibleMap[item]?.inscriptionNumber}`}
                      styleType="body_14_normal"
                      customStyles={{
                        color: 'white',
                        width: '100%',
                        background: '#545454',
                        padding: '4px 0',
                        textAlign: 'center',
                      }}
                    />
                  </div>
                );
              },
            )}
            {dmtGroupMap[contentInscriptionId]?.dmtInscriptionIds?.length >
            3 ? (
              <UX.Box
                layout="row_center"
                style={{
                  width: '80px',
                  height: '80px',
                  border: '1px solid #fff',
                }}>
                <UX.Text
                  title={
                    dmtGroupMap[contentInscriptionId]?.dmtInscriptionIds
                      ?.length -
                    2 +
                    '+'
                  }
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
    </UX.Box>
  );
};

export default TapDmtGroupItem;
