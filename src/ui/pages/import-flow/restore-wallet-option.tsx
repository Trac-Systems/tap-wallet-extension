import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../../component/index';
import LayoutScreenImport from '../../layouts/import-export';
import {SVG} from '../../svg';

const RestoreWalletOption = () => {
  //! State
  const navigate = useNavigate();
  const [typeRestore, setTypeRestore] = useState('mnemonics');

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleChangeType = (type: string) => {
    setTypeRestore(type);
  };

  const handleNavigate = () => {
    navigate(`/restore-wallet?restore=${typeRestore}`);
  };

  //! Render
  return (
    <LayoutScreenImport
      header={<UX.TextHeader onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" spacing="xxl">
          <SVG.SeedPhraseIcon />
          <UX.Text
            titleKey="wallet.restoreExisting"
            styleType="heading_24"
            customStyles={{
              textAlign: 'center',
              marginTop: '8px',
            }}
          />
          <UX.Box spacing="xss">
            <UX.Card
              textKey="wallet.restoreFromMnemonics"
              isActive={typeRestore === 'mnemonics'}
              onClick={() => handleChangeType('mnemonics')}
              style={{height: '50px', lineHeight: '50px'}}
            />
            <UX.Card
              isActive={typeRestore !== 'mnemonics'}
              textKey="wallet.restoreFromPrivateKey"
              onClick={() => handleChangeType('key')}
              style={{height: '50px', lineHeight: '50px'}}
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
            titleKey="wallet.restore"
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default RestoreWalletOption;
