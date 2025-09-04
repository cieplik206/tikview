import React from 'react';
import SystemStatus from '../components/features/SystemStatus';
import { PortsView } from '../components/features/PortsView';
import { ConnectedDevices } from '../components/features/ConnectedDevices';
import { QuickCheck } from '../components/features/QuickCheck';
import { TrafficChart } from '../components/features/TrafficChart';

export const Overview: React.FC = () => {
  return (
    <div className="animate-fade-in">
      {/* Ports View at the top */}
      <div className="mb-[30px]">
        <PortsView />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-[25px] mb-[30px]">
        {/* System Status */}
        <SystemStatus />
        
        {/* Quick Check */}
        <QuickCheck />
        
        {/* Connected Devices */}
        <div className="lg:col-span-1 xl:col-span-1">
          <ConnectedDevices limit={5} />
        </div>
      </div>
      
      {/* Network Traffic Monitoring */}
      <div className="mb-[30px]">
        <TrafficChart />
      </div>
      
      {/* Copyright Footer */}
      <div className="mt-8 pt-4 border-t border-base-300 text-center">
        <p className="text-xs text-base-content/60">
          © {new Date().getFullYear()} TikView. All rights reserved. | 
          <a href="https://tikview.net" target="_blank" rel="noopener noreferrer" className="link link-hover ml-1">
            tikview.net
          </a>
        </p>
      </div>
    </div>
  );
};