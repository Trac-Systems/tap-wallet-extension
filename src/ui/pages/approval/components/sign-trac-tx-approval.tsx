import { UX } from '@/src/ui/component/index';
import { TracApiService } from '@/src/background/service/trac-api.service';
import { useApproval } from '../hook';
import LayoutApprove from '../layouts';
import WebsiteBar from '@/src/ui/component/website-bar';

interface SignTracTxParams {
  txData: {
    from: string;
    to: string;
    amount: string;
    validity: string;
    nonce: any;
    networkId?: number;
  };
}

interface Props {
  params: {
    session: {
      origin: string;
      icon: string;
      name: string;
    };
    data: {
      txData: SignTracTxParams['txData'];
    };
  };
}

export default function SignTracTxApproval({ params: { session, data } }: Props) {
  const [, resolveApproval, rejectApproval] = useApproval();

  const handleApprove = () => {
    resolveApproval({ approved: true });
  };

  const handleCancel = () => {
    rejectApproval('User rejected transaction signing');
  };

  const txData = data?.txData;

  const formatNumber = (numStr: string) => {
    const parts = numStr.split('.');
    // Use space as thousands separator for integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    // Use space to group every 3 digits for fractional part
    if (parts[1]) {
      parts[1] = parts[1].replace(/(\d{3})(?=\d)/g, '$1 ');
    }
    return parts.join('.');
  };

  const renderAmount = () => {
    if (!txData?.amount) return '0';
    try {
      const hex = txData.amount.startsWith('0x') ? txData.amount : '0x' + txData.amount;
      const decimalStr = BigInt(hex).toString();
      const display = TracApiService.balanceToDisplay(decimalStr);
      return formatNumber(display);
    } catch (e) {
      console.error('Error parsing amount:', e);
      return '0';
    }
  };

  const displayAmount = renderAmount();

  return (
    <LayoutApprove
      header={<WebsiteBar session={session} />}
      body={
        <UX.Box spacing="sm" style={{ flex: 1, padding: '0 20px' }}>
          <UX.Box spacing="xs">
            <UX.Text
              title="Sign Transaction"
              styleType="heading_18"
              customStyles={{ color: 'white', textAlign: 'center' }}
            />
            <UX.Text
              title="Review the transaction details below"
              styleType="body_14_normal"
              customStyles={{ color: '#888', textAlign: 'center' }}
            />
          </UX.Box>

          <UX.Box spacing="sm" style={{ marginTop: '12px' }}>
            {/* From Section */}
            <UX.Box 
              layout="box_border" 
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}
            >
              <UX.Text title="From" styleType="body_12_bold" customStyles={{ color: '#888' }} />
              <UX.Text
                title={txData?.from || 'Unknown'}
                styleType="body_12_normal"
                customStyles={{ color: 'white', wordBreak: 'break-all' }}
              />
            </UX.Box>

            {/* To Section */}
            <UX.Box 
              layout="box_border" 
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}
            >
              <UX.Text title="To" styleType="body_12_bold" customStyles={{ color: '#888' }} />
              <UX.Text
                title={txData?.to || 'Unknown'}
                styleType="body_12_normal"
                customStyles={{ color: 'white', wordBreak: 'break-all' }}
              />
            </UX.Box>

            {/* Amount Section */}
            <UX.Box layout="box_border">
              <UX.Box layout="row_between" style={{ width: '100%' }}>
                <UX.Text title="Amount" styleType="body_12_bold" customStyles={{ color: '#888' }} />
                <UX.Text
                  title={`${displayAmount} TNK`}
                  styleType="body_14_bold"
                  customStyles={{ color: '#4CAF50' }}
                />
              </UX.Box>
            </UX.Box>
          </UX.Box>

          {/* Warning Section */}
          <UX.Box
            layout="box_border"
            style={{
              backgroundColor: 'rgba(255, 107, 107, 0.05)',
              borderColor: 'rgba(255, 107, 107, 0.3)',
              marginTop: '12px',
              marginBottom: '20px' // Add margin to avoid being too close to buttons
            }}
          >
            <UX.Box spacing="xs">
              <UX.Text
                title="⚠️ Security Warning"
                styleType="body_12_bold"
                customStyles={{ color: '#ff6b6b' }}
              />
              <UX.Text
                title="Verify all details carefully. Once signed, the transaction can be broadcast to the network."
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

