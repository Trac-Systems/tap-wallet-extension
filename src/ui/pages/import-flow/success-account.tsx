import {UX} from '../../component/index';
import LayoutScreenImport from '../../layouts/import-export';
import {useLocation, useNavigate} from 'react-router-dom';
import {SVG} from '../../svg';

const SuccessAccount = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isImport = queryParams.get('isImport');
  const text = isImport ? 'restored' : 'created';

  //! Function
  const handleNavigate = () => {
    navigate('/home');
  };
  //! Render
  return (
    <LayoutScreenImport
      body={
        <UX.Box layout="column_center" spacing="xxl_lg">
          <SVG.SuccessIcon />
          <UX.Box layout="column_center" spacing="sm">
            <UX.Text title="Congratulations!" styleType="heading_24" />
            <UX.Text
              title={`Your wallet successfully ${text}.`}
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
            title="Go to wallet"
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default SuccessAccount;
