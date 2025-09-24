import {UX} from '../../component/index';
import LayoutScreenImport from '../../layouts/import-export';
import {useNavigate} from 'react-router-dom';
import {SVG} from '../../svg';
import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {formatArray} from '../../helper';
import {colors} from '../../themes/color';
import {CreateWalletContext} from './services/wallet-service-create';
import {useCustomToast} from '../../component/toast-custom';

const CheckSeedPhrase = () => {
  //! State
  const navigate = useNavigate();
  // Validate against 24-word seed phrase
  const checkIndexArray: number[] = Array.from({length: 24}, (_, i) => i + 1);
  const [focusIndex, setFocusIndex] = useState<number | undefined>(0);
  const [seedPhraseCheck, setSeedPhraseCheck] = useState({});
  const [isDisabled, setIsDisabled] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const CreateWalletContextHandler = useContext(CreateWalletContext);
  const mnemonic = CreateWalletContextHandler.Handlers.mnemonic;
  const {showToast} = useCustomToast();
  const getRandomElements = useMemo(() => {
    const result: number[] = [];
    const clonedArr: number[] = [...checkIndexArray];

    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * clonedArr.length);
      result.push(clonedArr[randomIndex]);
      clonedArr.splice(randomIndex, 1);
    }
    result.sort((a, b) => a - b);
    return result;
  }, []);

  const formattedString = formatArray(getRandomElements);

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleOnFocus = (index: number) => {
    setFocusIndex(index);
  };

  const handleOnBlur = () => {
    setFocusIndex(undefined);
  };

  const handleOnChange = (seedPhraseIndex: number, data: string) => {
    setSeedPhraseCheck(prevState => ({
      ...prevState,
      [seedPhraseIndex]: data,
    }));
  };

  const compareWords = useMemo(() => {
    const mnemonicWords = mnemonic.split(' ');

    return Object.entries(seedPhraseCheck).every(([key, value]) => {
      const index = parseInt(key) - 1;
      const mnemonicWord = mnemonicWords[index];

      return mnemonicWord === value;
    });
  }, [seedPhraseCheck]);

  const handleNavigate = () => {
    if (compareWords) {
      navigate('/choose-address');
    } else {
      showToast({
        title: 'Wrong seed phrase',
        type: 'error',
      });
    }
  };
  //! Effect
  useEffect(() => {
    const nonEmptyValuesCount = Object.values(seedPhraseCheck).filter(
      value => value !== '',
    ).length;
    setIsDisabled(nonEmptyValuesCount !== 3);
  }, [seedPhraseCheck]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [getRandomElements]);

  //! Render
  return (
    <LayoutScreenImport
      header={<UX.TextHeader onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" spacing="xxl_lg">
          <SVG.SeedPhraseIcon />
          <UX.Box layout="column_center" spacing="xl">
            <UX.Text title="Let's check" styleType="heading_24" />
            <UX.Text
              title={`To make sure you saved the words correctly, enter words ${formattedString}`}
              styleType="body_16_normal"
              customStyles={{textAlign: 'center'}}
            />
          </UX.Box>
          <UX.Box layout="column" spacing="xl" style={{width: '100%'}}>
            {getRandomElements.map((x, index) => {
              return (
                <UX.Box key={x}>
                  <UX.Box
                    layout="row_center"
                    spacing="xs"
                    style={{justifyContent: 'flex-start', padding: '0 12px'}}>
                    <UX.Text
                      styleType="body_16_normal"
                      title={`${x}. `}
                      customStyles={{color: colors.white}}
                    />
                    <UX.NonBorderInput
                      style={{
                        border: 'none',
                        background: 'transparent',
                        width: '100%',
                      }}
                      ref={el => (inputRefs.current[index] = el)}
                      autoFocus
                      onFocus={() => handleOnFocus(index)}
                      onBlur={() => handleOnBlur()}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleOnChange(x, e.target.value);
                      }}
                    />
                  </UX.Box>
                  <hr
                    style={{
                      width: '100%',
                      height: '1px',
                      backgroundColor: colors.gray,
                      marginTop: '10px',
                      borderColor:
                        focusIndex === index
                          ? colors.white_light_100
                          : colors.gray,
                    }}
                  />
                </UX.Box>
              );
            })}
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
            title="Confirm"
            onClick={handleNavigate}
            isDisable={isDisabled}
          />
        </UX.Box>
      }
    />
  );
};

export default CheckSeedPhrase;
