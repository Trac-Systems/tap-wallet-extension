import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import {SVG} from '../../svg';

const SendTracSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {txid}: {txid: string} = location.state;

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
