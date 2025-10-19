import React from 'react';
import { NotificationAnalytics } from '@/components/notifications/NotificationAnalytics';
import TestProductionNovu from '@/components/notifications/TestProductionNovu';

const NotificationMonitoring = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Notification System Monitoring</h1>
        <p className="text-muted-foreground">
          Monitor notification delivery, engagement, and system health
        </p>
      </div>
      
      <TestProductionNovu />
      
      <NotificationAnalytics />
    </div>
  );
};

export default NotificationMonitoring;
