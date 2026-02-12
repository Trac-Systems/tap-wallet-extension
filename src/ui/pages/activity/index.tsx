/**
 * Activity Page
 * Main page for viewing transaction history (Bitcoin and Trac)
 */

import React from 'react';
import { UX } from '../../component';
import Navbar from '../home-flow/components/navbar-navigate';
import LayoutScreenSettings from '../../layouts/settings';
import ActivityList from '../home-flow/components/activity/activity-list';

const ActivityPage = () => {
  return (
    <LayoutScreenSettings
      header={<UX.TextHeader text="Activity" disableIconBack />}
      body={
        <UX.Box
          layout="column_center"
          spacing="xl"
          style={{ margin: '0 24px 16px 24px' }}
        >
          <UX.Box style={{ width: '100%' }} spacing="xl">
            <ActivityList />
          </UX.Box>
        </UX.Box>
      }
      footer={<Navbar isActive="activity" />}
    />
  );
};

export default ActivityPage;
