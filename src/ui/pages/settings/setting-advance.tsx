import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useI18n} from '../../i18n';
import LayoutScreenSettings from '../../layouts/settings';
import Navbar from '../home-flow/components/navbar-navigate';
import EnableSignDataModal from './modal-sign-data';

const SettingAdvanced = () => {
  //! State
  const navigate = useNavigate();
  const [enableSignData, setEnableSignData] = useState(false);
  const [signDataModalVisible, setSignDataModalVisible] = useState(false);
  const wallet = useWalletProvider();
  const {t} = useI18n();

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
            text={t('settings.advanced.title')}
            onBackClick={() => navigate('/setting')}
          />
        </UX.Box>
      }
      body={
        <UX.Box style={{padding: '0 24px'}} spacing="xl">
          <UX.Box layout="box_border">
            <UX.Box spacing="xs">
              <UX.Text
                title={t('settings.advanced.signData.title')}
                styleType="body_16_bold"
                customStyles={{color: 'white'}}
              />
              <UX.Text
                title={t('settings.advanced.signData.description')}
                styleType="body_12_normal"
              />
              <UX.Box
                layout="row_between"
                style={{borderTop: '1px solid #545454', paddingTop: '8px'}}>
                <UX.Text
                  title={t('settings.advanced.signData.allow')}
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
