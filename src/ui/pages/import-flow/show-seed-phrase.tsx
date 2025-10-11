import {useContext, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../../component/index';
import {useCustomToast} from '../../component/toast-custom';
import {copyToClipboard} from '../../helper';
import LayoutScreenImport from '../../layouts/import-export';
import {SVG} from '../../svg';
import {spaces} from '../../themes/space';
import GenerateSeedPhrase from './generate-seed-pharse';
import {CreateWalletContext} from './services/wallet-service-create';

const ShowSeedPhrase = () => {
  //! State
  const navigate = useNavigate();
  const {showToast} = useCustomToast();
  const [loading, setLoading] = useState(false);
  const CreateWalletContextHandler = useContext(CreateWalletContext);
  const mnemonicContext = CreateWalletContextHandler.Handlers.mnemonic;

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = () => {
    navigate('/check-seed-phrase');
  };

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  //! Render
  if (loading) {
    return <GenerateSeedPhrase />;
  }

  return (
    <LayoutScreenImport
      header={<UX.TextHeader onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" spacing="xl">
          <SVG.SeedPhraseIcon />
          <UX.Text
            title="Your seed phrase"
            styleType="heading_24"
            customStyles={{
              marginTop: spaces.xl,
              textAlign: 'center',
            }}
          />
          <UX.Text
            title="Write these 24 words in exactly that order and store them in a safe place."
            styleType="body_16_normal"
            customStyles={{textAlign: 'center', marginBottom: spaces.xl}}
          />
          <UX.BoxShowSeedPhrase mnemonics={mnemonicContext} />
          <UX.Button
            styleType="copy"
            title="Copy to clipboard"
            copy
            onClick={() => {
              copyToClipboard(mnemonicContext);
              showToast({
                type: 'copied',
                title: 'Copied',
              });
            }}
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
            title="Okay, I saved them somewhere safe"
            onClick={() => handleNavigate()}
          />
        </UX.Box>
      }
    />
  );
};

export default ShowSeedPhrase;
