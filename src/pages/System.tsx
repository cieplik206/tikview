import React from 'react';
import { SystemHealth } from '../components/features/SystemHealth';
import SystemStatus from '../components/features/SystemStatus';
import { QuickActions } from '../components/features/QuickActions';

export const System: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Status */}
        <SystemStatus />
        
        {/* Quick Actions */}
        <QuickActions />
      </div>
      
      {/* System Health - Full Width */}
      <SystemHealth />
    </div>
  );
};