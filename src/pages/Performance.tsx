import React from 'react';
import { TrafficChart } from '../components/features/TrafficChart';
import { SystemHealth } from '../components/features/SystemHealth';
import { NetworkInterfaces } from '../components/features/NetworkInterfaces';

export const Performance: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-8">
      {/* Traffic Monitoring */}
      <TrafficChart />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Health */}
        <div className="lg:col-span-2">
          <SystemHealth />
        </div>
      </div>
      
      {/* Network Interfaces Performance */}
      <NetworkInterfaces title="Interface Performance" />
    </div>
  );
};