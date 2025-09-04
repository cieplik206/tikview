import React from 'react';
import { Wifi, WifiOff, Eye, EyeOff, Users, Signal } from 'lucide-react';
import { BaseCard } from '../ui/BaseCard';
import { StatusBadge } from '../ui/StatusBadge';
import { useWirelessInterfaces, useWifiRegistrations } from '../../hooks/useMikrotikQuery';

interface Props {
  title?: string;
  delay?: number;
}

interface WirelessInterfaceCardProps {
  interface: any;
  registrations: any[];
  onToggleVisibility: (ssid: string) => void;
}

const WirelessInterfaceCard: React.FC<WirelessInterfaceCardProps> = ({ 
  interface: wifiInterface, 
  registrations,
  onToggleVisibility 
}) => {
  const connectedDevices = registrations.filter(reg => 
    reg.interface === wifiInterface.name
  );

  const getSignalStrength = (signalStrength: number) => {
    if (signalStrength >= -50) return { level: 'excellent', color: 'text-success', bars: 4 };
    if (signalStrength >= -60) return { level: 'good', color: 'text-success', bars: 3 };
    if (signalStrength >= -70) return { level: 'fair', color: 'text-warning', bars: 2 };
    return { level: 'poor', color: 'text-error', bars: 1 };
  };

  const getFrequencyBand = (frequency: string) => {
    if (!frequency) return '';
    const freq = parseInt(frequency);
    if (freq >= 2400 && freq <= 2500) return '2.4GHz';
    if (freq >= 5000 && freq <= 6000) return '5GHz';
    if (freq >= 6000) return '6GHz';
    return `${frequency}MHz`;
  };

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {wifiInterface.running ? (
              <Wifi className="w-5 h-5 text-primary" />
            ) : (
              <WifiOff className="w-5 h-5 text-error" />
            )}
            <div>
              <h4 className="font-semibold text-sm">{wifiInterface.ssid || wifiInterface.name}</h4>
              <p className="text-xs text-base-content/60">
                {getFrequencyBand(wifiInterface.frequency)} • {wifiInterface.mode || 'AP'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StatusBadge 
              variant={wifiInterface.running ? 'success' : 'error'}
              size="sm"
            >
              {wifiInterface.running ? 'Active' : 'Disabled'}
            </StatusBadge>
          </div>
        </div>

        {/* Interface Details */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          <div>
            <span className="text-base-content/60">Channel:</span>
            <span className="ml-2 font-mono">
              {wifiInterface.channel || 'Auto'}
            </span>
          </div>
          <div>
            <span className="text-base-content/60">Security:</span>
            <span className="ml-2">
              {wifiInterface.security || 'Open'}
            </span>
          </div>
          <div>
            <span className="text-base-content/60">Band:</span>
            <span className="ml-2">
              {wifiInterface.band || getFrequencyBand(wifiInterface.frequency)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{connectedDevices.length} clients</span>
          </div>
        </div>

        {/* Connected Devices */}
        {connectedDevices.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-base-content/70">Connected Devices:</h5>
            {connectedDevices.slice(0, 3).map((device, index) => {
              const signal = getSignalStrength(parseInt(device['signal-strength'] || '-70'));
              return (
                <div key={device['.id'] || index} className="flex justify-between items-center text-xs bg-base-100 p-2 rounded">
                  <div>
                    <span className="font-medium">
                      {device['mac-address']}
                    </span>
                    {device.comment && (
                      <span className="text-base-content/60 ml-2">({device.comment})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 ${signal.color}`}>
                      <Signal className="w-3 h-3" />
                      <span>{device['signal-strength']}dBm</span>
                    </div>
                    <span className="text-base-content/60">
                      {device['tx-rate'] || '0'}/{device['rx-rate'] || '0'}
                    </span>
                  </div>
                </div>
              );
            })}
            {connectedDevices.length > 3 && (
              <p className="text-xs text-base-content/60 text-center">
                +{connectedDevices.length - 3} more devices
              </p>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 mt-3">
          <button 
            className="btn btn-xs btn-ghost"
            onClick={() => onToggleVisibility(wifiInterface.name)}
            title="Toggle SSID visibility"
          >
            {wifiInterface['hide-ssid'] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
          <button 
            className="btn btn-xs btn-primary"
            title="Configure interface"
          >
            Configure
          </button>
        </div>
      </div>
    </div>
  );
};

export const WifiStatus: React.FC<Props> = ({ 
  title = "Wireless Status", 
  delay = 250 
}) => {
  const { data: wirelessInterfaces = [], isLoading: loadingInterfaces } = useWirelessInterfaces();
  const { data: registrations = [], isLoading: loadingRegistrations } = useWifiRegistrations();

  const activeInterfaces = wirelessInterfaces.filter(iface => !iface.disabled);
  const totalClients = registrations.length;

  const handleToggleVisibility = (interfaceName: string) => {
    // This would call an API to toggle SSID visibility
    console.log(`Toggle visibility for ${interfaceName}`);
  };

  if (loadingInterfaces && activeInterfaces.length === 0) {
    return (
      <BaseCard
        icon={Wifi}
        title={title}
        delay={delay}
      >
        <div className="text-center py-8">
          <div className="loading loading-spinner loading-md"></div>
          <p className="text-sm text-base-content/60 mt-2">Loading wireless status...</p>
        </div>
      </BaseCard>
    );
  }

  if (activeInterfaces.length === 0) {
    return (
      <BaseCard
        icon={WifiOff}
        title={title}
        delay={delay}
        action={
          <StatusBadge variant="error" size="sm">
            No WiFi
          </StatusBadge>
        }
      >
        <div className="text-center py-8">
          <WifiOff className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
          <p className="text-sm text-base-content/60">No wireless interfaces found</p>
          <p className="text-xs text-base-content/40 mt-1">
            This router may not have WiFi capability or wireless interfaces are disabled
          </p>
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard
      icon={Wifi}
      title={title}
      delay={delay}
      action={
        <div className="flex items-center gap-2">
          <StatusBadge variant="info" size="sm">
            {totalClients} Clients
          </StatusBadge>
          <StatusBadge variant="success" size="sm">
            {activeInterfaces.filter(iface => iface.running).length} Active
          </StatusBadge>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-base-200 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{activeInterfaces.length}</div>
            <div className="text-xs text-base-content/60">Interfaces</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {activeInterfaces.filter(iface => iface.running).length}
            </div>
            <div className="text-xs text-base-content/60">Running</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">{totalClients}</div>
            <div className="text-xs text-base-content/60">Clients</div>
          </div>
        </div>

        {/* Wireless Interfaces */}
        <div className="space-y-3">
          {activeInterfaces.map((wifiInterface) => (
            <WirelessInterfaceCard
              key={wifiInterface['.id']}
              interface={wifiInterface}
              registrations={registrations}
              onToggleVisibility={handleToggleVisibility}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-3 border-t border-base-300">
          <button className="btn btn-sm btn-primary">
            <Wifi className="w-4 h-4 mr-1" />
            Add Network
          </button>
          <button className="btn btn-sm btn-secondary">
            Scan Channels
          </button>
          <button className="btn btn-sm btn-ghost">
            Wireless Settings
          </button>
        </div>
      </div>
    </BaseCard>
  );
};