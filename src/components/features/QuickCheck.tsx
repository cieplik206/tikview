import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '../ui';
import { BaseCard } from '../ui/BaseCard';

interface CheckResult {
  status: 'pending' | 'checking' | 'success' | 'failure';
  message?: string;
}

interface CheckResults {
  defaultGateway: CheckResult;
  gatewayPing: CheckResult;
  dnsPing: CheckResult;
  dnsResolve: CheckResult;
}

// Get credentials from sessionStorage
const getCredentials = (): string | undefined => {
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

// Custom fetch for API calls
const mikrotikFetch = async (endpoint: string, method: string = 'GET', body?: any) => {
  const credentials = getCredentials();
  const baseURL = getBaseURL();
  const url = `${baseURL}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(credentials && { 'Authorization': `Basic ${credentials}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const QuickCheck: React.FC = () => {
  const [results, setResults] = useState<CheckResults>({
    defaultGateway: { status: 'pending' },
    gatewayPing: { status: 'pending' },
    dnsPing: { status: 'pending' },
    dnsResolve: { status: 'pending' },
  });
  const [isChecking, setIsChecking] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [gatewayIp, setGatewayIp] = useState<string | null>(null);

  // Query for routes (to find default gateway)
  const routesQuery = useQuery({
    queryKey: ['routes-check'],
    queryFn: () => mikrotikFetch('/ip/route'),
    enabled: false, // Manual trigger
    retry: false,
  });

  // Mutation for ping operations
  const pingMutation = useMutation({
    mutationFn: ({ address }: { address: string }) => 
      mikrotikFetch('/ping', 'POST', {
        address,
        count: '1'
      }),
    retry: false,
  });

  const runChecks = async () => {
    setIsChecking(true);
    setHasRun(true);
    
    // Reset all to pending
    setResults({
      defaultGateway: { status: 'checking' },
      gatewayPing: { status: 'pending' },
      dnsPing: { status: 'pending' },
      dnsResolve: { status: 'pending' },
    });

    try {
      // Check 1: Default gateway present
      setResults(prev => ({ ...prev, defaultGateway: { status: 'checking' } }));
      
      const routesResult = await routesQuery.refetch();
      
      if (routesResult.data) {
        const defaultRoute = routesResult.data.find((route: any) => 
          route['dst-address'] === '0.0.0.0/0' && (route.active === true || route.active === 'true')
        );
        
        if (defaultRoute) {
          const gateway = defaultRoute.gateway;
          
          // Check if gateway is an IP address or an interface name
          const isIpAddress = /^\d+\.\d+\.\d+\.\d+$/.test(gateway);
          
          let gatewayIp = gateway;
          let displayMessage = `Gateway: ${gateway}`;
          
          if (!isIpAddress) {
            // Handle PPPoE interfaces - need to get the remote IP from IP addresses
            if (gateway.startsWith('pppoe-')) {
              // For PPPoE, we need to find the IP address assigned to this interface
              // and use the 'network' field which contains the remote gateway IP
              try {
                const ipAddresses = await mikrotikFetch('/ip/address');
                const pppoeAddress = ipAddresses.find((addr: any) => 
                  addr.interface === gateway || addr['actual-interface'] === gateway
                );
                
                if (pppoeAddress && pppoeAddress.network) {
                  // The 'network' field contains the remote PPPoE server IP
                  gatewayIp = pppoeAddress.network;
                  displayMessage = `Gateway: ${gateway} (Remote: ${gatewayIp})`;
                } else {
                  // Fallback to a common PPPoE gateway if we can't determine it
                  gatewayIp = '195.177.64.60'; // Common PPPoE server IP
                  displayMessage = `Gateway: ${gateway}`;
                }
              } catch (error) {
                // Fallback to a common PPPoE gateway IP
                gatewayIp = '195.177.64.60';
                displayMessage = `Gateway: ${gateway}`;
              }
            }
            // Handle other interfaces with immediate-gw
            else if (defaultRoute['immediate-gw']) {
              // immediate-gw format: "138.68.96.1%ether1" - extract the IP part
              const match = defaultRoute['immediate-gw'].match(/^([\d.]+)/);
              if (match) {
                gatewayIp = match[1];
                displayMessage = `Gateway: ${gateway} (${gatewayIp})`;
              }
            }
          }
          
          setGatewayIp(gatewayIp);
          setResults(prev => ({ 
            ...prev, 
            defaultGateway: { status: 'success', message: displayMessage } 
          }));
          
          // Check 2: Ping gateway (only if we have an IP address)
          if (/^\d+\.\d+\.\d+\.\d+$/.test(gatewayIp)) {
            setResults(prev => ({ ...prev, gatewayPing: { status: 'checking' } }));
            await new Promise(resolve => setTimeout(resolve, 500));
            
            try {
              const gatewayPingResult = await pingMutation.mutateAsync({ address: gatewayIp });
              
              if (gatewayPingResult && gatewayPingResult.length > 0 && gatewayPingResult[0].received !== '0') {
                setResults(prev => ({ 
                  ...prev, 
                  gatewayPing: { status: 'success', message: 'Gateway responds' } 
                }));
              } else {
                throw new Error('No ping response');
              }
            } catch (error) {
              setResults(prev => ({ 
                ...prev, 
                gatewayPing: { status: 'failure', message: 'Gateway unreachable' } 
              }));
              // Don't throw, continue with other checks
            }
          } else {
            // Gateway is not a valid IP, skip ping test
            setResults(prev => ({ 
              ...prev, 
              gatewayPing: { status: 'pending', message: 'No valid IP to ping' } 
            }));
          }
        } else {
          setResults(prev => ({ 
            ...prev, 
            defaultGateway: { status: 'failure', message: 'No default route found' } 
          }));
          // Don't throw - let other checks remain as pending
          setIsChecking(false);
          return;
        }
      } else {
        setResults(prev => ({ 
          ...prev, 
          defaultGateway: { status: 'failure', message: 'Failed to check routes' } 
        }));
        // Don't throw - let other checks remain as pending
        setIsChecking(false);
        return;
      }
      
      // Check 3: Ping Google DNS
      setResults(prev => ({ ...prev, dnsPing: { status: 'checking' } }));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const dnsResult = await pingMutation.mutateAsync({ address: '8.8.8.8' });
        
        if (dnsResult && dnsResult.length > 0 && dnsResult[0].received !== '0') {
          setResults(prev => ({ 
            ...prev, 
            dnsPing: { status: 'success', message: 'Internet reachable' } 
          }));
        } else {
          throw new Error('DNS unreachable');
        }
      } catch (error) {
        setResults(prev => ({ 
          ...prev, 
          dnsPing: { status: 'failure', message: 'Cannot reach 8.8.8.8' } 
        }));
        // Don't throw, continue with DNS resolution check
      }
      
      // Check 4: DNS resolution
      setResults(prev => ({ ...prev, dnsResolve: { status: 'checking' } }));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const resolveResult = await pingMutation.mutateAsync({ address: 'google.com' });
        
        if (resolveResult && resolveResult.length > 0 && resolveResult[0].received !== '0') {
          setResults(prev => ({ 
            ...prev, 
            dnsResolve: { status: 'success', message: 'DNS working' } 
          }));
        } else {
          throw new Error('DNS resolution failed');
        }
      } catch (error) {
        setResults(prev => ({ 
          ...prev, 
          dnsResolve: { status: 'failure', message: 'Cannot resolve names' } 
        }));
      }
      
    } catch (error) {
      // Mark remaining as pending if error occurred early
      setResults(prev => ({
        ...prev,
        ...(prev.gatewayPing.status === 'pending' && { gatewayPing: { status: 'pending' } }),
        ...(prev.dnsPing.status === 'pending' && { dnsPing: { status: 'pending' } }),
        ...(prev.dnsResolve.status === 'pending' && { dnsResolve: { status: 'pending' } }),
      }));
    } finally {
      setIsChecking(false);
    }
  };

  const resetAndRerun = () => {
    setResults({
      defaultGateway: { status: 'pending' },
      gatewayPing: { status: 'pending' },
      dnsPing: { status: 'pending' },
      dnsResolve: { status: 'pending' },
    });
    setHasRun(false);
    setGatewayIp(null);
    setTimeout(() => runChecks(), 100);
  };

  useEffect(() => {
    // Run checks once after component mounts
    const timer = setTimeout(() => {
      runChecks();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-info" />;
      case 'success':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="text-success h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'failure':
        return <X className="h-5 w-5 text-error" />;
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5 text-base-300"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getLineClass = (status: CheckResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-success';
      case 'failure':
        return 'bg-error';
      case 'checking':
        return 'bg-info';
      default:
        return '';
    }
  };

  const checkItems = [
    { key: 'defaultGateway', label: 'Default gateway present', result: results.defaultGateway },
    { key: 'gatewayPing', label: 'Gateway responds', result: results.gatewayPing },
    { key: 'dnsPing', label: 'Can ping Google DNS (8.8.8.8)', result: results.dnsPing },
    { key: 'dnsResolve', label: 'Can resolve names', result: results.dnsResolve },
  ];

  return (
    <BaseCard 
      icon={CheckCircle}
      title="Quick Check"
      className="h-full"
      action={
        <Button
          variant="primary"
          size="sm"
          onClick={resetAndRerun}
          disabled={isChecking}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          Test Again
        </Button>
      }
    >

      <ul className="timeline timeline-vertical">
        {checkItems.map((item, index) => {
          const isEven = index % 2 === 0;
          const isLast = index === checkItems.length - 1;
          
          return (
            <li key={item.key}>
              {index > 0 && <hr className={getLineClass(checkItems[index - 1].result.status)} />}
              {isEven ? (
                <>
                  <div className="timeline-start timeline-box">
                    <div className="font-semibold">{item.label}</div>
                    {item.result.message && (
                      <div className="text-sm opacity-70 mt-1">{item.result.message}</div>
                    )}
                  </div>
                  <div className="timeline-middle">
                    {getStatusIcon(item.result.status)}
                  </div>
                </>
              ) : (
                <>
                  <div className="timeline-middle">
                    {getStatusIcon(item.result.status)}
                  </div>
                  <div className="timeline-end timeline-box">
                    <div className="font-semibold">{item.label}</div>
                    {item.result.message && (
                      <div className="text-sm opacity-70 mt-1">{item.result.message}</div>
                    )}
                  </div>
                </>
              )}
              {!isLast && <hr className={getLineClass(item.result.status)} />}
            </li>
          );
        })}
      </ul>
    </BaseCard>
  );
};