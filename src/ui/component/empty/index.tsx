import Box from '../box-custom';
import Text from '../text-custom';

const Empty = () => {
  return (
    <Box layout="row_center" style={{height: '20vh'}}>
      <Text
        titleKey="common.empty"
        styleType="body_14_bold"
        customStyles={{color: 'white'}}
      />
    </Box>
  );
};

export default Empty;
