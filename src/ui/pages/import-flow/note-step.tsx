import {useNavigate} from 'react-router-dom';
import {UX} from '../../component/index';
import LayoutScreenImport from '../../layouts/import-export';
import {SVG} from '../../svg';
import {useContext} from 'react';
import {CreateWalletContext} from './services/wallet-service-create';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {isEmpty} from 'lodash';

const NoteStep = () => {
  //! State
  const navigate = useNavigate();
  const CreateWalletContextHandler = useContext(CreateWalletContext);
  const walletProvider = useWalletProvider();

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = async () => {
    const _mnemonic: string = await walletProvider.generateMnemonic();
    if (!isEmpty(_mnemonic)) {
      CreateWalletContextHandler.Handlers.mnemonic = _mnemonic;
      navigate('/show-seed-phrase');
    }
  };

  //! Render
  return (
    <LayoutScreenImport
      header={<UX.TextHeader onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" spacing="xl">
          <SVG.PenIcon />
          <UX.Box layout="column_center">
            <UX.Text
              titleKey="onboarding.takePenPaper"
              styleType="heading_24"
              customStyles={{
                marginTop: '16px',
              }}
            />
          </UX.Box>
          <UX.Text
            titleKey="onboarding.seedWriteWarning"
            styleType="body_16_normal"
            customStyles={{textAlign: 'center'}}
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
            titleKey="common.continue"
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default NoteStep;
