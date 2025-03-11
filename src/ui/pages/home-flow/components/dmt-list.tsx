import {UX} from '@/src/ui/component';
import {TickerDMT} from '@/src/ui/component/ticker-dmt';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {getRenderDmtLink, useAppSelector} from '@/src/ui/utils';
import {useMemo} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';

const DmtList = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const {state} = location;
  const network = useAppSelector(GlobalSelector.networkType);
  const dmtGroupMap = useAppSelector(AccountSelector.dmtGroupMap);
  const contentInscriptionId = state.contentInscriptionId;
  const renderDmtLink = useMemo(() => {
    return getRenderDmtLink(network);
  }, [network]);
  const dmtCollectibleMap = useAppSelector(AccountSelector.dmtCollectibleMap);

  //! Function
  const handleGoBack = () => {
    navigate(-1);
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
              layout="column_center"
              key={item}
              onClick={() =>
                navigate('/home/inscription-detail', {
                  state: {
                    inscriptionId: item,
                  },
                })
              }
              style={{
                cursor: 'pointer',
                position: 'relative',
                width: '100%',
                borderRadius: '10px',
                overflow: 'hidden',
              }}>
              <TickerDMT top={11} />
              <iframe
                key={item}
                width="100%"
                height="100%"
                sandbox="allow-scripts allow-same-origin"
                src={`${renderDmtLink}/${dmtCollectibleMap[item].contentInscriptionId}/${item}?block=${dmtCollectibleMap[item]?.block}`}
              />
            </UX.Box>
          ))}
        </UX.Box>
      }
    />
  );
};

export default DmtList;
