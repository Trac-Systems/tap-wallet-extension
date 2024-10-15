import React from 'react';
import {copyToClipboard, shortAddress} from '../../helper';
import {SVG} from '../../svg';
import Box from '../box-custom';
import Text from '../text-custom';
import {useCustomToast} from '../toast-custom';

export function AddressBar({address}: {address: string}) {
  //   const tools = useTools();
  const {showToast} = useCustomToast();
  return (
    <Box
      spacing="sm"
      layout="row"
      style={{width: '140px', cursor: 'pointer'}}
      onClick={(event?: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        copyToClipboard(address).then(() => {
          showToast({
            type: 'copied',
            title: 'Copied',
          });
        });
      }}>
      <Text title={shortAddress(address)} styleType="body_14_normal" />
      <Box style={{width: 20}}>
        <SVG.CopyPink color="white" width={20} height={20} />
      </Box>
    </Box>
  );
}
