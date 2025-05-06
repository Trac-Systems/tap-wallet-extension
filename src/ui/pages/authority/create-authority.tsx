import { useLocation, useNavigate } from 'react-router-dom';
import { UX } from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import { FeeRateBar } from '../send-receive/component/fee-rate-bar';

const CreateAuthority = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const {state} = location;
  const type = state.type;
  const rawTxInfo = '';
  const title =
    type === 'create'
      ? 'Create account'
      : type === 'confirm'
        ? 'Confirm Tap'
        : 'Cancel Tapped';

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };
  const handleNavigate = () => {
    navigate('/sign-authority', {
      state: {rawTxInfo},
    });
  };

  //! Render
  return (
    <LayoutSendReceive
      header={<UX.TextHeader text={title} onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column" spacing="xxl" style={{width: '100%'}}>
          {type === 'confirm' ? null : (
            <UX.Box layout="column" spacing="xss">
              <UX.Text
                styleType="body_16_bold"
                title={type === 'cancel' ? 'Cancel Preview' : 'Preview'}
              />
              <UX.TextArea height="350px" />
            </UX.Box>
          )}

          <UX.Box layout="column" spacing="xss">
            <UX.Text
              styleType="heading_16"
              customStyles={{color: 'white'}}
              title="Fee rate"
            />
            <FeeRateBar
            // onChange={val => {
            //   updateContextData({feeRate: val});
            // }}
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
            title={type !== 'create' ? 'Confirm' : 'Create'}
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default CreateAuthority;
