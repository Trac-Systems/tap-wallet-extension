/**
 * Activity List Component
 * Shows Bitcoin and Trac transaction history tabs
 * Uses same logic as Network Filters modal:
 * - Trac Single Wallet: Only show Trac history
 * - No Trac Address: Only show Bitcoin history
 * - Normal: Show both tabs
 */

import { UX } from '@/src/ui/component';
import BitcoinHistory from './bitcoin-history';
import TracHistory from './trac-history';
import { useActiveTracAddress, useIsTracSingleWallet } from '@/src/ui/pages/home-flow/hook';

const ActivityList = () => {
  const tracAddress = useActiveTracAddress();
  const hasTrac = !!tracAddress;
  const isTracSingle = useIsTracSingleWallet();

  // Build tabs array based on wallet type
  const tabItems = [];

  // Add Bitcoin history tab if NOT Trac single wallet
  if (!isTracSingle) {
    tabItems.push({
      label: 'Bitcoin history',
      content: <BitcoinHistory />,
    });
  }

  // Add Trac history tab if has Trac address
  if (hasTrac) {
    tabItems.push({
      label: 'Trac history',
      content: <TracHistory />,
    });
  }

  // If only one tab, render content directly without tabs UI
  if (tabItems.length === 1) {
    return (
      <UX.Box spacing="xs">
        {tabItems[0].content}
      </UX.Box>
    );
  }

  // If multiple tabs, render tabs UI
  return (
    <UX.Box spacing="xs">
      <UX.Tabs tabs={tabItems} />
    </UX.Box>
  );
};

export default ActivityList;
