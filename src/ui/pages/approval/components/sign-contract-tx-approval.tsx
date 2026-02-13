import { UX } from '@/src/ui/component/index';
import { useApproval, useFee } from '../hook';
import LayoutApprove from '../layouts';
import WebsiteBar from '@/src/ui/component/website-bar';
import { useState } from 'react';

interface Props {
  params: {
    session: {
      origin: string;
      icon: string;
      name: string;
    };
    data: {
      contractTx: any;
    };
  };
}

export default function SignContractTxApproval({ params: { session, data } }: Props) {
  const [, resolveApproval, rejectApproval] = useApproval();
  const fee = useFee();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApprove = () => {
    resolveApproval({ approved: true });
  };

  const handleCancel = () => {
    rejectApproval('User rejected contract transaction signing');
  };

  const txParams = data?.contractTx || {};
  const jsonString = JSON.stringify(txParams, null, 2);
  const previewString = isExpanded ? jsonString : JSON.stringify(txParams, null, 2).slice(0, 200) + '...';

  return (
    <LayoutApprove
      header={<WebsiteBar session={session} />}
      body={
        <UX.Box spacing="sm" style={{ flex: 1, padding: '0 20px' }}>
          <UX.Box spacing="xs">
            <UX.Text
              title="Sign Contract Transaction"
              styleType="heading_18"
              customStyles={{ color: 'white', textAlign: 'center' }}
            />
            <UX.Text
              title="Review the transaction data below"
              styleType="body_14_normal"
              customStyles={{ color: '#888', textAlign: 'center' }}
            />
          </UX.Box>

          <UX.Box spacing="sm" style={{ marginTop: '12px' }}>
            <UX.Box
              layout="box_border"
              style={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '8px',
                maxHeight: isExpanded ? '400px' : '200px',
                overflowY: 'auto'
              }}
            >
              <UX.Box layout="row_between" style={{ width: '100%' }}>
                <UX.Text
                  title="Transaction Data"
                  styleType="body_12_bold"
                  customStyles={{ color: '#888' }}
                />
                <UX.Text
                  title={isExpanded ? 'Collapse' : 'Expand'}
                  styleType="body_12_bold"
                  customStyles={{
                    color: '#4CAF50',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onClick={() => setIsExpanded(!isExpanded)}
                />
              </UX.Box>
              <pre
                style={{
                  color: 'white',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  lineHeight: '1.4',
                  width: '100%'
                }}
              >
                {isExpanded ? jsonString : previewString}
              </pre>
            </UX.Box>

            {/* Network Fee Section */}
            <UX.Box layout="box_border">
              <UX.Box layout="row_between" style={{ width: '100%' }}>
                <UX.Text title="Network fee" styleType="body_12_bold" customStyles={{ color: '#888' }} />
                <UX.Text
                  title={`${fee} TNK`}
                  styleType="body_14_normal"
                  customStyles={{ color: 'white' }}
                />
              </UX.Box>
            </UX.Box>
          </UX.Box>

          <UX.Box
            layout="box_border"
            style={{
              backgroundColor: 'rgba(255, 107, 107, 0.05)',
              borderColor: 'rgba(255, 107, 107, 0.3)',
              marginTop: '12px',
              marginBottom: '20px'
            }}
          >
            <UX.Box spacing="xs">
              <UX.Text
                title="⚠️ Security Warning"
                styleType="body_12_bold"
                customStyles={{ color: '#ff6b6b' }}
              />
              <UX.Text
                title="Verify all transaction data carefully. This is a contract transaction with custom parameters."
                styleType="body_12_normal"
                customStyles={{ color: 'rgba(255, 255, 255, 0.6)' }}
              />
            </UX.Box>
          </UX.Box>
        </UX.Box>
      }
      footer={
        <UX.Box layout="row" spacing="sm" style={{ padding: '0 20px 20px' }}>
          <UX.Button
            styleType="dark"
            title="Cancel"
            onClick={handleCancel}
            customStyles={{ flex: 1 }}
          />
          <UX.Button
            styleType="primary"
            title="Sign"
            onClick={handleApprove}
            customStyles={{ flex: 1 }}
          />
        </UX.Box>
      }
    />
  );
}
