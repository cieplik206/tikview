import React, { useState } from 'react';
import { 
  Network, 
  Wifi, 
  Cable,
  Activity,
  TrendingUp,
  TrendingDown,
  Eye,
  Settings
} from 'lucide-react';
import { BaseCard } from '../ui/BaseCard';
import { StatusBadge } from '../ui/StatusBadge';
import { useInterfaces, useInterfaceStats } from '../../hooks/useMikrotikQuery';

interface Props {
  title?: string;
  delay?: number;
}

interface InterfaceRowProps {
  interface: any;
  stats?: any;
  onViewDetails: (interfaceName: string) => void;
}

const InterfaceRow: React.FC<InterfaceRowProps> = ({ interface: iface, stats, onViewDetails }) => {
  const getInterfaceIcon = () => {
    switch (iface.type) {
      case 'ether':
        return <Network className="w-4 h-4" />;
      case 'wlan':
        return <Wifi className="w-4 h-4" />;
      case 'bridge':
        return <Network className="w-4 h-4" />;
      case 'vlan':
        return <Cable className="w-4 h-4" />;
      case 'pppoe-out':
      case 'pppoe-in':
        return <Cable className="w-4 h-4" />;
      default:
        return <Network className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (): "success" | "warning" | "error" | "info" => {
    if (iface.disabled) return 'error';
    if (iface.running) return 'success';
    return 'warning';
  };

  const getStatusLabel = () => {
    if (iface.disabled) return 'Disabled';
    if (iface.running) return 'Connected';
    return 'Disconnected';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatSpeed = (speed?: string) => {
    if (!speed) return 'N/A';
    if (speed.includes('Gbps') || speed.includes('Mbps')) return speed;
    
    // Convert from bps if needed
    const bps = parseInt(speed);
    if (bps >= 1000000000) return `${(bps / 1000000000).toFixed(1)} Gbps`;
    if (bps >= 1000000) return `${(bps / 1000000).toFixed(0)} Mbps`;
    if (bps >= 1000) return `${(bps / 1000).toFixed(0)} Kbps`;
    return speed;
  };

  const interfaceStats = stats?.find((s: any) => s.name === iface.name);

  return (
    <tr className="hover:bg-base-200 transition-colors">
      <td>
        <div className="flex items-center gap-3">
          <div className="text-primary">
            {getInterfaceIcon()}
          </div>
          <div>
            <div className="font-semibold text-sm">{iface.name}</div>
            <div className="text-xs text-base-content/60">
              {iface.type} {iface.comment && `• ${iface.comment}`}
            </div>
          </div>
        </div>
      </td>
      
      <td>
        <StatusBadge variant={getStatusVariant()} size="sm">
          {getStatusLabel()}
        </StatusBadge>
      </td>
      
      <td className="text-sm font-mono">
        {iface.type === 'ether' && iface.link?.speed ? (
          formatSpeed(iface.link.speed)
        ) : (
          <span className="text-base-content/50">N/A</span>
        )}
      </td>
      
      <td className="text-sm">
        {interfaceStats ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-success">
              <TrendingUp className="w-3 h-3" />
              <span className="font-mono text-xs">
                {formatBytes(parseInt(interfaceStats['tx-byte'] || '0'))}
              </span>
            </div>
            <div className="flex items-center gap-1 text-info">
              <TrendingDown className="w-3 h-3" />
              <span className="font-mono text-xs">
                {formatBytes(parseInt(interfaceStats['rx-byte'] || '0'))}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-base-content/50">No data</span>
        )}
      </td>
      
      <td>
        <div className="flex items-center gap-2">
          <button 
            className="btn btn-xs btn-ghost"
            onClick={() => onViewDetails(iface.name)}
            title="View details"
          >
            <Eye className="w-3 h-3" />
          </button>
          <button 
            className="btn btn-xs btn-primary"
            title="Configure interface"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export const NetworkInterfaces: React.FC<Props> = ({ 
  title = "Network Interfaces", 
  delay = 200 
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const { data: interfaces = [], isLoading } = useInterfaces();
  const { data: interfaceStats = [] } = useInterfaceStats();

  const interfaceTypes = [
    { value: 'all', label: 'All Interfaces' },
    { value: 'ether', label: 'Ethernet' },
    { value: 'wlan', label: 'Wireless' },
    { value: 'bridge', label: 'Bridge' },
    { value: 'vlan', label: 'VLAN' },
    { value: 'pppoe', label: 'PPPoE' },
  ];

  const filteredInterfaces = interfaces.filter(iface => {
    if (selectedType === 'all') return true;
    if (selectedType === 'pppoe') return iface.type?.includes('pppoe');
    return iface.type === selectedType;
  });

  const connectedInterfaces = interfaces.filter(iface => iface.running);
  const activeInterfaces = interfaces.filter(iface => !iface.disabled);

  const handleViewDetails = (interfaceName: string) => {
    console.log(`View details for ${interfaceName}`);
    // Could open a modal or navigate to interface details
  };

  return (
    <BaseCard
      icon={Network}
      title={title}
      delay={delay}
      action={
        <div className="flex items-center gap-2">
          <StatusBadge variant="success" size="sm">
            {connectedInterfaces.length} Connected
          </StatusBadge>
          <StatusBadge variant="info" size="sm">
            {activeInterfaces.length} Active
          </StatusBadge>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-base-200 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{interfaces.length}</div>
            <div className="text-xs text-base-content/60">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{connectedInterfaces.length}</div>
            <div className="text-xs text-base-content/60">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              {activeInterfaces.length - connectedInterfaces.length}
            </div>
            <div className="text-xs text-base-content/60">Idle</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-error">
              {interfaces.length - activeInterfaces.length}
            </div>
            <div className="text-xs text-base-content/60">Disabled</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter:</label>
          <select 
            className="select select-sm select-bordered"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {interfaceTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Interfaces Table */}
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Interface</th>
                <th>Status</th>
                <th>Speed</th>
                <th>Traffic</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="loading loading-spinner loading-md"></div>
                    <p className="text-sm text-base-content/60 mt-2">Loading interfaces...</p>
                  </td>
                </tr>
              ) : filteredInterfaces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <Network className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
                    <p className="text-sm text-base-content/60">
                      No {selectedType === 'all' ? '' : selectedType} interfaces found
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInterfaces.map((iface) => (
                  <InterfaceRow
                    key={iface['.id']}
                    interface={iface}
                    stats={interfaceStats}
                    onViewDetails={handleViewDetails}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-3 border-t border-base-300">
          <button className="btn btn-sm btn-primary">
            <Network className="w-4 h-4 mr-1" />
            Add Interface
          </button>
          <button className="btn btn-sm btn-secondary">
            <Activity className="w-4 h-4 mr-1" />
            Monitor Traffic
          </button>
          <button className="btn btn-sm btn-ghost">
            Interface Settings
          </button>
        </div>
      </div>
    </BaseCard>
  );
};