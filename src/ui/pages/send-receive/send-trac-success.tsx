import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import {SVG} from '../../svg';
import {getTracExplorerUrl} from '../../../background/constants/trac-api';
import {useAppSelector} from '../../utils';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {NETWORK_TYPES, Network} from '../../../wallet-instance';

const SendTracSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {txHash}: {txHash: string} = location.state;
  const networkType = useAppSelector(GlobalSelector.networkType);

  const handleViewOnExplorer = () => {
    const currentNetwork = networkType === NETWORK_TYPES.MAINNET.label ? Network.MAINNET : Network.TESTNET;
    const explorerUrl = `${getTracExplorerUrl(currentNetwork)}/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

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
          {txHash && (
            <UX.Button
              styleType="text"
              titleKey="transaction.viewOnExplorer"
              onClick={handleViewOnExplorer}
            />
          )}
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

export default SendTracSuccess;
