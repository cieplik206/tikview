import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MikrotikAPI } from '../../services/mikrotik-api';
import type { RouterPort } from '../../types/router';

// Raw resource data from /system/resource
interface ResourceData {
  'cpu-load': number;
  'cpu-count': number;
  'cpu-frequency': number;
  'total-memory': number;
  'free-memory': number;
  uptime: string;
  'board-name': string;
  version: string;
  'architecture-name': string;
  [key: string]: any;
}

// Raw health metric from /system/health
interface HealthMetric {
  '.id': string;
  name: string;
  type: 'C' | 'V' | 'W' | '%' | 'rpm' | 'dBm';
  value: string;
}

// Identity data from /system/identity
interface IdentityData {
  name: string;
  [key: string]: any;
}

// DHCP lease from /ip/dhcp-server/lease
interface DhcpLease {
  '.id': string;
  address: string;
  'mac-address': string;
  'host-name'?: string;
  server?: string;
  status?: string;
  'active-address'?: string;
  'active-mac-address'?: string;
  'active-host-name'?: string;
  'expires-after'?: string;
  'last-seen'?: string;
  disabled?: boolean;
  dynamic?: boolean;
  comment?: string;
  [key: string]: any;
}

// Interface data from /interface/ethernet
interface InterfaceData {
  '.id': string;
  name: string;
  'default-name'?: string;
  disabled: string;
  running: boolean | string;
  'mac-address'?: string;
  'orig-mac-address'?: string;
  speed?: string;
  'auto-negotiation'?: string;
  'full-duplex'?: string;
  mtu?: string;
  l2mtu?: string;
  comment?: string;
  'tx-bytes'?: string;
  'rx-bytes'?: string;
  'tx-packet'?: string;
  'rx-packet'?: string;
  'driver-tx-byte'?: string;
  'driver-rx-byte'?: string;
  'poe-out'?: string;
  'poe-priority'?: string;
  'last-link-up-time'?: string;
  slave?: boolean;
  [key: string]: any;
}

// IP Route data from /ip/route
interface IpRoute {
  '.id': string;
  'dst-address': string;
  gateway?: string;
  'gateway-status'?: string;
  'immediate-gw'?: string;
  distance?: number;
  scope?: number;
  'target-scope'?: number;
  active?: boolean;
  dynamic?: boolean;
  static?: boolean;
  disabled?: boolean;
  comment?: string;
  'routing-table'?: string;
  'vrf-interface'?: string;
  [key: string]: any;
}

// IP Address data from /ip/address
interface IpAddress {
  '.id': string;
  address: string;
  network?: string;
  interface?: string;
  'actual-interface'?: string;
  invalid?: boolean;
  dynamic?: boolean;
  disabled?: boolean;
  comment?: string;
  [key: string]: any;
}

// Traffic monitoring data from /interface/monitor-traffic
interface TrafficSnapshot {
  name: string;
  'rx-bits-per-second': string;
  'tx-bits-per-second': string;
  'rx-packets-per-second'?: string;
  'tx-packets-per-second'?: string;
  'rx-drops-per-second'?: string;
  'tx-drops-per-second'?: string;
  timestamp: number;
  rxBytes: number;
  txBytes: number;
  [key: string]: any;
}

// Processed traffic data point for charts
interface TrafficDataPoint {
  timestamp: number;
  rxBps: number;  // Receive bits per second
  txBps: number;  // Transmit bits per second
  rxMbps: number; // Receive Mbps
  txMbps: number; // Transmit Mbps
}

// Traffic data for charts
interface TrafficChartData {
  labels: string[];
  datasets: {
    download: number[];
    upload: number[];
  };
  maxDataPoints: number;
}

// Generic interface data from /interface (all interfaces)
interface AllInterfaceData {
  '.id': string;
  name: string;
  type?: string;
  'default-name'?: string;
  mtu?: number;
  'actual-mtu'?: number;
  l2mtu?: number;
  'mac-address'?: string;
  'last-link-up-time'?: string;
  'last-link-down-time'?: string;
  'link-downs'?: number;
  'rx-byte'?: string;
  'tx-byte'?: string;
  'rx-packet'?: string;
  'tx-packet'?: string;
  'rx-drop'?: string;
  'tx-drop'?: string;
  'rx-error'?: string;
  'tx-error'?: string;
  running?: boolean | string;
  disabled?: boolean | string;
  comment?: string;
  [key: string]: any;
}

// Normalized/calculated values
interface NormalizedData {
  // CPU
  cpuLoad: number;
  cpuCount: number;
  cpuFrequency: number;
  cpuFrequencyGHz: string;
  cpuInfo: string;
  
  // Memory
  memoryUsed: number;
  memoryTotal: number;
  memoryFree: number;
  memoryPercentage: number;
  memoryUsedFormatted: string;
  memoryTotalFormatted: string;
  memoryFreeFormatted: string;
  
  // Temperature
  cpuTemperature: number | null;
  temperatureStatus: 'normal' | 'warm' | 'hot' | 'critical' | 'unknown';
  
  // System info
  uptime: string;
  formattedUptime: string;
  boardName: string;
  version: string;
  architecture: string;
  
  // System health
  systemHealth: {
    status: 'critical' | 'warning' | 'success';
    label: string;
  };
  
  // Network info
  wanInterface: string | null;
}

// Store settings
interface StoreSettings {
  pollingInterval: number; // milliseconds
  pollingEnabled: boolean;
}

interface SystemResourcesState {
  // Raw data from API
  resources: ResourceData | null;
  health: HealthMetric[] | null;
  identity: IdentityData | null;
  dhcpLeases: DhcpLease[];
  interfaces: InterfaceData[];
  allInterfaces: AllInterfaceData[];
  ipRoutes: IpRoute[];
  ipAddresses: IpAddress[];
  
  // Traffic monitoring
  trafficRaw: TrafficDataPoint[];
  trafficChart: TrafficChartData;
  trafficInterface: string | null;
  lastTrafficSnapshot: { timestamp: number; rxBytes: number; txBytes: number } | null;
  
  // Normalized/calculated values
  normalized: NormalizedData;
  
  // Settings
  settings: StoreSettings;
  
  // State management
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  healthSupported: boolean;
  identityFetched: boolean;
}

const initialNormalized: NormalizedData = {
  // CPU
  cpuLoad: 0,
  cpuCount: 0,
  cpuFrequency: 0,
  cpuFrequencyGHz: '0',
  cpuInfo: '',
  
  // Memory
  memoryUsed: 0,
  memoryTotal: 0,
  memoryFree: 0,
  memoryPercentage: 0,
  memoryUsedFormatted: '0MB',
  memoryTotalFormatted: '0MB',
  memoryFreeFormatted: '0MB',
  
  // Temperature
  cpuTemperature: null,
  temperatureStatus: 'unknown',
  
  // System info
  uptime: '',
  formattedUptime: 'N/A',
  boardName: '',
  version: '',
  architecture: '',
  
  // System health
  systemHealth: {
    status: 'success',
    label: 'Optimal'
  },
  
  // Network info
  wanInterface: null
};

const initialState: SystemResourcesState = {
  // Raw data
  resources: null,
  health: null,
  identity: null,
  dhcpLeases: [],
  interfaces: [],
  allInterfaces: [],
  ipRoutes: [],
  ipAddresses: [],
  
  // Traffic monitoring
  trafficRaw: [],
  trafficChart: {
    labels: [],
    datasets: {
      download: [],
      upload: []
    },
    maxDataPoints: 120  // 2 minutes at 1 second intervals
  },
  trafficInterface: null,
  lastTrafficSnapshot: null,
  
  // Normalized data with defaults
  normalized: initialNormalized,
  
  // Settings
  settings: {
    pollingInterval: 2000, // Default 2 seconds
    pollingEnabled: false
  },
  
  // State management
  loading: false,
  error: null,
  lastUpdated: null,
  healthSupported: false,
  identityFetched: false,
};

// Helper functions
const formatMemory = (bytes: number): string => {
  if (!bytes && bytes !== 0) return '0MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) {
    return `${Math.round(mb)}MB`;
  } else {
    return `${(mb / 1024).toFixed(1)}GB`;
  }
};

const formatUptime = (uptime: string): string => {
  if (!uptime) return 'N/A';
  
  // Parse uptime string (format: "1w2d3h4m5s")
  const regex = /(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
  const match = uptime.match(regex);
  
  if (!match) return uptime;
  
  const [, weeks, days, hours, minutes] = match;
  const parts = [];
  
  if (weeks) parts.push(`${weeks}w`);
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  
  return parts.length > 0 ? parts.join(' ') : uptime;
};

const getTemperatureStatus = (temp: number): 'normal' | 'warm' | 'hot' | 'critical' => {
  if (temp < 60) return 'normal';
  if (temp < 70) return 'warm';
  if (temp < 80) return 'hot';
  return 'critical';
};

const calculateSystemHealth = (cpuLoad: number, memoryPercentage: number): { status: 'critical' | 'warning' | 'success'; label: string } => {
  if (cpuLoad > 80 || memoryPercentage > 90) {
    return { status: 'critical', label: 'Critical' };
  } else if (cpuLoad > 60 || memoryPercentage > 75) {
    return { status: 'warning', label: 'Warning' };
  } else {
    return { status: 'success', label: 'Optimal' };
  }
};

// Async thunks
export const fetchSystemResourcesAsync = createAsyncThunk<
  ResourceData,
  MikrotikAPI,
  { rejectValue: string }
>(
  'systemResources/fetchResources',
  async (api, { rejectWithValue }) => {
    try {
      const response = await api.request('/system/resource');
      const resourceData = Array.isArray(response) ? response[0] : response;
      return resourceData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIdentityAsync = createAsyncThunk<
  IdentityData,
  MikrotikAPI,
  { rejectValue: string; state: { systemResources: SystemResourcesState } }
>(
  'systemResources/fetchIdentity',
  async (api, { rejectWithValue, getState }) => {
    // Skip if already fetched
    if (getState().systemResources.identityFetched) {
      throw new Error('Already fetched');
    }
    
    try {
      const response = await api.request('/system/identity');
      const identityData = Array.isArray(response) ? response[0] : response;
      return identityData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDhcpLeasesAsync = createAsyncThunk<
  DhcpLease[],
  MikrotikAPI,
  { rejectValue: string }
>(
  'systemResources/fetchDhcpLeases',
  async (api, { rejectWithValue }) => {
    try {
      const response = await api.request('/ip/dhcp-server/lease');
      const leases = Array.isArray(response) ? response : [response];
      return leases;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchInterfacesAsync = createAsyncThunk<
  InterfaceData[],
  MikrotikAPI,
  { rejectValue: string }
>(
  'systemResources/fetchInterfaces',
  async (api, { rejectWithValue }) => {
    try {
      const response = await api.request('/interface/ethernet');
      const interfaces = Array.isArray(response) ? response : [response];
      return interfaces;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllInterfacesAsync = createAsyncThunk<
  AllInterfaceData[],
  MikrotikAPI,
  { rejectValue: string }
>(
  'systemResources/fetchAllInterfaces',
  async (api, { rejectWithValue }) => {
    try {
      const response = await api.request('/interface');
      const allInterfaces = Array.isArray(response) ? response : [response];
      return allInterfaces;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIpRoutesAsync = createAsyncThunk<
  IpRoute[],
  MikrotikAPI,
  { rejectValue: string }
>(
  'systemResources/fetchIpRoutes',
  async (api, { rejectWithValue }) => {
    try {
      const response = await api.request('/ip/route');
      const routes = Array.isArray(response) ? response : [response];
      return routes;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIpAddressesAsync = createAsyncThunk<
  IpAddress[],
  MikrotikAPI,
  { rejectValue: string }
>(
  'systemResources/fetchIpAddresses',
  async (api, { rejectWithValue }) => {
    try {
      const response = await api.request('/ip/address');
      const addresses = Array.isArray(response) ? response : [response];
      return addresses;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchHealthAsync = createAsyncThunk<
  HealthMetric[],
  MikrotikAPI,
  { rejectValue: string }
>(
  'systemResources/fetchHealth',
  async (api, { rejectWithValue }) => {
    try {
      const response = await api.request('/system/health');
      const healthData = Array.isArray(response) ? response : [response];
      
      // Check if health monitoring is supported
      if (healthData.length > 0 && !healthData[0].state) {
        return healthData;
      } else if (healthData[0]?.state === 'disabled') {
        throw new Error('Health monitoring disabled');
      }
      
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTrafficSnapshotAsync = createAsyncThunk<
  { rxBytes: number; txBytes: number; timestamp: number; interfaceName: string },
  { api: MikrotikAPI; interfaceName?: string },
  { rejectValue: string; state: { systemResources: SystemResourcesState } }
>(
  'systemResources/fetchTrafficSnapshot',
  async ({ api, interfaceName }, { rejectWithValue, getState }) => {
    try {
      const state = getState().systemResources;
      // Use WAN interface by default, or specified interface
      const targetInterface = interfaceName || state.trafficInterface || state.normalized.wanInterface || 'ether1';
      
      // Fetch all interfaces to get current stats
      const response = await api.request('/interface');
      const interfaces = Array.isArray(response) ? response : [response];
      
      // Find the target interface
      const iface = interfaces.find((i: any) => i.name === targetInterface);
      if (!iface) {
        throw new Error(`Interface ${targetInterface} not found`);
      }
      
      const currentTime = Date.now();
      const rxBytes = parseInt(iface['rx-byte'] || '0');
      const txBytes = parseInt(iface['tx-byte'] || '0');
      
      return { rxBytes, txBytes, timestamp: currentTime, interfaceName: targetInterface };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const systemResourcesSlice = createSlice({
  name: 'systemResources',
  initialState,
  reducers: {
    // Update polling settings
    setPollingInterval: (state, action: PayloadAction<number>) => {
      state.settings.pollingInterval = action.payload;
    },
    setPollingEnabled: (state, action: PayloadAction<boolean>) => {
      state.settings.pollingEnabled = action.payload;
    },
    
    // Traffic monitoring
    setTrafficInterface: (state, action: PayloadAction<string>) => {
      state.trafficInterface = action.payload;
    },
    addTrafficDataPoint: (state, action: PayloadAction<TrafficDataPoint>) => {
      state.trafficRaw.push(action.payload);
      
      // Keep only last 2 minutes of data (120 points at 1 second intervals)
      const maxPoints = state.trafficChart.maxDataPoints;
      if (state.trafficRaw.length > maxPoints) {
        state.trafficRaw = state.trafficRaw.slice(-maxPoints);
      }
      
      // Update chart data
      const now = Date.now();
      const twoMinutesAgo = now - (2 * 60 * 1000);
      
      // Filter data to last 2 minutes
      const recentData = state.trafficRaw.filter(point => point.timestamp > twoMinutesAgo);
      
      // Create labels and datasets
      const labels: string[] = [];
      const download: number[] = [];
      const upload: number[] = [];
      
      recentData.forEach(point => {
        const date = new Date(point.timestamp);
        const timeStr = date.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        labels.push(timeStr);
        download.push(parseFloat(point.rxMbps.toFixed(2)));
        upload.push(parseFloat(point.txMbps.toFixed(2)));
      });
      
      // Update chart data
      state.trafficChart.labels = labels;
      state.trafficChart.datasets.download = download;
      state.trafficChart.datasets.upload = upload;
    },
    resetTrafficData: (state) => {
      state.trafficRaw = [];
      state.trafficChart = {
        labels: [],
        datasets: {
          download: [],
          upload: []
        },
        maxDataPoints: 120
      };
      state.trafficInterface = null;
      state.lastTrafficSnapshot = null;
    },
    
    // Reset store
    reset: (state) => {
      return initialState;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch system resources
      .addCase(fetchSystemResourcesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSystemResourcesAsync.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        state.resources = data;
        state.lastUpdated = Date.now();
        
        // Normalize resource data
        // CPU info
        state.normalized.cpuLoad = parseInt(String(data['cpu-load'] || '0'));
        state.normalized.cpuCount = parseInt(String(data['cpu-count'] || '1'));
        state.normalized.cpuFrequency = parseInt(String(data['cpu-frequency'] || '0'));
        
        // Format CPU info
        if (state.normalized.cpuCount && state.normalized.cpuFrequency) {
          state.normalized.cpuFrequencyGHz = (state.normalized.cpuFrequency / 1000).toFixed(1);
          state.normalized.cpuInfo = `${state.normalized.cpuCount} cores at ${state.normalized.cpuFrequencyGHz}GHz`;
        } else if (state.normalized.cpuCount) {
          state.normalized.cpuInfo = `${state.normalized.cpuCount} cores`;
        } else {
          state.normalized.cpuInfo = '';
        }
        
        // Memory info
        const totalMem = parseInt(String(data['total-memory'] || '0'));
        const freeMem = parseInt(String(data['free-memory'] || '0'));
        
        state.normalized.memoryTotal = totalMem;
        state.normalized.memoryFree = freeMem;
        state.normalized.memoryUsed = totalMem - freeMem;
        state.normalized.memoryPercentage = totalMem > 0 
          ? Math.round((state.normalized.memoryUsed / totalMem) * 100)
          : 0;
        
        // Format memory values
        state.normalized.memoryUsedFormatted = formatMemory(state.normalized.memoryUsed);
        state.normalized.memoryTotalFormatted = formatMemory(state.normalized.memoryTotal);
        state.normalized.memoryFreeFormatted = formatMemory(state.normalized.memoryFree);
        
        // System info
        state.normalized.uptime = data.uptime || '';
        state.normalized.formattedUptime = formatUptime(state.normalized.uptime);
        state.normalized.boardName = data['board-name'] || '';
        state.normalized.version = data.version || '';
        state.normalized.architecture = data['architecture-name'] || '';
        
        // Calculate system health
        state.normalized.systemHealth = calculateSystemHealth(
          state.normalized.cpuLoad,
          state.normalized.memoryPercentage
        );
      })
      .addCase(fetchSystemResourcesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch system resources';
      })
      
      // Fetch identity
      .addCase(fetchIdentityAsync.fulfilled, (state, action) => {
        state.identity = action.payload;
        state.identityFetched = true;
      })
      
      // Fetch DHCP leases
      .addCase(fetchDhcpLeasesAsync.fulfilled, (state, action) => {
        state.dhcpLeases = action.payload;
      })
      
      // Fetch interfaces
      .addCase(fetchInterfacesAsync.fulfilled, (state, action) => {
        state.interfaces = action.payload;
      })
      
      // Fetch all interfaces
      .addCase(fetchAllInterfacesAsync.fulfilled, (state, action) => {
        state.allInterfaces = action.payload;
      })
      
      // Fetch IP routes
      .addCase(fetchIpRoutesAsync.fulfilled, (state, action) => {
        state.ipRoutes = action.payload;
        
        // Parse WAN interface from routes
        const routes = action.payload;
        // Find the default route (0.0.0.0/0)
        const defaultRoute = routes.find(route => 
          route['dst-address'] === '0.0.0.0/0'
        );
        
        if (defaultRoute && defaultRoute['immediate-gw']) {
          // Parse immediate-gw field format: "gateway_ip%interface_name"
          const immediateGw = defaultRoute['immediate-gw'];
          const match = immediateGw.match(/%(.+)$/);
          
          if (match && match[1]) {
            state.normalized.wanInterface = match[1];
          } else {
            // If no % separator, check if immediate-gw is just the interface name
            if (!immediateGw.includes('.')) {
              state.normalized.wanInterface = immediateGw;
            } else {
              state.normalized.wanInterface = null;
            }
          }
        } else {
          state.normalized.wanInterface = null;
        }
      })
      
      // Fetch IP addresses
      .addCase(fetchIpAddressesAsync.fulfilled, (state, action) => {
        state.ipAddresses = action.payload;
      })
      
      // Fetch health
      .addCase(fetchHealthAsync.fulfilled, (state, action) => {
        state.health = action.payload;
        state.healthSupported = true;
        
        // Normalize health data
        // Find CPU temperature
        const tempMetric = action.payload.find(m => m.name === 'cpu-temperature');
        
        if (tempMetric) {
          state.normalized.cpuTemperature = parseFloat(tempMetric.value);
          state.normalized.temperatureStatus = getTemperatureStatus(state.normalized.cpuTemperature);
        } else {
          state.normalized.cpuTemperature = null;
          state.normalized.temperatureStatus = 'unknown';
        }
      })
      .addCase(fetchHealthAsync.rejected, (state) => {
        state.healthSupported = false;
        state.health = null;
        state.normalized.cpuTemperature = null;
        state.normalized.temperatureStatus = 'unknown';
      })
      
      // Fetch traffic snapshot
      .addCase(fetchTrafficSnapshotAsync.fulfilled, (state, action) => {
        const { rxBytes, txBytes, timestamp, interfaceName } = action.payload;
        
        // If we have a previous snapshot, calculate the rate
        if (state.lastTrafficSnapshot) {
          const timeDiff = (timestamp - state.lastTrafficSnapshot.timestamp) / 1000; // Convert to seconds
          
          if (timeDiff > 0) {
            // Calculate bytes per second
            const rxBytesPerSec = (rxBytes - state.lastTrafficSnapshot.rxBytes) / timeDiff;
            const txBytesPerSec = (txBytes - state.lastTrafficSnapshot.txBytes) / timeDiff;
            
            // Convert to bits per second
            const rxBps = rxBytesPerSec * 8;
            const txBps = txBytesPerSec * 8;
            
            // Only add data point if we have positive values (counters can reset)
            if (rxBps >= 0 && txBps >= 0) {
              const dataPoint: TrafficDataPoint = {
                timestamp,
                rxBps,
                txBps,
                rxMbps: rxBps / 1000000,  // Convert to Mbps
                txMbps: txBps / 1000000   // Convert to Mbps
              };
              
              systemResourcesSlice.caseReducers.addTrafficDataPoint(state, {
                type: 'systemResources/addTrafficDataPoint',
                payload: dataPoint
              });
            }
          }
        }
        
        // Update last snapshot with consistent structure
        state.lastTrafficSnapshot = {
          timestamp,
          rxBytes,
          txBytes
        };
        
        // Set traffic interface
        state.trafficInterface = interfaceName;
      });
  },
});

export const {
  setPollingInterval,
  setPollingEnabled,
  setTrafficInterface,
  addTrafficDataPoint,
  resetTrafficData,
  reset,
  clearError,
} = systemResourcesSlice.actions;

// Selectors
export const selectSystemResources = (state: { systemResources: SystemResourcesState }) => state.systemResources;
export const selectResources = (state: { systemResources: SystemResourcesState }) => state.systemResources.resources;
export const selectNormalized = (state: { systemResources: SystemResourcesState }) => state.systemResources.normalized;
export const selectCpuLoad = (state: { systemResources: SystemResourcesState }) => state.systemResources.normalized.cpuLoad;
export const selectMemoryPercentage = (state: { systemResources: SystemResourcesState }) => state.systemResources.normalized.memoryPercentage;
export const selectCpuTemperature = (state: { systemResources: SystemResourcesState }) => state.systemResources.normalized.cpuTemperature;
export const selectUptime = (state: { systemResources: SystemResourcesState }) => state.systemResources.normalized.formattedUptime;
export const selectBoardName = (state: { systemResources: SystemResourcesState }) => state.systemResources.normalized.boardName;
export const selectVersion = (state: { systemResources: SystemResourcesState }) => state.systemResources.normalized.version;
export const selectSystemHealth = (state: { systemResources: SystemResourcesState }) => state.systemResources.normalized.systemHealth;
export const selectDhcpLeases = (state: { systemResources: SystemResourcesState }) => state.systemResources.dhcpLeases;
export const selectInterfaces = (state: { systemResources: SystemResourcesState }) => state.systemResources.interfaces;
export const selectRouterName = (state: { systemResources: SystemResourcesState }) => state.systemResources.identity?.name || 'Unknown';
export const selectTrafficChart = (state: { systemResources: SystemResourcesState }) => state.systemResources.trafficChart;
export const selectPollingEnabled = (state: { systemResources: SystemResourcesState }) => state.systemResources.settings.pollingEnabled;
export const selectPollingInterval = (state: { systemResources: SystemResourcesState }) => state.systemResources.settings.pollingInterval;
export const selectLoading = (state: { systemResources: SystemResourcesState }) => state.systemResources.loading;
export const selectError = (state: { systemResources: SystemResourcesState }) => state.systemResources.error;

// Convert interfaces to RouterPort format
export const selectPorts = (state: { systemResources: SystemResourcesState }): RouterPort[] => {
  const { interfaces, resources } = state.systemResources;
  
  // Early return if no interfaces
  if (!interfaces || interfaces.length === 0) {
    return [];
  }
  
  const processedPorts: RouterPort[] = [];
  
  interfaces.forEach((iface) => {
    // All interfaces from /interface/ethernet are physical ethernet/SFP ports
    // No need to filter by type since we're using the ethernet endpoint
    
    // Extract port number from default-name or name
    const baseName = iface['default-name'] || iface.name;
    const portNumber = baseName.match(/\d+$/)?.[0] || '0';
    
    // Determine port type
    let portType: RouterPort['type'] = 'ethernet';
    if (baseName.includes('sfp')) {
      portType = 'sfp';
    }
    
    // Determine capabilities based on actual interface data
    const capabilities: string[] = [];
    
    // Check for 2.5G capability (could be detected from speed or hardcoded for specific ports)
    if ((iface.name === 'ether1' || iface['default-name'] === 'ether1') && 
        resources?.['board-name']?.includes('RB5009')) {
      capabilities.push('2.5G');
    }
    
    // Check for SFP/10G capability
    if (baseName.includes('sfp')) {
      capabilities.push('10G');
    }
    
    // Convert string "true"/"false" to boolean
    const isRunning = iface.running === true || iface.running === 'true';
    const isDisabled = (typeof iface.disabled === 'boolean' ? iface.disabled : iface.disabled === 'true');
    
    // Determine port status
    let status: RouterPort['status'] = 'disconnected';
    if (isDisabled) {
      status = 'disabled';
    } else if (isRunning) {
      status = 'connected';
    }
    
    processedPorts.push({
      name: iface.name,
      number: portNumber,
      label: iface.name.includes('sfp') ? 'SFP+' : portNumber,
      status,
      running: isRunning,
      speed: iface.speed || (isRunning ? '1 Gbps' : undefined),
      txRate: iface['tx-bytes'] ? parseInt(iface['tx-bytes']) : 0,
      rxRate: iface['rx-bytes'] ? parseInt(iface['rx-bytes']) : 0,
      macAddress: iface['mac-address'],
      comment: iface.comment,
      type: portType,
      capabilities: capabilities.length > 0 ? capabilities : undefined
    });
  });
  
  // Create a new sorted array instead of mutating in place
  const sortedPorts = [...processedPorts].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'ethernet' ? -1 : 1;
    return parseInt(a.number) - parseInt(b.number);
  });
  
  return sortedPorts;
};

export default systemResourcesSlice.reducer;