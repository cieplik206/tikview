import React from 'react';
import type { RouterPort } from '../../../types/router';

interface PortStatsPopoverProps {
  port?: RouterPort;
}

export const PortStatsPopover: React.FC<PortStatsPopoverProps> = ({ port }) => {
  const formatBps = (bps?: number): string => {
    if (!bps) return '0 bps';
    if (bps >= 1000000000) return `${(bps / 1000000000).toFixed(1)} Gbps`;
    if (bps >= 1000000) return `${(bps / 1000000).toFixed(1)} Mbps`;
    if (bps >= 1000) return `${(bps / 1000).toFixed(1)} Kbps`;
    return `${bps} bps`;
  };

  const getStatusText = (): string => {
    if (!port) return 'Unknown';
    if (port.status === 'disabled') return 'Disabled';
    if (port.status === 'connected') {
      if (port.type === 'sfp') return '10G Active';
      return 'Active';
    }
    return 'Inactive';
  };

  const getStatusBadgeClass = (): string => {
    if (!port) return 'badge-ghost';
    switch (port.status) {
      case 'connected': return 'badge-success';
      case 'disabled': return 'badge-error';
      default: return 'badge-ghost';
    }
  };

  const getStatusTextClass = (): string => {
    if (!port) return '';
    switch (port.status) {
      case 'connected': return 'text-success font-medium';
      case 'disabled': return 'text-error font-medium';
      default: return 'text-base-content/50';
    }
  };

  return (
    <div className="card card-compact bg-base-100 shadow-xl border border-base-300 min-w-[280px] max-w-[320px]">
      <div className="card-body">
        {/* Header with port name and status badge */}
        <div className="flex justify-between items-center pb-2 border-b border-base-300">
          <h3 className="card-title text-sm">
            {port?.name}{port?.comment ? ` - ${port.comment}` : ''}
          </h3>
          <span className={`badge badge-sm ${getStatusBadgeClass()}`}>
            {getStatusText()}
          </span>
        </div>
        
        {/* Port stats */}
        {port ? (
          <div className="space-y-2 pt-2">
            {/* Status row */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-base-content/70">Status:</span>
              <span className={getStatusTextClass()}>
                {port.status === 'disabled' ? 'Disabled by Admin' : 
                 port.status === 'connected' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* Speed row */}
            {port.speed && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-base-content/70">Speed:</span>
                <span className="font-medium">{port.speed}</span>
              </div>
            )}
            
            {/* Traffic row */}
            {(port.txRate || port.rxRate) && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-base-content/70">Traffic:</span>
                <div className="flex gap-3">
                  <span className="text-success">↓ {formatBps(port.rxRate)}</span>
                  <span className="text-info">↑ {formatBps(port.txRate)}</span>
                </div>
              </div>
            )}
            
            {/* MAC Address row */}
            {port.macAddress && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-base-content/70">MAC Address:</span>
                <span className="font-mono text-[11px]">{port.macAddress}</span>
              </div>
            )}
            
            {/* Type row */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-base-content/70">Type:</span>
              <span className="badge badge-xs badge-primary">
                {port.type === 'sfp' ? 'SFP+' : `Ethernet ${port.number}`}
              </span>
            </div>
          </div>
        ) : (
          /* No data state */
          <div className="text-center py-4">
            <span className="text-base-content/50 text-sm">Port not configured</span>
          </div>
        )}
      </div>
    </div>
  );
};