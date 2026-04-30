import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {useI18n, useTranslatedToast, type Language} from '../../i18n';
import LayoutScreenSettings from '../../layouts/settings';
import {SVG} from '../../svg';
import Navbar from '../home-flow/components/navbar-navigate';

const LanguageSettings = () => {
  const navigate = useNavigate();
  const {language, languageLabels, setLanguage, supportedLanguages, t} = useI18n();
  const {showTranslatedToast} = useTranslatedToast();

  const handleChangeLanguage = (nextLanguage: Language) => {
    if (nextLanguage === language) {
      return;
    }

    setLanguage(nextLanguage);
    showTranslatedToast({
      type: 'success',
      titleKey: 'settings.language.changed',
      language: nextLanguage,
    });
  };

  return (
    <LayoutScreenSettings
      header={
        <UX.Box style={{padding: '0 24px'}}>
          <UX.TextHeader
            text={t('settings.language.title')}
            onBackClick={() => navigate('/setting')}
          />
        </UX.Box>
      }
      body={
        <UX.Box spacing="xl" style={{padding: '0 24px'}}>
          {supportedLanguages.map(option => (
            <UX.Box
              key={option}
              layout="box_border"
              onClick={() => handleChangeLanguage(option)}
              style={{cursor: 'pointer'}}>
              <UX.Text
                title={languageLabels[option]}
                styleType="body_16_bold"
                customStyles={{color: 'white'}}
              />
              {language === option && <SVG.CheckIcon />}
            </UX.Box>
          ))}
        </UX.Box>
      }
      footer={<Navbar />}
    />
  );
};

export default LanguageSettings;
