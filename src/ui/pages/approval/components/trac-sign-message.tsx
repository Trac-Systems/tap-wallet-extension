import { useEffect, useState } from 'react';
import { UX } from '@/src/ui/component';
import { useApproval } from '../hook';
import LayoutApprove from '../layouts';

export default function TracSignMessage({ params }) {
  const { message, session } = params.data || params;
  const [, resolveApproval, rejectApproval] = useApproval();

  const handleSign = () => {
    resolveApproval({ approved: true });
  };

  const handleCancel = () => {
    rejectApproval('User rejected signature request');
  };

  return (
    <LayoutApprove
      header={
        <UX.TextHeader
          text="Sign Message"
          onBackClick={handleCancel}
        />
      }
      body={
        <UX.Box spacing="xl" style={{ margin: '0 24px' }}>
          {/* Website info - only show if origin is available */}
          {session?.origin && session.origin !== 'Unknown' && (
            <UX.Box layout="box_border">
              <UX.Box spacing="sm">
                <UX.Text
                  title="Website"
                  styleType="body_12_normal"
                  customStyles={{ color: '#888' }}
                />
                <UX.Text
                  title={session.origin}
                  styleType="body_14_bold"
                  customStyles={{ color: 'white' }}
                />
              </UX.Box>
            </UX.Box>
          )}

          {/* Message to sign */}
          <UX.Box spacing="sm">
            <UX.Text
              title="Message to sign:"
              styleType="body_14_bold"
              customStyles={{ color: 'white' }}
            />
            <UX.Box
              layout="box_border"
              style={{
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '12px',
                backgroundColor: '#1a1a1a',
              }}
            >
              <UX.Text
                title={message || ''}
                styleType="body_12_normal"
                customStyles={{
                  color: '#ddd',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              />
            </UX.Box>
          </UX.Box>

          {/* Warning */}
          <UX.Box
            layout="box_border"
            style={{
              backgroundColor: '#2a1a1a',
              borderColor: '#ff6b6b',
            }}
          >
            <UX.Box spacing="sm">
              <UX.Text
                title="⚠️ WARNING"
                styleType="body_14_bold"
                customStyles={{ color: '#ff6b6b' }}
              />
              <UX.Text
                title="Only sign messages from trusted websites. Malicious signatures can compromise your account."
                styleType="body_12_normal"
                customStyles={{ color: '#ffaaaa' }}
              />
            </UX.Box>
          </UX.Box>
        </UX.Box>
      }
      footer={
        <UX.Box layout="row_between" style={{ margin: '0 24px 24px' }}>
          <UX.Button
            styleType="default"
            title="Cancel"
            onClick={handleCancel}
            customStyles={{ flex: 1, marginRight: '8px' }}
          />
          <UX.Button
            styleType="primary"
            title="Sign Message"
            onClick={handleSign}
            customStyles={{ flex: 1, marginLeft: '8px' }}
          />
        </UX.Box>
      }
    />
  );
}
