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
import {useNavigate} from 'react-router-dom';

interface TapDmtGroupItemProps {
  contentInscriptionId: string;
  ticker: string;
  tagColor?: string;
}

const TapDmtGroupItem = (props: TapDmtGroupItemProps) => {
  const wallet = useWalletProvider();
  const navigate = useNavigate();

  //! State
  const {contentInscriptionId, ticker, tagColor} = props;
  const network = useAppSelector(GlobalSelector.networkType);
  const dmtCollectibleMap = useAppSelector(AccountSelector.dmtCollectibleMap);
  const renderDmtLink = useMemo(() => {
    return getRenderDmtLink(network);
  }, [network]);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [isExpandView, setExpandView] = useState(false);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const dmtGroupMap = useAppSelector(AccountSelector.dmtGroupMap);
  const [tokenSummary, setTokenSummary] = useState<AddressTokenSummary>();
  const [loading, setLoading] = useState(false);

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

  const handleNavigate = () => {
    navigate('/home/dmt-list', {
      state: {
        contentInscriptionId: contentInscriptionId,
      },
    });
  };

  //! Effect Function
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

  if (loading) {
    return (
      <UX.Box layout="row_center">
        <SVG.LoadingIcon />
      </UX.Box>
    );
  }

  return (
    <UX.Box
      ref={el => (cardRefs.current[ticker] = el)}
      layout="box"
      key={ticker}
      style={{
        flexDirection: 'column',
        alignItems: 'flex-start',
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
              onClick={handleNavigate}
              title={formatTicker(ticker)}
              styleType="body_16_normal"
              customStyles={{
                display: 'block',
                color: 'white',
                maxWidth: '150px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'pre',
                cursor: 'pointer',
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
          <UX.Box layout="row" spacing="xss_s">
            {dmtGroupMap[contentInscriptionId]?.dmtInscriptionIds?.map(
              (item, index) => {
                if (index > 1) {
                  return;
                }
                return (
                  <UX.Box
                    key={item}
                    layout="column_center"
                    onClick={() =>
                      navigate('/home/inscription-detail', {
                        state: {
                          inscriptionId: item,
                        },
                      })
                    }
                    style={{
                      cursor: 'pointer',
                    }}>
                    <iframe
                      key={item}
                      width="56px"
                      height="56px"
                      sandbox="allow-scripts allow-same-origin"
                      src={`${renderDmtLink}/${dmtCollectibleMap[item].contentInscriptionId}/${item}?block=${dmtCollectibleMap[item]?.block}`}
                    />
                  </UX.Box>
                );
              },
            )}
            {dmtGroupMap[contentInscriptionId]?.dmtInscriptionIds?.length >
            3 ? (
              <UX.Box
                layout="row_center"
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '10px',
                  border: '1px solid #D16B7C',
                }}>
                <UX.Text
                  onClick={handleNavigate}
                  title={
                    dmtGroupMap[contentInscriptionId]?.dmtInscriptionIds
                      ?.length -
                    2 +
                    '+'
                  }
                  styleType="body_14_bold"
                  customStyles={{
                    color: colors.main_500,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    alignItems: 'center',
                    background: 'transparent',
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
