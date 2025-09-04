import React from 'react';
import { NetworkInterfaces } from '../components/features/NetworkInterfaces';
import { TrafficChart } from '../components/features/TrafficChart';
import { WifiStatus } from '../components/features/WifiStatus';

export const Network: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-8">
      {/* Network Interfaces */}
      <NetworkInterfaces />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Traffic Monitoring */}
        <div className="lg:col-span-2">
          <TrafficChart />
        </div>
        
        {/* WiFi Status */}
        <div className="lg:col-span-2">
          <WifiStatus />
        </div>
      </div>
    </div>
  );
};