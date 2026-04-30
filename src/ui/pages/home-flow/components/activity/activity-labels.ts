import type {TranslationParams} from '@/src/ui/i18n/types';

export const getActivityTypeTitleKey = (type: string) => {
  if (type === 'sent') return 'activity.sent';
  if (type === 'contract') return 'activity.contractInteraction';
  return 'activity.received';
};

export const getActivityStatusText = (
  status?: string,
): {titleKey: string; titleParams?: TranslationParams} => {
  const normalizedStatus = String(status || '').toLowerCase();

  switch (normalizedStatus) {
    case 'confirmed':
    case 'completed':
    case 'complete':
    case 'success':
      return {titleKey: 'activity.confirmed'};
    case 'failed':
    case 'error':
      return {titleKey: 'activity.failed'};
    case 'pending':
      return {titleKey: 'activity.pending'};
    case 'processing':
      return {titleKey: 'activity.processing'};
    case 'unconfirmed':
      return {titleKey: 'activity.unconfirmed'};
    case 'cancelled':
    case 'canceled':
      return {titleKey: 'activity.cancelled'};
    case 'rejected':
      return {titleKey: 'activity.rejected'};
    case 'expired':
      return {titleKey: 'activity.expired'};
    case 'broadcasting':
      return {titleKey: 'activity.broadcasting'};
    default:
      return {
        titleKey: 'activity.unknownStatus',
        titleParams: {status: status || '-'},
      };
  }
};
