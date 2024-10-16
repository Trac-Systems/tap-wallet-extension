import QRCode from 'qrcode.react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../../component/index';
import {useCustomToast} from '../../component/toast-custom';
import {copyToClipboard} from '../../helper';
import LayoutSendReceive from '../../layouts/send-receive';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {SVG} from '../../svg';
import {useAppSelector} from '../../utils';

const Receive = () => {
  //! State
  const navigate = useNavigate();
  const {showToast} = useCustomToast();
  const currentAccount = useAppSelector(AccountSelector.activeAccount);
  const {address} = currentAccount;
  //! Function
  const handleGoBack = () => {
    navigate('/home');
  };

  const handleCopyAddress = () => {
    copyToClipboard(address).then(() => {
      showToast({
        type: 'copied',
        title: 'Copied',
      });
    });
  };

  //! Render
  return (
    <LayoutSendReceive
      header={<UX.TextHeader text="Receive" onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" spacing="xl">
          <UX.Box spacing="xl">
            <UX.Text
              title="Qr code"
              styleType="heading_16"
              customStyles={{color: 'white', textTransform: 'uppercase'}}
            />
            <QRCode
              value={address || ''}
              renderAs="svg"
              size={240}
              style={{
                border: '1px solid #545454',
                borderRadius: '10px',
                padding: '5px',
              }}
            />
          </UX.Box>
          <UX.Box spacing="xl">
            <UX.Text
              title="Wallet address"
              styleType="heading_16"
              customStyles={{color: 'white'}}
            />
            <UX.Text
              title={address}
              styleType="body_14_normal"
              customStyles={{
                wordWrap: 'break-word',
                width: '224px',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #545454',
              }}
            />
          </UX.Box>
        </UX.Box>
      }
      footer={
        <UX.Button
          styleType="dark"
          withIcon
          customStyles={{
            width: '100%',
          }}
          svgIcon={<SVG.CopyPink color="white" width={20} height={20} />}
          title="Copy address"
          onClick={handleCopyAddress}
        />
      }
    />
  );
};

export default Receive;
