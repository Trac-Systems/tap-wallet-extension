import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import {SVG} from '../../svg';
import {TRAC_EXPLORER_URL} from '../../../background/constants/trac-api';

const SendTracSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {txHash}: {txHash: string} = location.state;

  const handleViewOnExplorer = () => {
    const explorerUrl = `${TRAC_EXPLORER_URL}/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <LayoutSendReceive
      body={
        <UX.Box layout="column" style={{marginTop: '3rem'}} spacing="xl">
          <UX.Box layout="column_center" spacing="xl">
            <SVG.SendSuccessIcon />
            <UX.Text
              title="Transaction Sent"
              styleType="heading_24"
              customStyles={{
                marginTop: '16px',
              }}
            />
            <UX.Text
              title="Your transaction has been sent to the network and can take time to proceed."
              styleType="body_16_normal"
              customStyles={{textAlign: 'center', padding: '0 32px'}}
            />
          </UX.Box>
          {txHash && (
            <UX.Button
              styleType="text"
              title="View on Explorer"
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
            title="Done"
            onClick={() => navigate('/home')}
          />
        </UX.Box>
      }
    />
  );
};

export default SendTracSuccess;
