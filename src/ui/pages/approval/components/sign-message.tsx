import {UX} from '@/src/ui/component';
import {useApproval} from '../hook';
import WebsiteBar from '../../../component/website-bar';
import LayoutApprove from '../layouts';

interface Props {
  params: {
    data: {
      text: string;
      type: string;
    };
    session: {
      origin: string;
      icon: string;
      name: string;
    };
  };
}
export default function SignMessage({params: {data, session}}: Props) {
  const [, resolveApproval, rejectApproval] = useApproval();

  const handleCancel = () => {
    rejectApproval();
  };

  const handleConfirm = () => {
    resolveApproval();
  };

  return (
    <LayoutApprove
      header={<WebsiteBar session={session} />}
      body={
        <UX.Box style={{flex: 1}} spacing="sm">
          <UX.Text title="Signature request" styleType="body_14_bold" />
          <UX.Text
            title="Only sign this message if you fully understand the content and trust the requesting site."
            styleType="body_12_normal"
          />
          <UX.Text title="You are signing:" styleType="body_12_normal" />
          <UX.Box>
            <div
              style={{
                userSelect: 'text',
                fontFamily: 'Exo-2-Regular',
                fontStyle: 'normal',
                fontSize: 14,
                fontWeight: 400,
                maxHeight: 384,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flexWrap: 'wrap',
              }}>
              {data.text}
            </div>
          </UX.Box>
        </UX.Box>
      }
      footer={
        <UX.Box layout="row" spacing="sm">
          <UX.Button
            title="Reject"
            styleType="dark"
            onClick={handleCancel}
            customStyles={{flex: 1}}
          />
          <UX.Button
            title="Sign"
            styleType="primary"
            onClick={handleConfirm}
            customStyles={{flex: 1}}
          />
        </UX.Box>
      }
    />
  );
}
