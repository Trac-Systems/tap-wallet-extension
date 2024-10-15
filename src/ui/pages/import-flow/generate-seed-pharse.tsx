import {UX} from '../../component/index';
import LayoutScreenImport from '../../layouts/import-export';
import {SVG} from '../../svg';

const GenerateSeedPhrase = () => {
  //! Render
  return (
    <LayoutScreenImport
      body={
        <UX.Box layout="column_center" spacing="xxl_lg">
          <SVG.SettingIcon />
          <UX.Box layout="column_center">
            <UX.Text title="Generating your seed phrase..." styleType="heading_24" />
          </UX.Box>
        </UX.Box>
      }
    />
  );
};

export default GenerateSeedPhrase;
