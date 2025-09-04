import React, { useMemo } from 'react';
import { Popover } from '@headlessui/react';
import { BaseCard } from '../ui/BaseCard';
import { StatusBadge } from '../ui/StatusBadge';
import { useInterfaces, useSystemResources, useMikrotikQuery } from '../../hooks/useMikrotikQuery';
import { getRouterLayout, generateGenericLayout } from '../../utils/routerLayouts';
import { PortStatsPopover } from './ports/PortStatsPopover';
import type { RouterPort, RouterLayout } from '../../types/router';

interface Props {
  title?: string;
  delay?: number;
}

interface PortElementProps {
  port: RouterPort;
  layoutPort: any;
  isWan?: boolean;
}

const PortElement: React.FC<PortElementProps> = ({ port, layoutPort, isWan }) => {
  const getPortColor = (status: string, type: string) => {
    if (status === 'connected') {
      if (type === 'sfp') return '#a855f7'; // purple for 10G
      return '#10b981'; // green for 1G
    }
    if (status === 'disabled') return '#ef4444'; // red
    return '#6b7280'; // gray for disconnected
  };

  const getFillColor = (status: string, type: string) => {
    if (status === 'connected') {
      if (type === 'sfp') return '#581c87'; // dark purple
      return '#065f46'; // dark green
    }
    return '#111827'; // dark gray
  };

  if (layoutPort.type === 'power') {
    return (
      <div className="port-element flex flex-col items-center">
        <svg width="60" height="50" viewBox="0 0 60 50" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="10" width="50" height="30" rx="4" fill="#1f2937" stroke="#ef4444" strokeWidth="2"/>
          <circle cx="20" cy="25" r="4" fill="#111827"/>
          <circle cx="40" cy="25" r="4" fill="#111827"/>
        </svg>
        <span className="text-xs text-gray-500 font-semibold mt-1">24-57V DC</span>
      </div>
    );
  }

  if (layoutPort.type === 'reset') {
    return (
      <div className="port-element flex flex-col items-center">
        <svg width="30" height="50" viewBox="0 0 30 50" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="15" width="14" height="20" rx="2" fill="#374151" stroke="#6b7280" strokeWidth="1"/>
          <circle cx="15" cy="25" r="3" fill="#ef4444"/>
        </svg>
        <span className="text-xs text-gray-500 font-semibold mt-1">RESET</span>
      </div>
    );
  }

  if (layoutPort.type === 'usb') {
    return (
      <div className="port-element flex flex-col items-center">
        <svg width="45" height="50" viewBox="0 0 45 50" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="12" width="29" height="16" rx="2" fill="#374151" stroke="#6b7280" strokeWidth="1"/>
          <rect x="12" y="15" width="21" height="10" rx="1" fill="#111827"/>
        </svg>
        <span className="text-xs text-gray-500 font-semibold mt-1">USB</span>
      </div>
    );
  }

  // Ethernet or SFP port
  const portColor = getPortColor(port.status, port.type);
  const fillColor = getFillColor(port.status, port.type);
  
  return (
    <Popover className="port-element flex flex-col items-center relative">
      {({ open }) => (
        <>
          {isWan && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold z-10">
              WAN
            </div>
          )}
          
          <Popover.Button className="focus:outline-none cursor-pointer hover:scale-105 transition-transform">
            <div className="flex flex-col items-center">
              <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                <rect 
                  x="5" y="10" width="30" height="25" rx="3" 
                  fill="#1f2937" 
                  stroke={portColor} 
                  strokeWidth="2"
                />
                <rect 
                  x="8" y="14" width="24" height="17" rx="2" 
                  fill={fillColor}
                />
                {/* Activity LED */}
                {port.status === 'connected' && port.running && (
                  <circle 
                    cx="20" cy="22" r="2" 
                    fill={portColor}
                    className="animate-pulse"
                  />
                )}
              </svg>
              
              <span className="text-xs font-semibold mt-1" style={{ color: portColor }}>
                {layoutPort.label}
              </span>
              
              {port.status === 'connected' && port.speed && (
                <span className="text-xs text-gray-400 mt-0.5">
                  {port.speed}
                </span>
              )}
            </div>
          </Popover.Button>

          {/* Popover panel shown on click */}
          {open && (
            <Popover.Panel 
              static
              className="absolute z-[9999] mt-2 transform -translate-x-1/2 left-1/2 bottom-full mb-2"
            >
              <PortStatsPopover port={port} />
            </Popover.Panel>
          )}
        </>
      )}
    </Popover>
  );
};

const RB5009PortLayout: React.FC<{ 
  layout: RouterLayout; 
  ports: RouterPort[]; 
  wanInterface?: string;
}> = ({ layout, ports, wanInterface }) => {
  const getPortByName = (portId: string) => {
    const etherName = portId.replace(/^ether/, 'ether');
    const sfpName = portId.includes('sfp') ? 'sfp-sfpplus1' : portId;
    return ports.find(p => p.name === etherName || p.name === sfpName);
  };

  return (
    <div className="router-panel">
      <div className="text-center mb-4">
        <span className="text-sm text-gray-500 font-medium">REAR PANEL - {layout.displayName}</span>
      </div>
      <div className="flex justify-center items-end gap-2 bg-gray-800 p-4 rounded-lg">
        {layout.ports
          .sort((a, b) => a.position - b.position)
          .map((layoutPort) => {
            const port = getPortByName(layoutPort.id);
            const isWan = port?.name === wanInterface;
            
            return (
              <PortElement
                key={layoutPort.id}
                port={port || {
                  name: layoutPort.id,
                  number: layoutPort.id.replace(/\D/g, ''),
                  status: 'disconnected',
                  running: false,
                  type: layoutPort.type as any,
                }}
                layoutPort={layoutPort}
                isWan={isWan}
              />
            );
          })}
      </div>
    </div>
  );
};

const GenericPortLayout: React.FC<{ 
  ports: RouterPort[]; 
  displayName: string;
  wanInterface?: string;
}> = ({ ports, displayName, wanInterface }) => {
  const ethernetPorts = ports.filter(p => p.type === 'ethernet').sort((a, b) => {
    const aNum = parseInt(a.number) || 0;
    const bNum = parseInt(b.number) || 0;
    return aNum - bNum;
  });
  
  const sfpPorts = ports.filter(p => p.type === 'sfp');

  return (
    <div className="router-panel">
      <div className="text-center mb-4">
        <span className="text-sm text-gray-500 font-medium">{displayName}</span>
      </div>
      <div className="flex justify-center items-end gap-2 bg-gray-800 p-4 rounded-lg">
        {sfpPorts.map((port) => (
          <PortElement
            key={port.name}
            port={port}
            layoutPort={{ type: 'sfp', label: 'SFP+' }}
            isWan={port.name === wanInterface}
          />
        ))}
        {ethernetPorts.map((port) => (
          <PortElement
            key={port.name}
            port={port}
            layoutPort={{ type: 'ethernet', label: port.number }}
            isWan={port.name === wanInterface}
          />
        ))}
      </div>
    </div>
  );
};

export const PortsView: React.FC<Props> = ({ 
  title = "Router Port Status", 
  delay = 100 
}) => {
  const { data: interfaces = [] } = useInterfaces();
  const { data: systemResource } = useSystemResources();
  const { data: routes = [] } = useMikrotikQuery('/ip/route');
  const { data: pppoeClients = [] } = useMikrotikQuery('/interface/pppoe-client');

  // Transform interfaces to RouterPort format - filter out non-physical interfaces
  const ports: RouterPort[] = useMemo(() => {
    return interfaces
      .filter(iface => {
        // Only include ethernet and sfp interfaces, exclude loopback and other virtual interfaces
        const interfaceType = iface.type || '';
        const interfaceName = iface.name || '';
        return interfaceType === 'ether' || 
               interfaceType === 'ethernet' || 
               interfaceName.includes('ether') ||
               interfaceName.includes('sfp');
      })
      .map(iface => ({
        name: iface.name,
        number: iface.name.replace(/\D/g, ''),
        status: (iface.running === true || iface.running === 'true') ? 'connected' : 
                (iface.disabled === true || iface.disabled === 'true') ? 'disabled' : 'disconnected',
        running: iface.running === true || iface.running === 'true',
        speed: iface.speed || iface.link?.speed,
        txRate: iface['tx-byte'] ? parseInt(iface['tx-byte']) : 0,
        rxRate: iface['rx-byte'] ? parseInt(iface['rx-byte']) : 0,
        macAddress: iface['mac-address'],
        type: iface.name.includes('sfp') ? 'sfp' : 'ethernet',
        comment: iface.comment,
      }));
  }, [interfaces]);

  const routerModel = systemResource?.['board-name'] || 'MikroTik Router';

  const routerLayout = useMemo<RouterLayout>(() => {
    let layout = getRouterLayout(routerModel);
    
    // If generic layout, generate it based on detected ports
    if (layout.model === 'generic') {
      const ethernetPorts = ports.filter(p => p.type === 'ethernet');
      const ethernetCount = ethernetPorts.length > 0 
        ? Math.max(ethernetPorts.length, ...ethernetPorts.map(p => parseInt(p.number) || 0))
        : 0;
      const hasSfp = ports.some(p => p.type === 'sfp');
      layout = generateGenericLayout(ethernetCount, hasSfp);
    }
    
    return layout;
  }, [routerModel, ports]);

  const isRB5009Model = routerModel.includes('RB5009');

  // Auto-detect WAN interface from routing table and PPPoE settings
  const wanInterface = useMemo(() => {
    // First check the default route to find WAN interface
    const defaultRoute = routes.find((route: any) => 
      route['dst-address'] === '0.0.0.0/0' && 
      (route.active === true || route.active === 'true')
    );
    
    if (defaultRoute && defaultRoute.gateway) {
      const gateway = defaultRoute.gateway;
      
      // Check if gateway is a PPPoE interface
      if (gateway.startsWith('pppoe-')) {
        // Find which physical interface the PPPoE client uses
        const pppoeClient = pppoeClients.find((client: any) => 
          client.name === gateway
        );
        
        if (pppoeClient && pppoeClient.interface) {
          // Return the physical interface that PPPoE runs on
          return pppoeClient.interface;
        }
      }
      
      // Check if gateway is already an interface name (not an IP)
      const isInterfaceName = !/^\d+\.\d+\.\d+\.\d+$/.test(gateway);
      if (isInterfaceName) {
        // For other interface types (like bridge), find the physical port
        const physicalInterface = interfaces.find(iface => 
          iface.name === gateway && iface.type === 'ether'
        );
        return physicalInterface?.name || gateway;
      }
      
      // If gateway is an IP, find which interface has this gateway
      // This usually happens with DHCP client on ether1
      const wanInterface = interfaces.find(iface => 
        (iface.type === 'ether' || iface.type === 'ethernet') && 
        (iface['dhcp-client'] === true || iface['dhcp-client'] === 'true' ||
         iface.name === 'ether1') // Default to ether1 as common WAN port
      );
      
      if (wanInterface) {
        return wanInterface.name;
      }
    }
    
    // Fallback: check for common WAN patterns
    const commonWanInterface = interfaces.find(iface => 
      (iface.type === 'ether' || iface.type === 'ethernet') &&
      (iface.name.toLowerCase().includes('wan') || iface.name === 'ether1')
    );
    
    return commonWanInterface?.name;
  }, [interfaces, routes, pppoeClients]);

  const connectedPorts = ports.filter(p => p.status === 'connected');

  const PortLayoutComponent = isRB5009Model ? RB5009PortLayout : GenericPortLayout;

  return (
    <BaseCard
      icon={() => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      )}
      title={title}
      delay={delay}
      action={
        <StatusBadge variant="success" size="sm">
          {routerModel}
        </StatusBadge>
      }
    >
      <div className="space-y-6">
        {/* Centered port layout container */}
        <div className="flex justify-center items-center min-h-[200px]">
          {isRB5009Model ? (
            <RB5009PortLayout
              layout={routerLayout}
              ports={ports}
              wanInterface={wanInterface}
            />
          ) : (
            <GenericPortLayout
              ports={ports}
              displayName={routerModel}
              wanInterface={wanInterface}
            />
          )}
        </div>

        {/* Legend */}
        <div className="divider mt-6"></div>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-green-500"></div>
            <span className="text-xs opacity-70">Connected (1G)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-purple-500"></div>
            <span className="text-xs opacity-70">Connected (10G)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-gray-400"></div>
            <span className="text-xs opacity-70">Disconnected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-red-500"></div>
            <span className="text-xs opacity-70">Error/Disabled</span>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};