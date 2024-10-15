import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {useWalletProvider} from '../../gateway/wallet-provider';
import LayoutScreenSettings from '../../layouts/settings';
import Navbar from '../home-flow/components/navbar-navigate';
import EnableSignDataModal from './modal-sign-data';

const SettingAdvanced = () => {
  //! State
  const navigate = useNavigate();
  const [enableSignData, setEnableSignData] = useState(false);
  const [signDataModalVisible, setSignDataModalVisible] = useState(false);
  const wallet = useWalletProvider();

  //! Function
  const getEnableSignData = async () => {
    const enableSignData = await wallet.getEnableSignData();
    setEnableSignData(enableSignData);
  };
  useEffect(() => {
    getEnableSignData();
  }, []);

  //! Render
  return (
    <LayoutScreenSettings
      header={
        <UX.Box style={{padding: '0 24px'}}>
          <UX.TextHeader
            text="Advanced"
            onBackClick={() => navigate('/setting')}
          />
        </UX.Box>
      }
      body={
        <UX.Box style={{padding: '0 24px'}} spacing="xl">
          <UX.Box layout="box_border">
            <UX.Box spacing="xs">
              <UX.Text
                title="signData requests"
                styleType="body_16_bold"
                customStyles={{color: 'white'}}
              />
              <UX.Text
                title="If you enable this settings, you might get signature requests that aren’t readable. By signing a message you don’t understand, you could be agreeing to give away your funds and NFTs. You’re at risk for phishing attacks. Protect yourself by turning off signData."
                styleType="body_12_normal"
              />
              <UX.Box
                layout="row_between"
                style={{borderTop: '1px solid #545454', paddingTop: '8px'}}>
                <UX.Text
                  title="Allow signData requests"
                  styleType="body_14_bold"
                  customStyles={{color: 'white'}}
                />
                <UX.SwitchCustom
                  onChange={async () => {
                    if (enableSignData) {
                      await wallet.setEnableSignData(false);
                      setEnableSignData(false);
                    } else {
                      setSignDataModalVisible(true);
                    }
                  }}
                  checked={enableSignData}
                />
              </UX.Box>
            </UX.Box>
          </UX.Box>
          <EnableSignDataModal
            open={signDataModalVisible}
            onNext={async () => {
              await wallet.setEnableSignData(true).then(() => {
                setEnableSignData(true);
                setSignDataModalVisible(false);
              });
            }}
            onCancel={() => {
              setSignDataModalVisible(false);
            }}
          />
        </UX.Box>
      }
      footer={<Navbar />}
    />
  );
};

export default SettingAdvanced;
