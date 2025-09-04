import React from 'react';
import { ConnectedDevices } from '../components/features/ConnectedDevices';
import { WifiStatus } from '../components/features/WifiStatus';

export const Devices: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-8">
      {/* WiFi Status */}
      <WifiStatus />
      
      {/* Connected Devices - Full List */}
      <ConnectedDevices title="All Connected Devices" />
    </div>
  );
};