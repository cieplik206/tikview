import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ConnectionStatus = null | 'checking' | 'up' | 'down';
type OverallStatus = 'excellent' | 'good' | 'limited' | 'offline';

interface WanStatus {
  status: ConnectionStatus;
  details: string;
  interface: string | null;
  lastChecked: number | null;
}

interface GatewayStatus {
  status: ConnectionStatus;
  address: string | null;
  latency: number | null;
  lastChecked: number | null;
}

interface InternetStatus {
  status: ConnectionStatus;
  latency: number | null;
  lastChecked: number | null;
}

interface DnsStatus {
  status: ConnectionStatus;
  resolvedIp: string | null;
  lastChecked: number | null;
}

interface NetworkStatusState {
  wan: WanStatus;
  gateway: GatewayStatus;
  internet: InternetStatus;
  dns: DnsStatus;
}

const initialState: NetworkStatusState = {
  wan: {
    status: null, // null = not checked, 'checking', 'up', 'down'
    details: '',
    interface: null,
    lastChecked: null
  },
  gateway: {
    status: null,
    address: null,
    latency: null,
    lastChecked: null
  },
  internet: {
    status: null,
    latency: null,
    lastChecked: null
  },
  dns: {
    status: null,
    resolvedIp: null,
    lastChecked: null
  }
};

const networkStatusSlice = createSlice({
  name: 'networkStatus',
  initialState,
  reducers: {
    updateWanStatus: (state, action: PayloadAction<{
      status: ConnectionStatus;
      details?: string;
      interfaceName?: string;
    }>) => {
      state.wan.status = action.payload.status;
      state.wan.details = action.payload.details || '';
      if (action.payload.interfaceName) {
        state.wan.interface = action.payload.interfaceName;
      }
      state.wan.lastChecked = Date.now();
    },

    updateGatewayStatus: (state, action: PayloadAction<{
      status: ConnectionStatus;
      address?: string;
      latency?: number;
    }>) => {
      state.gateway.status = action.payload.status;
      if (action.payload.address) {
        state.gateway.address = action.payload.address;
      }
      state.gateway.latency = action.payload.latency ?? null;
      state.gateway.lastChecked = Date.now();
    },

    updateInternetStatus: (state, action: PayloadAction<{
      status: ConnectionStatus;
      latency?: number;
    }>) => {
      state.internet.status = action.payload.status;
      state.internet.latency = action.payload.latency ?? null;
      state.internet.lastChecked = Date.now();
    },

    updateDnsStatus: (state, action: PayloadAction<{
      status: ConnectionStatus;
      resolvedIp?: string;
    }>) => {
      state.dns.status = action.payload.status;
      state.dns.resolvedIp = action.payload.resolvedIp ?? null;
      state.dns.lastChecked = Date.now();
    },

    reset: (state) => {
      return initialState;
    }
  }
});

export const {
  updateWanStatus,
  updateGatewayStatus,
  updateInternetStatus,
  updateDnsStatus,
  reset,
} = networkStatusSlice.actions;

// Selectors
export const selectNetworkStatus = (state: { networkStatus: NetworkStatusState }) => state.networkStatus;
export const selectWanStatus = (state: { networkStatus: NetworkStatusState }) => state.networkStatus.wan;
export const selectGatewayStatus = (state: { networkStatus: NetworkStatusState }) => state.networkStatus.gateway;
export const selectInternetStatus = (state: { networkStatus: NetworkStatusState }) => state.networkStatus.internet;
export const selectDnsStatus = (state: { networkStatus: NetworkStatusState }) => state.networkStatus.dns;

export const selectIsAnyChecking = (state: { networkStatus: NetworkStatusState }): boolean => {
  return state.networkStatus.wan.status === 'checking' ||
         state.networkStatus.gateway.status === 'checking' ||
         state.networkStatus.internet.status === 'checking' ||
         state.networkStatus.dns.status === 'checking';
};

export const selectHasInitialData = (state: { networkStatus: NetworkStatusState }): boolean => {
  return state.networkStatus.wan.status !== null ||
         state.networkStatus.gateway.status !== null ||
         state.networkStatus.internet.status !== null ||
         state.networkStatus.dns.status !== null;
};

export const selectOverallStatus = (state: { networkStatus: NetworkStatusState }): OverallStatus => {
  const { wan, gateway, internet, dns } = state.networkStatus;
  
  if (wan.status === 'up' && 
      gateway.status === 'up' && 
      internet.status === 'up' && 
      dns.status === 'up') {
    return 'excellent';
  } else if (wan.status === 'up' && 
            (gateway.status === 'up' || internet.status === 'up')) {
    return 'good';
  } else if (wan.status === 'up') {
    return 'limited';
  } else {
    return 'offline';
  }
};

export default networkStatusSlice.reducer;