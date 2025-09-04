import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MikrotikAPI } from '../../services/mikrotik-api';

interface Capabilities {
  hasRouterboard: boolean;
  hasWireless: boolean;
  hasHotspot: boolean;
  hasBridge: boolean;
  hasVPN: boolean;
  hasCertificates: boolean;
  hasRadius: boolean;
  hasQueues: boolean;
  hasGraphing: boolean;
  hasDHCP: boolean;
  hasDNS: boolean;
  hasFirewall: boolean;
  hasNAT: boolean;
  hasRouting: boolean;
  hasSystem: boolean;
  hasInterfaces: boolean;
}

interface CapabilitiesState {
  capabilities: Capabilities;
  routerType: string;
  version: string | null;
  architecture: string | null;
  discovered: boolean;
  discoveryError: string | null;
  wanInterface: string | null;
  defaultGateway: string | null;
  loading: boolean;
}

interface EndpointTest {
  endpoint: string;
  capability: keyof Capabilities;
}

const initialCapabilities: Capabilities = {
  hasRouterboard: false,
  hasWireless: false,
  hasHotspot: false,
  hasBridge: false,
  hasVPN: false,
  hasCertificates: false,
  hasRadius: false,
  hasQueues: false,
  hasGraphing: false,
  hasDHCP: false,
  hasDNS: false,
  hasFirewall: true, // Usually always present
  hasNAT: true, // Usually always present
  hasRouting: true, // Usually always present
  hasSystem: true, // Always present
  hasInterfaces: true, // Always present
};

const initialState: CapabilitiesState = {
  capabilities: initialCapabilities,
  routerType: 'unknown', // 'CHR', 'RouterBOARD', 'x86', etc.
  version: null,
  architecture: null,
  discovered: false,
  discoveryError: null,
  wanInterface: null, // Interface with default route
  defaultGateway: null,
  loading: false,
};

// Helper functions
const isInNetwork = (ip: string, network: string): boolean => {
  // Simple check - for proper implementation would need subnet calculation
  // This is a simplified version
  const networkBase = network.split('/')[0];
  return ip.startsWith(networkBase.split('.').slice(0, 3).join('.'));
};

// Async thunks
export const discoverCapabilitiesAsync = createAsyncThunk<
  {
    capabilities: Capabilities;
    routerType: string;
    version: string | null;
    architecture: string | null;
  },
  MikrotikAPI,
  { rejectValue: string }
>(
  'capabilities/discover',
  async (api, { rejectWithValue }) => {
    try {
      // First, get basic system info to determine router type
      let routerType = 'unknown';
      let version: string | null = null;
      let architecture: string | null = null;
      
      try {
        const response = await api.request('/system/resource');
        const resource = Array.isArray(response) ? response[0] : response;
        
        if (resource) {
          version = resource.version;
          architecture = resource['architecture-name'];
          
          // Determine router type
          if (resource['board-name']?.includes('CHR')) {
            routerType = 'CHR';
          } else if (resource['board-name']?.includes('RouterBOARD')) {
            routerType = 'RouterBOARD';
          } else if (resource['board-name']?.includes('x86')) {
            routerType = 'x86';
          } else {
            routerType = resource['board-name'] || 'unknown';
          }
        }
      } catch (error) {
        // Continue even if we can't get system resource info
        console.warn('Could not fetch system resource info:', error);
      }

      // Test various endpoints to see what's available
      const endpointTests: EndpointTest[] = [
        { endpoint: '/system/routerboard', capability: 'hasRouterboard' },
        { endpoint: '/interface/wireless', capability: 'hasWireless' },
        { endpoint: '/ip/hotspot', capability: 'hasHotspot' },
        { endpoint: '/interface/bridge', capability: 'hasBridge' },
        { endpoint: '/interface/vpn', capability: 'hasVPN' },
        { endpoint: '/certificate', capability: 'hasCertificates' },
        { endpoint: '/radius', capability: 'hasRadius' },
        { endpoint: '/queue', capability: 'hasQueues' },
        { endpoint: '/tool/graphing', capability: 'hasGraphing' },
        { endpoint: '/ip/dhcp-server', capability: 'hasDHCP' },
        { endpoint: '/ip/dns', capability: 'hasDNS' }
      ];

      // Start with default capabilities
      const capabilities: Capabilities = { ...initialCapabilities };

      // Test each endpoint in parallel
      const tests = endpointTests.map(async ({ endpoint, capability }) => {
        try {
          await api.request(endpoint);
          // If we get a response (even empty array), the feature exists
          capabilities[capability] = true;
          return { capability, available: true };
        } catch (error) {
          // If we get an error (404, 400, etc.), feature doesn't exist
          capabilities[capability] = false;
          return { capability, available: false };
        }
      });

      await Promise.allSettled(tests);
      
      // Special handling for CHR - it never has routerboard
      if (routerType === 'CHR') {
        capabilities.hasRouterboard = false;
      }

      return {
        capabilities,
        routerType,
        version,
        architecture,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const discoverWanInterfaceAsync = createAsyncThunk<
  {
    wanInterface: string | null;
    defaultGateway: string | null;
  },
  MikrotikAPI,
  { rejectValue: string }
>(
  'capabilities/discoverWanInterface',
  async (api, { rejectWithValue }) => {
    try {
      let wanInterface: string | null = null;
      let defaultGateway: string | null = null;

      // Get default route to find gateway and interface
      try {
        const response = await api.request('/ip/route');
        const routes = Array.isArray(response) ? response : [response];
        
        // Find default route (dst-address 0.0.0.0/0)
        const defaultRoute = routes.find((r: any) => 
          r['dst-address'] === '0.0.0.0/0' && 
          r.active === 'true'
        );
        
        if (defaultRoute) {
          defaultGateway = defaultRoute.gateway;
          
          // Get the interface name from gateway interface
          if (defaultRoute['gateway-status']) {
            // Parse gateway-status if it's a string
            const gatewayStatus = typeof defaultRoute['gateway-status'] === 'string' 
              ? defaultRoute['gateway-status'] 
              : defaultRoute['gateway-status'][0];
            
            // Extract interface name from gateway status
            const match = gatewayStatus?.match(/reachable via\s+(\S+)/);
            if (match) {
              wanInterface = match[1];
            }
          }
          
          // Fallback: try to get from immediate-gw
          if (!wanInterface && defaultRoute['immediate-gw']) {
            // Get IP addresses to find interface
            try {
              const addressResponse = await api.request('/ip/address');
              const addresses = Array.isArray(addressResponse) ? addressResponse : [addressResponse];
              
              // Find interface that has the gateway IP in its network
              for (const addr of addresses) {
                if (addr.interface && addr.network) {
                  // Check if gateway is in this network
                  if (isInNetwork(defaultRoute.gateway, addr.network)) {
                    wanInterface = addr.interface;
                    break;
                  }
                }
              }
            } catch (error) {
              // Continue without IP address info
              console.warn('Could not fetch IP addresses:', error);
            }
          }
        }
      } catch (error) {
        // Continue without route info
        console.warn('Could not fetch routes:', error);
      }
      
      // If still no WAN interface, try to guess from interface names
      if (!wanInterface) {
        try {
          const response = await api.request('/interface');
          const interfaces = Array.isArray(response) ? response : [response];
          
          // Common WAN interface patterns
          const wanPatterns = ['ether1', 'wan', 'pppoe', 'lte', 'sfp'];
          const wanIface = interfaces.find((i: any) => 
            wanPatterns.some(pattern => 
              i.name.toLowerCase().includes(pattern)
            ) && i.running === 'true'
          );
          
          if (wanIface) {
            wanInterface = wanIface.name;
          }
        } catch (error) {
          // Continue without interface info
          console.warn('Could not fetch interfaces:', error);
        }
      }
      
      return { wanInterface, defaultGateway };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const capabilitiesSlice = createSlice({
  name: 'capabilities',
  initialState,
  reducers: {
    reset: (state) => {
      return initialState;
    },
    
    clearDiscoveryError: (state) => {
      state.discoveryError = null;
    },
    
    setWanInterface: (state, action: PayloadAction<string | null>) => {
      state.wanInterface = action.payload;
    },
    
    setDefaultGateway: (state, action: PayloadAction<string | null>) => {
      state.defaultGateway = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Discover capabilities
      .addCase(discoverCapabilitiesAsync.pending, (state) => {
        state.loading = true;
        state.discoveryError = null;
      })
      .addCase(discoverCapabilitiesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.capabilities = action.payload.capabilities;
        state.routerType = action.payload.routerType;
        state.version = action.payload.version;
        state.architecture = action.payload.architecture;
        state.discovered = true;
        state.discoveryError = null;
      })
      .addCase(discoverCapabilitiesAsync.rejected, (state, action) => {
        state.loading = false;
        state.discoveryError = action.payload || 'Discovery failed';
        state.discovered = false;
      })
      
      // Discover WAN interface
      .addCase(discoverWanInterfaceAsync.fulfilled, (state, action) => {
        state.wanInterface = action.payload.wanInterface;
        state.defaultGateway = action.payload.defaultGateway;
      })
      .addCase(discoverWanInterfaceAsync.rejected, (state, action) => {
        console.error('Failed to discover WAN interface:', action.payload);
      });
  },
});

export const {
  reset,
  clearDiscoveryError,
  setWanInterface,
  setDefaultGateway,
} = capabilitiesSlice.actions;

// Selectors
export const selectCapabilities = (state: { capabilities: CapabilitiesState }) => state.capabilities;
export const selectRouterCapabilities = (state: { capabilities: CapabilitiesState }) => state.capabilities.capabilities;
export const selectRouterType = (state: { capabilities: CapabilitiesState }) => state.capabilities.routerType;
export const selectVersion = (state: { capabilities: CapabilitiesState }) => state.capabilities.version;
export const selectArchitecture = (state: { capabilities: CapabilitiesState }) => state.capabilities.architecture;
export const selectDiscovered = (state: { capabilities: CapabilitiesState }) => state.capabilities.discovered;
export const selectDiscoveryError = (state: { capabilities: CapabilitiesState }) => state.capabilities.discoveryError;
export const selectWanInterface = (state: { capabilities: CapabilitiesState }) => state.capabilities.wanInterface;
export const selectDefaultGateway = (state: { capabilities: CapabilitiesState }) => state.capabilities.defaultGateway;
export const selectCapabilitiesLoading = (state: { capabilities: CapabilitiesState }) => state.capabilities.loading;

// Computed selectors
export const selectIsVirtualRouter = (state: { capabilities: CapabilitiesState }) => state.capabilities.routerType === 'CHR';
export const selectIsPhysicalRouter = (state: { capabilities: CapabilitiesState }) => state.capabilities.routerType === 'RouterBOARD';
export const selectHasAdvancedFeatures = (state: { capabilities: CapabilitiesState }) => 
  state.capabilities.capabilities.hasQueues || state.capabilities.capabilities.hasGraphing;

// Check if a specific capability exists
export const selectHasCapability = (capability: keyof Capabilities) => 
  (state: { capabilities: CapabilitiesState }): boolean => {
    return state.capabilities.capabilities[capability] || false;
  };

export default capabilitiesSlice.reducer;