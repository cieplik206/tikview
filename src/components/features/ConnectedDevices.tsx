import React from 'react';
import { 
  Smartphone, 
  Laptop, 
  Tv, 
  Gamepad2, 
  Wifi, 
  HardDrive, 
  Router, 
  Printer,
  LucideIcon
} from 'lucide-react';
import { BaseCard } from '../ui/BaseCard';
import { StatusBadge } from '../ui/StatusBadge';
import { useDhcpLeases } from '../../hooks/useMikrotikQuery';

interface Props {
  title?: string;
  limit?: number;
  delay?: number;
}

interface DeviceIconProps {
  device: any;
}

const DeviceIcon: React.FC<DeviceIconProps> = ({ device }) => {
  const getDeviceIcon = (): LucideIcon => {
    const name = (device['host-name'] || device['active-host-name'] || device.comment || '').toLowerCase();
    
    // Check for specific device types based on name patterns
    if (name.includes('macbook') || name.includes('laptop') || name.includes('notebook')) return Laptop;
    if (name.includes('iphone') || name.includes('android') || name.includes('phone') || name.includes('pixel')) return Smartphone;
    if (name.includes('ipad') || name.includes('tablet')) return Smartphone;
    if (name.includes('tv') || name.includes('samsung') || name.includes('lg-')) return Tv;
    if (name.includes('playstation') || name.includes('xbox') || name.includes('nintendo')) return Gamepad2;
    if (name.includes('nas') || name.includes('server') || name.includes('synology')) return HardDrive;
    if (name.includes('printer') || name.includes('canon') || name.includes('hp-')) return Printer;
    if (name.includes('router') || name.includes('ap-') || name.includes('mikrotik')) return Router;
    
    // Check MAC vendor prefix (first 6 characters)
    const mac = device['mac-address'] || '';
    const vendorPrefix = mac.substring(0, 8).toUpperCase();
    
    // Common vendor prefixes
    if (vendorPrefix.startsWith('00:0C:29') || vendorPrefix.startsWith('00:50:56')) return HardDrive; // VMware
    if (vendorPrefix.startsWith('F4:39:09')) return HardDrive; // HP Server
    
    return Wifi; // Default icon
  };

  const Icon = getDeviceIcon();
  return <Icon className="w-5 h-5 text-primary" />;
};

export const ConnectedDevices: React.FC<Props> = ({ 
  title = "Connected Devices", 
  limit,
  delay = 200 
}) => {
  const { data: dhcpLeases = [], isLoading } = useDhcpLeases();

  // Filter active devices
  const activeDevices = dhcpLeases.filter(device => 
    device.status === 'bound' || (device['active-address'] && device.status !== 'disabled')
  );

  const displayedDevices = limit ? activeDevices.slice(0, limit) : activeDevices;

  // Get device name from hostname or MAC address
  const getDeviceName = (device: any) => {
    if (device['host-name']) return device['host-name'];
    if (device['active-host-name']) return device['active-host-name'];
    if (device.comment) return device.comment;
    return device['mac-address'];
  };

  // Get status variant for badge
  const getStatusVariant = (device: any): "success" | "warning" | "error" | "info" => {
    if (device.status === 'bound') return 'success';
    if (device.status === 'waiting') return 'warning';
    if (device.disabled === 'true' || device.disabled === true) return 'error';
    return 'info';
  };

  // Get status label
  const getStatusLabel = (device: any) => {
    if (device.disabled === 'true' || device.disabled === true) return 'Disabled';
    if (device.status === 'bound') return 'Online';
    if (device.status === 'waiting') return 'Offline';
    if (device.dynamic === 'true' || device.dynamic === true) return 'Dynamic';
    return 'Static';
  };

  // Format expiry time
  const formatExpiry = (expiry: string) => {
    if (!expiry) return '';
    
    // Parse MikroTik time format (e.g., "23h59m59s" or "1d23h59m")
    const match = expiry.match(/(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
    if (!match) return expiry;
    
    const [, days, hours, minutes] = match;
    const parts = [];
    
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    
    return parts.join(' ') || expiry;
  };

  return (
    <BaseCard
      icon={Smartphone}
      title={title}
      delay={delay}
      action={
        <StatusBadge variant="info" size="sm">
          {activeDevices.length} Active
        </StatusBadge>
      }
    >
      <div className="space-y-3 pr-2 -mr-2">
        {isLoading && activeDevices.length === 0 ? (
          <div className="text-center py-8">
            <div className="loading loading-spinner loading-md"></div>
            <p className="text-sm text-base-content/60 mt-2">Loading...</p>
          </div>
        ) : displayedDevices.length === 0 ? (
          <div className="text-center py-8">
            <Wifi className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
            <p className="text-sm text-base-content/60">No active devices found</p>
          </div>
        ) : (
          displayedDevices.map((device) => (
            <div
              key={device['.id']}
              className="card card-sm bg-base-100 hover:bg-base-200 transition-all duration-300 hover:translate-x-1"
            >
              <div className="card-body flex-row justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="avatar">
                    <div className="w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <DeviceIcon device={device} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{getDeviceName(device)}</h4>
                    <p className="text-xs opacity-60">
                      {device.address || device['active-address']} • {device['mac-address']}
                    </p>
                    {device.comment && (
                      <p className="text-xs opacity-50 italic">{device.comment}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge 
                    variant={getStatusVariant(device)} 
                    size="sm"
                    pulse={device.status === 'bound'}
                  >
                    {getStatusLabel(device)}
                  </StatusBadge>
                  {device['expires-after'] && (
                    <span className="text-xs opacity-60">
                      Expires: {formatExpiry(device['expires-after'])}
                    </span>
                  )}
                  {device['last-seen'] && !device['expires-after'] && (
                    <span className="text-xs opacity-60">
                      Last seen: {device['last-seen']}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </BaseCard>
  );
};