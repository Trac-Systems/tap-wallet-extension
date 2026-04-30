import React from 'react';
import LayoutApprove from '../layouts';
import WebsiteBar from '@/src/ui/component/website-bar';
import {UX} from '@/src/ui/component';

interface Props {
  params: {
    session: {
      origin: string;
      icon: string;
      name: string;
    };
  };
}
const SignatureRequest = ({params: {session}}: Props) => {
  return (
    <LayoutApprove
      header={<WebsiteBar session={session} />}
      body={
        <UX.Box layout="column_center" spacing="xl">
          <UX.Text titleKey="approval.signatureRequest.title" styleType="heading_14" />
          <UX.Text
            titleKey="approval.signatureRequest.warning"
            styleType="body_14_normal"
          />
          <UX.Text titleKey="approval.signatureRequest.youAreSigning" styleType="body_14_normal" />
          <UX.Text
            titleKey="approval.signatureRequest.youAreSigning"
            styleType="body_14_bold"
            customStyles={{color: 'white', width: '100%', textAlign: 'start'}}
          />
        </UX.Box>
      }
      footer={
        <UX.Box layout="row_center" spacing="sm">
          <UX.Button titleKey="common.reject" styleType="dark" customStyles={{flex: 1}} />
          <UX.Button
            titleKey="common.sign"
            styleType="primary"
            customStyles={{flex: 1}}
          />
        </UX.Box>
      }
    />
  );
};

export default SignatureRequest;
