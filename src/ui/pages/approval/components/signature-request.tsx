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
          <UX.Text title="Signature request" styleType="heading_14" />
          <UX.Text
            title="Only sign this message if you fully understand the content and trust the requesting site"
            styleType="body_14_normal"
          />
          <UX.Text title="You are signing" styleType="body_14_normal" />
          <UX.Text
            title="You are signing"
            styleType="body_14_bold"
            customStyles={{color: 'white', width: '100%', textAlign: 'start'}}
          />
        </UX.Box>
      }
      footer={
        <UX.Box layout="row_center" spacing="sm">
          <UX.Button title="Reject" styleType="dark" customStyles={{flex: 1}} />
          <UX.Button
            title="Sign"
            styleType="primary"
            customStyles={{flex: 1}}
          />
        </UX.Box>
      }
    />
  );
};

export default SignatureRequest;
