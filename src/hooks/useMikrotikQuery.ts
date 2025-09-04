import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { usePollingInterval } from '../contexts/PollingContext';

// Get credentials directly from sessionStorage - no caching
const getCredentialsFromSession = (): string | undefined => {
  const auth = sessionStorage.getItem('auth');
  if (auth) {
    try {
      const { credentials } = JSON.parse(auth);
      return credentials;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

// Base URL configuration
const getBaseURL = () => {
  const isDevelopment = import.meta.env.DEV;
  return isDevelopment ? 'http://localhost:3001/api' : '/rest';
};

// Custom fetch function with authentication
const mikrotikFetch = async (endpoint: string, credentials?: string, options: RequestInit = {}) => {
  const baseURL = getBaseURL();
  const url = `${baseURL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(credentials && { 'Authorization': `Basic ${credentials}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized - the auth guard will redirect to login
      throw new Error('Unauthorized - Please login again');
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Generic MikroTik Query Hook - reads credentials from sessionStorage on every call
export const useMikrotikQuery = <T = any>(
  endpoint: string,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>
) => {
  // Always get fresh credentials from sessionStorage
  const credentials = getCredentialsFromSession();
  
  return useQuery<T, Error>({
    queryKey: ['mikrotik', endpoint],
    queryFn: () => mikrotikFetch(endpoint, credentials),
    enabled: !!credentials, // Only run if authenticated
    ...options,
  });
};

// System Resource Query
export const useSystemResources = (options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>) => {
  const pollingInterval = usePollingInterval(2000); // Base: 2 seconds
  return useMikrotikQuery('/system/resource', {
    refetchInterval: pollingInterval,
    ...options,
  });
};

// System Health Query
export const useSystemHealth = (options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>) => {
  const pollingInterval = usePollingInterval(5000); // Base: 5 seconds
  return useMikrotikQuery('/system/health', {
    refetchInterval: pollingInterval,
    ...options,
  });
};

// System Identity Query - Router name rarely changes, cache for 60 seconds
export const useSystemIdentity = (options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>) => {
  return useMikrotikQuery('/system/identity', {
    staleTime: 60000, // Consider data fresh for 60 seconds
    gcTime: 300000,   // Keep in cache for 5 minutes
    refetchInterval: false, // Don't poll - only refetch when stale
    refetchOnWindowFocus: false, // Don't refetch on window focus
    ...options,
  });
};

// Interfaces Query
export const useInterfaces = (options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  const pollingInterval = usePollingInterval(3000); // Base: 3 seconds
  return useMikrotikQuery<any[]>('/interface', {
    refetchInterval: pollingInterval,
    ...options,
  });
};

// DHCP Leases Query
export const useDhcpLeases = (options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  const pollingInterval = usePollingInterval(5000); // Base: 5 seconds
  return useMikrotikQuery<any[]>('/ip/dhcp-server/lease', {
    refetchInterval: pollingInterval,
    ...options,
  });
};

// IP Addresses Query - IP configuration rarely changes
export const useIpAddresses = (options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  return useMikrotikQuery<any[]>('/ip/address', {
    staleTime: 30000, // Consider fresh for 30 seconds
    gcTime: 300000,   // Keep in cache for 5 minutes
    refetchInterval: false, // Don't poll
    ...options,
  });
};

// Firewall Rules Query - Rules rarely change
export const useFirewallRules = (options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  return useMikrotikQuery<any[]>('/ip/firewall/filter', {
    staleTime: 60000, // Consider fresh for 60 seconds
    gcTime: 300000,   // Keep in cache for 5 minutes
    refetchInterval: false, // Don't poll
    ...options,
  });
};

// Login Mutation - converts password to credentials but doesn't store them in cache
export const useLogin = (
  options?: UseMutationOptions<any, Error, { username: string; password: string }>
) => {
  return useMutation({
    mutationFn: async ({ username, password }) => {
      // Convert to credentials immediately
      const credentials = btoa(`${username}:${password}`);
      // Test the credentials by fetching identity
      const data = await mikrotikFetch('/system/identity', credentials);
      // Return success with credentials, but React Query won't cache the mutation variables
      return { success: true, data, credentials };
    },
    // Disable caching of mutation data
    gcTime: 0,
    ...options,
  });
};

// Test Connection Query (for login validation)
export const useTestConnection = (credentials: string | undefined) => {
  return useQuery({
    queryKey: ['mikrotik', 'test', credentials],
    queryFn: () => mikrotikFetch('/system/identity', credentials),
    enabled: !!credentials,
    retry: false,
  });
};

// Wireless Interfaces Query
export const useWirelessInterfaces = (options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  const pollingInterval = usePollingInterval(5000); // Base: 5 seconds
  return useMikrotikQuery<any[]>('/interface/wireless', {
    refetchInterval: pollingInterval,
    ...options,
  });
};

// WiFi Registrations Query
export const useWifiRegistrations = (options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  const pollingInterval = usePollingInterval(5000); // Base: 5 seconds
  return useMikrotikQuery<any[]>('/interface/wireless/registration-table', {
    refetchInterval: pollingInterval,
    ...options,
  });
};

// IP Routes Query - Routes rarely change
export const useIpRoutes = (options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  return useMikrotikQuery<any[]>('/ip/route', {
    staleTime: 60000, // Consider fresh for 60 seconds
    gcTime: 300000,   // Keep in cache for 5 minutes
    refetchInterval: false, // Don't poll
    ...options,
  });
};

// Connection Tracking Query
export const useConnectionTracking = (options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  const pollingInterval = usePollingInterval(5000); // Base: 5 seconds
  return useMikrotikQuery<any[]>('/ip/firewall/connection', {
    refetchInterval: pollingInterval,
    ...options,
  });
};

// Interface Stats Query
export const useInterfaceStats = (interfaceName?: string, options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  const pollingInterval = usePollingInterval(2000); // Base: 2 seconds for real-time stats
  const endpoint = interfaceName ? `/interface?name=${interfaceName}` : '/interface';
  return useMikrotikQuery<any[]>(endpoint, {
    refetchInterval: pollingInterval,
    ...options,
  });
};

// System Users Query - Cache until logout
export const useSystemUsers = (options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  return useMikrotikQuery<any[]>('/user', {
    staleTime: Infinity,     // Never consider stale
    gcTime: Infinity,        // Keep in cache forever (until logout clears it)
    refetchInterval: false,  // Never poll
    refetchOnWindowFocus: false,
    refetchOnMount: false,   // Don't refetch on mount if we have cached data
    ...options,
  });
};

// System User Groups Query - Cache until logout  
export const useSystemUserGroups = (options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) => {
  return useMikrotikQuery<any[]>('/user/group', {
    staleTime: Infinity,     // Never consider stale
    gcTime: Infinity,        // Keep in cache forever (until logout clears it)
    refetchInterval: false,  // Never poll
    refetchOnWindowFocus: false,
    refetchOnMount: false,   // Don't refetch on mount if we have cached data
    ...options,
  });
};

// Interface for user permissions
export interface UserPermissions {
  read: boolean;
  write: boolean;
  test: boolean;
  web: boolean;
  password: boolean;
  sensitive: boolean;
  api: boolean;
  romon: boolean;
  dude: boolean;
  tikapp: boolean;
  rest_api: boolean;
  ftp: boolean;
  winbox: boolean;
  reboot: boolean;
  policy: boolean;
  sniff: boolean;
  ssh: boolean;
  telnet: boolean;
  local: boolean;
}

// Get User Permissions Mutation - matches current user to group and returns permissions
export const useGetUserPermissions = (
  options?: UseMutationOptions<UserPermissions, Error, void>
) => {
  return useMutation({
    mutationFn: async () => {
      // Get current username from sessionStorage
      const auth = sessionStorage.getItem('auth');
      if (!auth) throw new Error('Not authenticated');
      
      const { username } = JSON.parse(auth);
      const credentials = getCredentialsFromSession();
      
      // Fetch users to find current user's group
      const users = await mikrotikFetch('/user', credentials);
      const currentUser = users.find((u: any) => u.name === username);
      
      if (!currentUser) {
        throw new Error(`User ${username} not found`);
      }
      
      // Fetch groups to get permissions
      const groups = await mikrotikFetch('/user/group', credentials);
      const userGroup = groups.find((g: any) => g.name === currentUser.group);
      
      if (!userGroup) {
        throw new Error(`Group ${currentUser.group} not found`);
      }
      
      // Parse MikroTik policy string into permission flags
      const policies = userGroup.policy ? userGroup.policy.split(',') : [];
      
      // Map all possible permissions to true/false
      const permissions: UserPermissions = {
        read: policies.includes('read'),
        write: policies.includes('write'),
        test: policies.includes('test'),
        web: policies.includes('web'),
        password: policies.includes('password'),
        sensitive: policies.includes('sensitive'),
        api: policies.includes('api'),
        romon: policies.includes('romon'),
        dude: policies.includes('dude'),
        tikapp: policies.includes('tikapp'),
        rest_api: policies.includes('rest-api'),
        ftp: policies.includes('ftp'),
        winbox: policies.includes('winbox'),
        reboot: policies.includes('reboot'),
        policy: policies.includes('policy'),
        sniff: policies.includes('sniff'),
        ssh: policies.includes('ssh'),
        telnet: policies.includes('telnet'),
        local: policies.includes('local'),
      };
      
      return permissions;
    },
    // Cache the result
    gcTime: Infinity, // Keep cached until logout
    ...options,
  });
};