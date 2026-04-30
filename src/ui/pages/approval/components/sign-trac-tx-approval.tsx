import { UX } from '@/src/ui/component/index';
import { TracApiService } from '@/src/background/service/trac-api.service';
import { useApproval, useFee } from '../hook';
import LayoutApprove from '../layouts';
import WebsiteBar from '@/src/ui/component/website-bar';
import { Network } from '@/src/wallet-instance'

interface Props {
  params: {
    session: {
      origin: string;
      icon: string;
      name: string;
    };
    data: {
      from: string;
      to: string;
      amount: string;
      amountDisplay?: string;
      validity?: string;
      nonce?: string;
      hash?: string;
      networkId?: number;
    };
    _builtTxData?: any;
  };
}

export default function SignTracTxApproval({ params: { session, data, _builtTxData } }: Props) {
  const [, resolveApproval, rejectApproval] = useApproval();
  const fee = useFee();

  const handleApprove = () => {
    resolveApproval({ approved: true, _builtTxData, ...data });
  };

  const handleCancel = () => {
    rejectApproval('User rejected transaction signing');
  };

  const txData = data;

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
      // amount is already in hex format from backend
      const hex = txData.amount.startsWith('0x') ? txData.amount : '0x' + txData.amount;
      const decimalStr = BigInt(hex).toString();
      const display = TracApiService.balanceToDisplay(decimalStr);
      return formatNumber(display);
    } catch (e) {
      console.error('Error parsing amount:', e);
      // Fallback to amountDisplay if available
      if (txData.amountDisplay) {
        return formatNumber(txData.amountDisplay);
      }
      return '0';
    }
  };

  const displayAmount = renderAmount();
  const isLoading = !txData?.from || !txData?.to;

  return (
    <LayoutApprove
      header={<WebsiteBar session={session} />}
      body={
        <UX.Box spacing="sm" style={{ flex: 1, padding: '0 20px' }}>
          <UX.Box spacing="xs">
            <UX.Text
              titleKey="approval.signTransaction.title"
              styleType="heading_18"
              customStyles={{ color: 'white', textAlign: 'center' }}
            />
            <UX.Text
              titleKey={
                isLoading
                  ? 'approval.signTransaction.building'
                  : 'approval.signTransaction.reviewDetails'
              }
              styleType="body_14_normal"
              customStyles={{ color: '#888', textAlign: 'center' }}
            />
          </UX.Box>

          {isLoading ? (
            <UX.Box style={{ marginTop: '40px', textAlign: 'center' }}>
              <UX.Text
                titleKey="common.loading"
                styleType="body_14_normal"
                customStyles={{ color: '#888' }}
              />
            </UX.Box>
          ) : (
            <UX.Box spacing="sm" style={{ marginTop: '12px' }}>
            {/* From Section */}
            <UX.Box
              layout="box_border"
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}
            >
              <UX.Text titleKey="transaction.from" styleType="body_12_bold" customStyles={{ color: '#888' }} />
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
              <UX.Text titleKey="transaction.to" styleType="body_12_bold" customStyles={{ color: '#888' }} />
              <UX.Text
                title={txData?.to || 'Unknown'}
                styleType="body_12_normal"
                customStyles={{ color: 'white', wordBreak: 'break-all' }}
              />
            </UX.Box>

            {/* Amount Section */}
            <UX.Box layout="box_border">
              <UX.Box layout="row_between" style={{ width: '100%' }}>
                <UX.Text titleKey="transaction.amount" styleType="body_12_bold" customStyles={{ color: '#888' }} />
                <UX.Text
                  title={`${displayAmount} TNK`}
                  styleType="body_14_bold"
                  customStyles={{ color: '#4CAF50' }}
                />
              </UX.Box>
            </UX.Box>

            {/* Network Fee Section */}
            <UX.Box layout="box_border">
              <UX.Box layout="row_between" style={{ width: '100%' }}>
                <UX.Text titleKey="transaction.networkFee" styleType="body_12_bold" customStyles={{ color: '#888' }} />
                <UX.Text
                  title={`${fee} TNK`}
                  styleType="body_14_normal"
                  customStyles={{ color: 'white' }}
                />
              </UX.Box>
            </UX.Box>

            {/* Network Info */}
            {txData?.networkId && (
              <UX.Box layout="box_border">
                <UX.Box layout="row_between" style={{ width: '100%' }}>
                  <UX.Text titleKey="settings.network.title" styleType="body_12_bold" customStyles={{ color: '#888' }} />
                  <UX.Text
                    title={txData.networkId === 918 ? Network.MAINNET : Network.TESTNET}
                    styleType="body_12_normal"
                    customStyles={{ color: 'white' }}
                  />
                </UX.Box>
              </UX.Box>
            )}
          </UX.Box>
          )}

          {!isLoading && (
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
                  titleKey="approval.securityWarning"
                  styleType="body_12_bold"
                  customStyles={{ color: '#ff6b6b' }}
                />
                <UX.Text
                  titleKey="approval.signTransaction.securityWarning"
                  styleType="body_12_normal"
                  customStyles={{ color: 'rgba(255, 255, 255, 0.6)' }}
                />
              </UX.Box>
            </UX.Box>
          )}
        </UX.Box>
      }
      footer={
        <UX.Box layout="row" spacing="sm" style={{ padding: '0 20px 20px' }}>
          <UX.Button
            styleType="dark"
            titleKey="common.cancel"
            onClick={handleCancel}
            customStyles={{ flex: 1 }}
          />
          <UX.Button
            styleType="primary"
            titleKey={isLoading ? 'approval.signTransaction.buildingShort' : 'common.sign'}
            onClick={handleApprove}
            customStyles={{ flex: 1, opacity: isLoading ? 0.5 : 1 }}
            isDisable={isLoading}
          />
        </UX.Box>
      }
    />
  );
}
