import React from 'react';
import {UX} from '@/src/ui/component';
import {colors} from '@/src/ui/themes/color';
import {SVG} from '@/src/ui/svg';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';

export const AuthorityWarning = () => {
  return (
    <LayoutSendReceive
      header={<UX.TextHeader text="Create Authority" />}
      body={
        <UX.Box layout="column" spacing="xxl" style={{width: '100%'}}>
          <UX.Box spacing="xs">
            <UX.Box
              layout="box_border"
              spacing="sm"
              style={{background: colors.red_700}}>
              <SVG.WaringIcon />
              <UX.Text
                styleType="body_14_bold"
                customStyles={{color: colors.white, maxWidth: '90%'}}
                title={
                  'You just created an authority which is being processed. Please take precautions while making continuous transactions.'
                }
              />
            </UX.Box>
          </UX.Box>
        </UX.Box>
      }
    />
  );
};
