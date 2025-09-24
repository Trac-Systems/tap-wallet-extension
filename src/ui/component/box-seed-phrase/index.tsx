import {colors} from '../../themes/color';
import Box from '../box-custom';
import Text from '../text-custom';

interface IBoxShowSeedPhraseProps {
  mnemonics: string;
}

const BoxShowSeedPhrase = (props: IBoxShowSeedPhraseProps) => {
  const {mnemonics} = props;

  const words = mnemonics?.split(' ');
  const wordsPerColumn = words.length === 24 ? 8 : words.length / 2;
  const wordsGrid = [
    words?.slice(0, wordsPerColumn),
    words?.slice(wordsPerColumn, wordsPerColumn * 2),
    words?.slice(wordsPerColumn * 2),
  ].filter(column => column && column.length > 0);

  return (
    <Box
      layout="row_center"
      style={{
        width: '100%',
        borderRadius: 16,
        backgroundColor: colors.black_3,
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
      {wordsGrid.map((item, i) => {
        return (
          <Box
            layout="column_center"
            spacing="xs"
            key={i}
            style={{padding: '0px', alignItems: 'center', flex: 1}}>
            {item.map((text, index) => {
              return (
                <Box
                  key={text}
                  layout="row_between"
                  style={{width: '100px'}}
                  spacing="sm">
                  <Text
                    title={String(index + 1 + i * wordsPerColumn)}
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
