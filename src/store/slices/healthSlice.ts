import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MikrotikAPI } from '../../services/mikrotik-api';

// Types for health data
export interface HealthMetric {
  ".id": string;
  name: string;
  type: "C" | "V" | "W" | "%" | "rpm" | "dBm";  // Celsius, Volts, Watts, Percentage, RPM, dBm
  value: string;
}

export interface RouterHealth {
  routerId: string;
  routerName: string;
  timestamp: number;
  metrics: HealthMetric[];
  cpuTemperature?: number;
  poeConsumption?: number;
  voltage?: number;
  fanSpeed?: number;
  error?: string;
  healthSupported: boolean;
}

export interface NormalizedHealth {
  temperature: {
    current: number | null;
    unit: 'C' | 'F';
    status: 'normal' | 'warm' | 'hot' | 'critical' | 'unknown';
    trend?: 'rising' | 'falling' | 'stable';
  };
  power?: {
    poeConsumption: number;
    unit: 'W';
  };
  voltage?: {
    value: number;
    unit: 'V';
  };
}

interface HealthState {
  routers: Record<string, RouterHealth>;
  normalizedData: Record<string, NormalizedHealth>;
  isPolling: boolean;
  lastUpdate: number | null;
  errors: Record<string, string>;
  unsupportedRouters: string[];
}

// Router configuration for polling
export interface RouterConfig {
  id: string;
  name: string;
  host: string;
  username: string;
  password: string;
  protocol: 'http' | 'https';
  pollingInterval?: number; // milliseconds, default 30000
}

const initialState: HealthState = {
  routers: {},
  normalizedData: {},
  isPolling: false,
  lastUpdate: null,
  errors: {},
  unsupportedRouters: []
};

// Helper functions
const getTemperatureStatus = (temp: number): 'normal' | 'warm' | 'hot' | 'critical' => {
  if (temp < 60) return 'normal';
  if (temp < 70) return 'warm';
  if (temp < 80) return 'hot';
  return 'critical';
};

const normalizeHealthData = (metrics: HealthMetric[]): NormalizedHealth => {
  const normalized: NormalizedHealth = {
    temperature: {
      current: null,
      unit: 'C',
      status: 'unknown'
    }
  };

  metrics.forEach(metric => {
    switch (metric.name) {
      case 'cpu-temperature':
        const temp = parseFloat(metric.value);
        normalized.temperature = {
          current: temp,
          unit: 'C',
          status: getTemperatureStatus(temp)
        };
        break;
      
      case 'poe-out-consumption':
        normalized.power = {
          poeConsumption: parseFloat(metric.value),
          unit: 'W'
        };
        break;
      
      case 'jack-voltage':
      case '2pin-voltage':
      case 'poe-in-voltage':
        if (parseFloat(metric.value) > 0) {
          normalized.voltage = {
            value: parseFloat(metric.value),
            unit: 'V'
          };
        }
        break;
    }
  });

  return normalized;
};

const calculateTrend = (currentTemp: number, previousHealth?: RouterHealth): 'rising' | 'falling' | 'stable' | undefined => {
  if (!previousHealth?.cpuTemperature) return undefined;
  
  const diff = currentTemp - previousHealth.cpuTemperature;
  if (Math.abs(diff) < 1) return 'stable';
  return diff > 0 ? 'rising' : 'falling';
};

// Async thunks
export const checkHealthSupportAsync = createAsyncThunk<
  boolean,
  RouterConfig,
  { rejectValue: string }
>(
  'health/checkSupport',
  async (config, { rejectWithValue }) => {
    const baseUrl = `${config.protocol}://${config.host}`;
    const authHeader = 'Basic ' + btoa(`${config.username}:${config.password}`);
    
    try {
      const response = await fetch(`${baseUrl}/rest/system/health`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        mode: import.meta.env.DEV ? 'cors' : 'same-origin'
      });

      if (!response.ok) {
        // 404 or 400 typically means the endpoint doesn't exist
        if (response.status === 404 || response.status === 400) {
          return false;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if health monitoring is disabled
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (data.state === 'disabled') {
          return false; // Health monitoring exists but is disabled
        }
      }
      
      // If we get an array or any other valid response, health is supported
      return true;
    } catch (error: any) {
      // Network errors or other issues
      return false;
    }
  }
);

export const fetchRouterHealthAsync = createAsyncThunk<
  RouterHealth,
  { config: RouterConfig; previousHealth?: RouterHealth },
  { rejectValue: string }
>(
  'health/fetchRouterHealth',
  async ({ config, previousHealth }, { rejectWithValue }) => {
    const baseUrl = `${config.protocol}://${config.host}`;
    const authHeader = 'Basic ' + btoa(`${config.username}:${config.password}`);
    
    try {
      const response = await fetch(`${baseUrl}/rest/system/health`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        // In development, might need to handle CORS
        mode: import.meta.env.DEV ? 'cors' : 'same-origin'
      });

      if (!response.ok) {
        // Check if this is because health isn't supported
        if (response.status === 404 || response.status === 400) {
          return {
            routerId: config.id,
            routerName: config.name,
            timestamp: Date.now(),
            metrics: [],
            healthSupported: false
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      let metrics: HealthMetric[] = [];
      let healthSupported = true;
      
      if (Array.isArray(data)) {
        metrics = data;
      } else if (data.state === 'disabled') {
        // Health monitoring exists but is disabled
        healthSupported = false;
      }

      const health: RouterHealth = {
        routerId: config.id,
        routerName: config.name,
        timestamp: Date.now(),
        metrics,
        healthSupported
      };

      // Extract specific values for quick access
      metrics.forEach(metric => {
        if (metric.name === 'cpu-temperature') {
          health.cpuTemperature = parseFloat(metric.value);
        } else if (metric.name === 'poe-out-consumption') {
          health.poeConsumption = parseFloat(metric.value);
        }
      });

      return health;
    } catch (error: any) {
      return rejectWithValue(`Failed to fetch health for ${config.name}: ${error.message}`);
    }
  }
);

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    startPolling: (state) => {
      state.isPolling = true;
    },
    
    stopPolling: (state) => {
      state.isPolling = false;
    },
    
    addUnsupportedRouter: (state, action: PayloadAction<string>) => {
      if (!state.unsupportedRouters.includes(action.payload)) {
        state.unsupportedRouters.push(action.payload);
      }
    },
    
    removeUnsupportedRouter: (state, action: PayloadAction<string>) => {
      state.unsupportedRouters = state.unsupportedRouters.filter(id => id !== action.payload);
    },
    
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
    
    clearAllErrors: (state) => {
      state.errors = {};
    },
    
    reset: (state) => {
      return initialState;
    },
    
    // Convert Celsius to Fahrenheit if needed
    convertTemperatureUnit: (state, action: PayloadAction<{ routerId: string; unit: 'C' | 'F' }>) => {
      const { routerId, unit } = action.payload;
      const normalized = state.normalizedData[routerId];
      
      if (normalized && normalized.temperature.current !== null) {
        if (unit === 'F' && normalized.temperature.unit === 'C') {
          normalized.temperature.current = (normalized.temperature.current * 9/5) + 32;
          normalized.temperature.unit = 'F';
        } else if (unit === 'C' && normalized.temperature.unit === 'F') {
          normalized.temperature.current = (normalized.temperature.current - 32) * 5/9;
          normalized.temperature.unit = 'C';
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Check health support
      .addCase(checkHealthSupportAsync.fulfilled, (state, action) => {
        const routerId = action.meta.arg.id;
        if (!action.payload) {
          state.unsupportedRouters.push(routerId);
        } else {
          state.unsupportedRouters = state.unsupportedRouters.filter(id => id !== routerId);
        }
      })
      
      // Fetch router health
      .addCase(fetchRouterHealthAsync.pending, (state, action) => {
        const routerId = action.meta.arg.config.id;
        delete state.errors[routerId];
      })
      .addCase(fetchRouterHealthAsync.fulfilled, (state, action) => {
        const health = action.payload;
        const routerId = health.routerId;
        
        // Store the health data
        state.routers[routerId] = health;
        
        // If health is not supported, mark it and don't process further
        if (!health.healthSupported) {
          if (!state.unsupportedRouters.includes(routerId)) {
            state.unsupportedRouters.push(routerId);
          }
          
          // Still store empty normalized data
          state.normalizedData[routerId] = {
            temperature: {
              current: null,
              unit: 'C',
              status: 'unknown'
            }
          };
          
          return;
        }
        
        // Router supports health, proceed with normalization
        const normalized = normalizeHealthData(health.metrics);
        
        // Add trend if we have previous data
        if (normalized.temperature.current !== null) {
          const previousHealth = action.meta.arg.previousHealth;
          normalized.temperature.trend = calculateTrend(normalized.temperature.current, previousHealth);
        }
        
        state.normalizedData[routerId] = normalized;
        delete state.errors[routerId];
        state.lastUpdate = Date.now();
        
        // Remove from unsupported list if it was there
        state.unsupportedRouters = state.unsupportedRouters.filter(id => id !== routerId);
      })
      .addCase(fetchRouterHealthAsync.rejected, (state, action) => {
        const routerId = action.meta.arg.config.id;
        state.errors[routerId] = action.payload || 'Failed to fetch health data';
      });
  },
});

export const {
  startPolling,
  stopPolling,
  addUnsupportedRouter,
  removeUnsupportedRouter,
  clearError,
  clearAllErrors,
  reset,
  convertTemperatureUnit,
} = healthSlice.actions;

// Selectors
export const selectHealth = (state: { health: HealthState }) => state.health;
export const selectRouters = (state: { health: HealthState }) => state.health.routers;
export const selectNormalizedData = (state: { health: HealthState }) => state.health.normalizedData;
export const selectIsPolling = (state: { health: HealthState }) => state.health.isPolling;
export const selectLastUpdate = (state: { health: HealthState }) => state.health.lastUpdate;
export const selectErrors = (state: { health: HealthState }) => state.health.errors;
export const selectUnsupportedRouters = (state: { health: HealthState }) => state.health.unsupportedRouters;

// Get health data for a specific router
export const selectRouterHealth = (routerId: string) => 
  (state: { health: HealthState }): RouterHealth | undefined => {
    return state.health.routers[routerId];
  };

// Get normalized health data for a router
export const selectNormalizedHealth = (routerId: string) => 
  (state: { health: HealthState }): NormalizedHealth | undefined => {
    return state.health.normalizedData[routerId];
  };

// Get all routers with temperature data
export const selectRoutersWithTemperature = (state: { health: HealthState }): string[] => {
  return Object.entries(state.health.normalizedData)
    .filter(([_, health]) => health.temperature.current !== null)
    .map(([routerId]) => routerId);
};

// Get average temperature across all routers
export const selectAverageTemperature = (state: { health: HealthState }): number | null => {
  const temps = Object.values(state.health.normalizedData)
    .map(h => h.temperature.current)
    .filter(t => t !== null) as number[];
  
  if (temps.length === 0) return null;
  return temps.reduce((a, b) => a + b, 0) / temps.length;
};

// Get hottest router
export const selectHottestRouter = (state: { health: HealthState }): { routerId: string; temperature: number } | null => {
  let hottest: { routerId: string; temperature: number } | null = null;
  
  Object.entries(state.health.normalizedData).forEach(([routerId, health]) => {
    if (health.temperature.current !== null) {
      if (!hottest || health.temperature.current > hottest.temperature) {
        hottest = { routerId, temperature: health.temperature.current };
      }
    }
  });
  
  return hottest;
};

// Check if any router is in critical state
export const selectHasAnyCritical = (state: { health: HealthState }): boolean => {
  return Object.values(state.health.normalizedData)
    .some(h => h.temperature.status === 'critical');
};

// Check if specific router supports health
export const selectIsRouterSupported = (routerId: string) => 
  (state: { health: HealthState }): boolean => {
    return !state.health.unsupportedRouters.includes(routerId);
  };

export default healthSlice.reducer;