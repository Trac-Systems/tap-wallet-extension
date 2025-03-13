import { UX } from '@/src/ui/component';
import { TickerDMT } from '@/src/ui/component/ticker-dmt';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import { AccountSelector } from '@/src/ui/redux/reducer/account/selector';
import { GlobalSelector } from '@/src/ui/redux/reducer/global/selector';
import { colors } from '@/src/ui/themes/color';
import {
  getInscriptionContentLink,
  getRenderDmtLink,
  useAppSelector,
} from '@/src/ui/utils';
import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const DmtList = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const {id} = useParams();
  const network = useAppSelector(GlobalSelector.networkType);
  const dmtGroupMap = useAppSelector(AccountSelector.dmtGroupMap);
  const contentInscriptionId = id;
  const renderDmtLink = useMemo(() => {
    return getRenderDmtLink(network);
  }, [network]);
  const dmtCollectibleMap = useAppSelector(AccountSelector.dmtCollectibleMap);

  const contentLink = useMemo(() => {
    return getInscriptionContentLink(network);
  }, [network]);

  //! Function
  const handleGoBack = () => {
    navigate('/home?tab=1&childTab=1');
  };

  //! Render
  return (
    <LayoutSendReceive
      header={
        <UX.TextHeader
          text={dmtGroupMap[contentInscriptionId]?.ticker}
          onBackClick={handleGoBack}
        />
      }
      body={
        <UX.Box layout="grid_column_2" spacing="sm" style={{flexWrap: 'wrap'}}>
          {dmtGroupMap[contentInscriptionId]?.dmtInscriptionIds?.map(item => (
            <UX.Box
              layout="column"
              key={item}
              onClick={() =>
                navigate('/home/inscription-detail', {
                  state: {
                    inscriptionId: item,
                    hash: location.pathname,
                  },
                })
              }
              style={{
                cursor: 'pointer',
                width: '100%',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative',
              }}>
              <TickerDMT top={11} />
              <iframe
                key={item}
                width="100%"
                className="iframe-dmt-list"
                sandbox="allow-scripts allow-same-origin"
                src={
                  dmtCollectibleMap[item]?.unat
                    ? `${renderDmtLink}/${dmtCollectibleMap[item].contentInscriptionId}/${item}?block=${dmtCollectibleMap[item]?.block}`
                    : `${contentLink}/${item}`
                }
              />
              <UX.Box
                style={{
                  padding: '12px 10px',
                  background: '#272727',
                  width: '100%',
                }}>
                <UX.Text
                  title={`#${dmtCollectibleMap?.[item]?.inscriptionNumber}`}
                  styleType="body_16_bold"
                  customStyles={{color: 'white'}}
                />
                <UX.Text
                  title={`${dmtCollectibleMap[item]?.outputValue} SATs`}
                  styleType="body_16_bold"
                  customStyles={{color: colors.main_500}}
                />
              </UX.Box>
            </UX.Box>
          ))}
        </UX.Box>
      }
    />
  );
};

export default DmtList;
