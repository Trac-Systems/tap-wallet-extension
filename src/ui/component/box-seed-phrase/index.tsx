import {colors} from '../../themes/color';
import Box from '../box-custom';
import Text from '../text-custom';

interface IBoxShowSeedPhraseProps {
  mnemonics: string;
}

const BoxShowSeedPhrase = (props: IBoxShowSeedPhraseProps) => {
  const {mnemonics} = props;

  const words = mnemonics?.split(' ');
  const wordsGrid = [
    words?.slice(0, words.length / 2),
    words?.slice(words.length / 2),
  ];

  return (
    <Box
      layout="row_center"
      spacing="xxl_xxl"
      style={{
        width: '100%',
        borderRadius: 16,
        backgroundColor: colors.black_3,
      }}>
      {wordsGrid.map((item, i) => {
        return (
          <Box
            layout="column_center"
            spacing="xs"
            key={i}
            style={{padding: '24px', alignItems: 'start'}}>
            {item.map((text, index) => {
              return (
                <Box
                  key={text}
                  layout="row_between"
                  style={{width: '100px'}}
                  spacing="sm">
                  <Text
                    title={String(index + 1 + i * (words.length / 2))}
                    styleType="body_14_normal"
                    customStyles={{color: colors.white, width: '15px'}}
                  />
                  <Text
                    title={text}
                    styleType="body_14_bold"
                    customStyles={{
                      color: colors.white,
                      flex: 1,
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
};

export default BoxShowSeedPhrase;
