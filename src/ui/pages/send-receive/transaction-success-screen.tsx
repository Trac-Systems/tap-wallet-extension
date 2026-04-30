import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import {SVG} from '../../svg';
import {useBlockStreamUrl} from '../settings/hooks';
import { GlobalSelector } from '../../redux/reducer/global/selector';
import { useAppSelector } from '../../utils';

const SuccessScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const blockStreamURL = useBlockStreamUrl(networkType);
  const {txid}: {txid: string} = location.state;

  return (
    <LayoutSendReceive
      body={
        <UX.Box layout="column" style={{marginTop: '3rem'}} spacing="xl">
          <UX.Box layout="column_center" spacing="xl">
            <SVG.SendSuccessIcon />
            <UX.Text
              titleKey="transaction.sent"
              styleType="heading_24"
              customStyles={{
                marginTop: '16px',
              }}
            />
            <UX.Text
              titleKey="transaction.sentDescription"
              styleType="body_16_normal"
              customStyles={{textAlign: 'center', padding: '0 32px'}}
            />
          </UX.Box>
          <UX.Button
            styleType="text"
            titleKey="transaction.viewOnBlockExplorer"
            onClick={() => {
              const txLink = `${blockStreamURL}/tx/${txid}`;
              window.open(`${txLink}`);
            }}
          />
        </UX.Box>
      }
      footer={
        <UX.Box
          layout="column"
          spacing="xl"
          style={{
            padding: '10px 0',
          }}>
          <UX.Button
            styleType="primary"
            titleKey="common.done"
            onClick={() => navigate('/home')}
          />
        </UX.Box>
      }
    />
  );
};

export default SuccessScreen;
