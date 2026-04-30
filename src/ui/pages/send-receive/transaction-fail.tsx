import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import {SVG} from '../../svg';

const FailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {error} = location.state;
  return (
    <LayoutSendReceive
      body={
        <UX.Box layout="column" style={{marginTop: '7rem'}} spacing="xl">
          <UX.Box layout="column_center" spacing="xl">
            <SVG.SendFailIcon />
            <UX.Text
              titleKey="transaction.failedToSend"
              styleType="heading_24"
              customStyles={{
                marginTop: '16px',
              }}
            />
            <UX.Text
              title={error}
              styleType="body_16_normal"
              customStyles={{textAlign: 'center'}}
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
            titleKey="common.done"
            onClick={() => navigate('/home')}
          />
        </UX.Box>
      }
    />
  );
};

export default FailScreen;
