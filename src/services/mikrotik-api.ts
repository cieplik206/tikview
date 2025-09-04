interface PreviousReading {
  rxBytes: number;
  txBytes: number;
}

interface InterfaceStats {
  name: string;
  rxBitsPerSecond: number;
  txBitsPerSecond: number;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  running: boolean;
  type: string;
}

interface SystemInfo {
  resource: any;
  identity: any;
  routerboard: any | null;
}

interface TestConnectionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class MikrotikAPI {
  private authToken: string;
  private baseURL: string;
  private useProxy: boolean;
  private previousReadings: Record<string, PreviousReading>;
  private previousTime: number | null;

  constructor(username: string, password: string) {
    this.authToken = btoa(`${username}:${password}`);
    
    const isDevelopment = import.meta.env.DEV;
    
    if (isDevelopment) {
      // In development, always use the proxy
      this.baseURL = 'http://localhost:3001/api';
      this.useProxy = true;
    } else {
      // In production, the dashboard is hosted on the MikroTik router itself
      this.baseURL = '/rest';
      this.useProxy = false;
    }
    
    this.previousReadings = {};
    this.previousTime = null;
  }

  async request<T = any>(path: string, method: string = 'GET', data: any = null): Promise<T> {
    const options: RequestInit = {
      method: method,
      headers: {
        'Authorization': `Basic ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      cache: 'reload' // Force browser to bypass cache
    };
    
    if (this.useProxy || !this.baseURL.startsWith('/')) {
      options.mode = 'cors';
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const url = `${this.baseURL}${path}`;
      const response = await fetch(url, options);
      
      if (!response.ok) {
        // Handle 401 Unauthorized - clear auth and redirect to login
        if (response.status === 401) {
          // Import handleApiError dynamically to avoid circular dependency
          const { handleApiError } = await import('../utils/apiUtils');
          handleApiError({ status: 401 });
          
          throw new Error('Unauthorized - Please login again');
        }
        
        // Try to get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          if (errorData.detail) {
            errorMessage += `: ${errorData.detail}`;
          }
        } catch (e) {
          // If we can't parse JSON, use status text
          if (response.statusText) {
            errorMessage = `${response.status}: ${response.statusText}`;
          }
        }
        
        // Include status code in error for permission checking
        const error = new Error(errorMessage) as any;
        error.status = response.status;
        throw error;
      }
      
      // Handle empty responses (like DELETE operations)
      const text = await response.text();
      if (!text) {
        return {} as T;
      }
      
      return JSON.parse(text);
    } catch (error) {
      // Don't log to console.error, just throw the error
      // The calling code will handle logging if needed
      throw error;
    }
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      const interfaces = await this.request('/interface');
      return { success: true, data: interfaces };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getSystemInfo(includeRouterboard: boolean = false): Promise<SystemInfo> {
    try {
      const requests: Promise<any>[] = [
        this.request('/system/resource'),
        this.request('/system/identity')
      ];
      
      // Only request routerboard info if explicitly needed and available
      if (includeRouterboard) {
        requests.push(this.request('/system/routerboard').catch(() => null));
      }
      
      const results = await Promise.all(requests);
      const [resource, identity, routerboard] = results;
      
      return {
        resource: resource[0] || resource,
        identity: identity[0] || identity,
        routerboard: routerboard?.[0] || routerboard || null
      };
    } catch (error: any) {
      throw new Error(`Failed to get system info: ${error.message}`);
    }
  }

  async getInterfaces(): Promise<any[]> {
    return this.request('/interface');
  }

  async getInterfaceStats(interfaceName: string): Promise<InterfaceStats | null> {
    const interfaces = await this.request<any[]>('/interface');
    const iface = interfaces.find(i => i.name === interfaceName);
    
    if (iface) {
      const currentTime = Date.now();
      const currentRxBytes = parseInt(iface['rx-byte'] || '0', 10);
      const currentTxBytes = parseInt(iface['tx-byte'] || '0', 10);
      
      let rxBitsPerSecond = 0;
      let txBitsPerSecond = 0;
      
      if (this.previousReadings[interfaceName] && this.previousTime) {
        const timeDiffSeconds = (currentTime - this.previousTime) / 1000;
        
        if (timeDiffSeconds > 0) {
          const rxBytesDiff = currentRxBytes - this.previousReadings[interfaceName].rxBytes;
          const txBytesDiff = currentTxBytes - this.previousReadings[interfaceName].txBytes;
          
          rxBitsPerSecond = (rxBytesDiff * 8) / timeDiffSeconds;
          txBitsPerSecond = (txBytesDiff * 8) / timeDiffSeconds;
        }
      }
      
      this.previousReadings[interfaceName] = {
        rxBytes: currentRxBytes,
        txBytes: currentTxBytes
      };
      this.previousTime = currentTime;
      
      return {
        name: interfaceName,
        rxBitsPerSecond,
        txBitsPerSecond,
        rxBytes: currentRxBytes,
        txBytes: currentTxBytes,
        rxPackets: parseInt(iface['rx-packet'] || '0', 10),
        txPackets: parseInt(iface['tx-packet'] || '0', 10),
        running: iface.running === 'true',
        type: iface.type
      };
    }
    
    return null;
  }
}