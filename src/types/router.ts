export interface RouterPort {
  name: string;
  number: string;
  label?: string;
  status: 'connected' | 'disconnected' | 'disabled';
  running: boolean;
  speed?: string;
  txRate?: number;
  rxRate?: number;
  macAddress?: string;
  comment?: string;
  type: 'ethernet' | 'sfp' | 'usb' | 'power';
  capabilities?: string[];  // e.g., ['2.5G', '10G']
}

export interface RouterLayoutPort {
  id: string;           // e.g., 'ether1', 'sfp-sfpplus1'
  label: string;        // Display label
  type: 'ethernet' | 'sfp' | 'usb' | 'power' | 'reset';
  position: number;     // Order in layout
  width?: number;       // Custom width for rendering
  capabilities?: string[];  // e.g., ['2.5G', 'PoE-In', 'PoE-Out']
  group?: string;       // For visual grouping
}

export interface RouterLayout {
  model: string;
  displayName: string;
  ports: RouterLayoutPort[];
  features: {
    hasPower?: boolean;
    hasReset?: boolean;
    hasUsb?: boolean;
    hasSfp?: boolean;
    maxEthernetPorts: number;
  };
}

export interface RouterModelConfig {
  [key: string]: RouterLayout;
}