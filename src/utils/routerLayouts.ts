import type { RouterModelConfig, RouterLayout } from '../types/router';

export const routerLayouts: RouterModelConfig = {
  'RB5009UPr+S+': {
    model: 'RB5009UPr+S+',
    displayName: 'RB5009UPr+S+IN',
    ports: [
      // Power input (leftmost)
      {
        id: 'power',
        label: '24-57V DC',
        type: 'power',
        position: 0,
        width: 60
      },
      // Reset button
      {
        id: 'reset',
        label: 'RESET',
        type: 'reset',
        position: 1,
        width: 30
      },
      // SFP+ port
      {
        id: 'sfp-sfpplus1',
        label: 'SFP+',
        type: 'sfp',
        position: 2,
        width: 55,
        capabilities: ['10G']
      },
      // USB 3.0 port
      {
        id: 'usb',
        label: 'USB',
        type: 'usb',
        position: 3,
        width: 45
      },
      // Ethernet ports with specific capabilities
      {
        id: 'ether1',
        label: '2.5G',
        type: 'ethernet',
        position: 4,
        capabilities: ['2.5G'],
        group: 'ethernet'
      },
      {
        id: 'ether2',
        label: '1G',
        type: 'ethernet',
        position: 5,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether3',
        label: '1G',
        type: 'ethernet',
        position: 6,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether4',
        label: '1G',
        type: 'ethernet',
        position: 7,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether5',
        label: '1G',
        type: 'ethernet',
        position: 8,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether6',
        label: '1G',
        type: 'ethernet',
        position: 9,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether7',
        label: '1G',
        type: 'ethernet',
        position: 10,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether8',
        label: '1G + PoE-out',
        type: 'ethernet',
        position: 11,
        capabilities: ['1G', 'PoE-out'],
        group: 'ethernet'
      }
    ],
    features: {
      hasPower: true,
      hasReset: true,
      hasUsb: true,
      hasSfp: true,
      maxEthernetPorts: 8
    }
  },
  'RB5009UG+S+': {
    model: 'RB5009UG+S+',
    displayName: 'RB5009UG+S+IN',
    ports: [
      {
        id: 'power',
        label: '24-57V DC',
        type: 'power',
        position: 0,
        width: 60
      },
      {
        id: 'reset',
        label: 'RESET',
        type: 'reset',
        position: 1,
        width: 30
      },
      {
        id: 'sfp-sfpplus1',
        label: 'SFP+',
        type: 'sfp',
        position: 2,
        width: 55,
        capabilities: ['10G']
      },
      {
        id: 'usb',
        label: 'USB',
        type: 'usb',
        position: 3,
        width: 45
      },
      {
        id: 'ether1',
        label: '1G',
        type: 'ethernet',
        position: 4,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether2',
        label: '1G',
        type: 'ethernet',
        position: 5,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether3',
        label: '1G',
        type: 'ethernet',
        position: 6,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether4',
        label: '1G',
        type: 'ethernet',
        position: 7,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether5',
        label: '1G',
        type: 'ethernet',
        position: 8,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether6',
        label: '1G',
        type: 'ethernet',
        position: 9,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether7',
        label: '1G',
        type: 'ethernet',
        position: 10,
        capabilities: ['1G'],
        group: 'ethernet'
      },
      {
        id: 'ether8',
        label: '1G + PoE-out',
        type: 'ethernet',
        position: 11,
        capabilities: ['1G', 'PoE-out'],
        group: 'ethernet'
      }
    ],
    features: {
      hasPower: true,
      hasReset: true,
      hasUsb: true,
      hasSfp: true,
      maxEthernetPorts: 8
    }
  }
};

export function getRouterLayout(boardName?: string): RouterLayout {
  if (!boardName) {
    return generateGenericLayout(5, false);
  }

  // Normalize board name for lookup
  const normalizedName = boardName.replace(/[^a-zA-Z0-9+]/g, '');
  
  // Direct match
  if (routerLayouts[boardName]) {
    return routerLayouts[boardName];
  }

  // Try normalized match
  const normalizedLayout = Object.entries(routerLayouts).find(
    ([key]) => key.replace(/[^a-zA-Z0-9+]/g, '') === normalizedName
  );
  
  if (normalizedLayout) {
    return normalizedLayout[1];
  }

  // Check for RB5009 variations
  if (boardName.includes('RB5009')) {
    // Default to RB5009UG+S+ if specific model not found
    return routerLayouts['RB5009UG+S+'];
  }

  // Generate generic layout based on common patterns
  const ethernetCount = getEthernetPortCount(boardName);
  const hasSfp = boardName.toLowerCase().includes('sfp') || boardName.includes('+S+');
  
  return generateGenericLayout(ethernetCount, hasSfp);
}

function getEthernetPortCount(boardName: string): number {
  // Extract number from model name patterns
  const patterns = [
    /rb(\d+)/i,       // RB750, RB2011, etc.
    /(\d+)port/i,     // 5port, 8port, etc.
    /x(\d+)/i,        // x5, x8, etc.
  ];

  for (const pattern of patterns) {
    const match = boardName.match(pattern);
    if (match) {
      const num = parseInt(match[1]);
      if (num <= 2) return 2;
      if (num <= 5) return 5;
      if (num <= 8) return 8;
      if (num <= 24) return 24;
      if (num <= 48) return 48;
    }
  }

  // Default based on model families
  if (boardName.includes('RB750')) return 5;
  if (boardName.includes('RB2011')) return 10;
  if (boardName.includes('RB3011')) return 10;
  if (boardName.includes('RB4011')) return 10;
  if (boardName.includes('RB5009')) return 8;
  if (boardName.includes('CCR')) return 16;

  return 5; // Conservative default
}

export function generateGenericLayout(ethernetCount: number, hasSfp: boolean): RouterLayout {
  const ports = [];
  let position = 0;

  // Add SFP port if supported
  if (hasSfp) {
    ports.push({
      id: 'sfp1',
      label: 'SFP+',
      type: 'sfp' as const,
      position: position++,
      capabilities: ['1G', '10G']
    });
  }

  // Add ethernet ports
  for (let i = 1; i <= ethernetCount; i++) {
    ports.push({
      id: `ether${i}`,
      label: `${i}`,
      type: 'ethernet' as const,
      position: position++,
      capabilities: ['1G'],
      group: 'ethernet'
    });
  }

  return {
    model: 'generic',
    displayName: 'MikroTik Router',
    ports,
    features: {
      hasPower: true,
      hasReset: true,
      hasUsb: false,
      hasSfp,
      maxEthernetPorts: ethernetCount
    }
  };
}