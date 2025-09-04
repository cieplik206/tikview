import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Activity, Play, Pause, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { BaseCard } from '../ui/BaseCard';
import { StatusBadge } from '../ui/StatusBadge';
import { useInterfaces, useInterfaceStats, useMikrotikQuery } from '../../hooks/useMikrotikQuery';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrafficDataPoint {
  timestamp: string;
  rxMbps: number;
  txMbps: number;
}

interface Props {
  title?: string;
  subtitle?: string;
  delay?: number;
}

export const TrafficChart: React.FC<Props> = ({ 
  title = "Network Traffic", 
  subtitle = "Real-time bandwidth monitoring",
  delay = 100 
}) => {
  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>([]);
  const [previousStats, setPreviousStats] = useState<{[key: string]: any}>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // API queries
  const { data: interfaces = [] } = useInterfaces();
  const { data: interfaceStats, refetch: refetchStats } = useInterfaceStats();
  const { data: routes = [] } = useMikrotikQuery('/ip/route');

  // Get available interfaces for monitoring
  const availableInterfaces = useMemo(() => {
    return interfaces.filter(iface => 
      iface.type === 'ether' || 
      iface.type === 'bridge' || 
      iface.type === 'vlan' || 
      iface.type === 'pppoe-out'
    );
  }, [interfaces]);

  // Current interface for monitoring
  const currentInterface = useMemo(() => {
    if (selectedInterface) {
      return selectedInterface;
    }
    
    // Auto-detect WAN interface by checking default route first
    const defaultRoute = routes.find((route: any) => 
      route['dst-address'] === '0.0.0.0/0' && 
      (route.active === true || route.active === 'true')
    );
    
    if (defaultRoute && defaultRoute.gateway) {
      // Check if gateway is an interface name (like pppoe-out1)
      const isInterfaceName = !/^\d+\.\d+\.\d+\.\d+$/.test(defaultRoute.gateway);
      if (isInterfaceName) {
        // Gateway is an interface name, use it directly
        const wanInterface = availableInterfaces.find(iface => 
          iface.name === defaultRoute.gateway
        );
        if (wanInterface) {
          return wanInterface.name;
        }
      }
    }
    
    // Fallback: Try to find by common WAN patterns
    const wanInterface = availableInterfaces.find(iface => 
      iface.name.toLowerCase().includes('wan') ||
      iface.name.toLowerCase().includes('ether1') ||
      (iface.type === 'pppoe-out' && iface.running)
    );
    
    return wanInterface?.name || availableInterfaces[0]?.name || '';
  }, [selectedInterface, availableInterfaces, routes]);

  // Calculate current speeds from latest data
  const currentDownload = useMemo(() => {
    return trafficData.length > 0 ? trafficData[trafficData.length - 1].rxMbps.toFixed(1) : '0.0';
  }, [trafficData]);

  const currentUpload = useMemo(() => {
    return trafficData.length > 0 ? trafficData[trafficData.length - 1].txMbps.toFixed(1) : '0.0';
  }, [trafficData]);

  // Calculate peak speeds
  const peakDownload = useMemo(() => {
    return trafficData.length > 0 ? Math.max(...trafficData.map(d => d.rxMbps)).toFixed(1) : '0.0';
  }, [trafficData]);

  const peakUpload = useMemo(() => {
    return trafficData.length > 0 ? Math.max(...trafficData.map(d => d.txMbps)).toFixed(1) : '0.0';
  }, [trafficData]);

  // Calculate average speeds
  const avgDownload = useMemo(() => {
    if (trafficData.length === 0) return '0.0';
    const sum = trafficData.reduce((acc, d) => acc + d.rxMbps, 0);
    return (sum / trafficData.length).toFixed(1);
  }, [trafficData]);

  const avgUpload = useMemo(() => {
    if (trafficData.length === 0) return '0.0';
    const sum = trafficData.reduce((acc, d) => acc + d.txMbps, 0);
    return (sum / trafficData.length).toFixed(1);
  }, [trafficData]);

  // Calculate total transferred (approximate)
  const totalDownload = useMemo(() => {
    if (trafficData.length === 0) return '0.0';
    const totalMB = trafficData.reduce((sum, point) => sum + (point.rxMbps / 8), 0);
    return totalMB.toFixed(1);
  }, [trafficData]);

  const totalUpload = useMemo(() => {
    if (trafficData.length === 0) return '0.0';
    const totalMB = trafficData.reduce((sum, point) => sum + (point.txMbps / 8), 0);
    return totalMB.toFixed(1);
  }, [trafficData]);

  // Chart data with line styling
  const chartData: ChartData<'line'> = useMemo(() => ({
    labels: trafficData.map(d => d.timestamp),
    datasets: [
      {
        label: 'Download',
        data: trafficData.map(d => d.rxMbps),
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgb(255, 159, 64)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'Upload',
        data: trafficData.map(d => d.txMbps),
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  }), [trafficData]);

  // Chart options with sliding animation
  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Disable value animations
      onComplete: () => {
        // Animation complete callback if needed
      },
    },
    transitions: {
      active: {
        animation: {
          duration: 0
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(160, 160, 160, 0.8)',
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(40, 40, 40, 0.95)',
        titleColor: 'rgba(160, 160, 160, 0.9)',
        bodyColor: 'rgba(160, 160, 160, 0.9)',
        borderColor: 'rgba(60, 60, 60, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} Mbps`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(160, 160, 160, 0.7)',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(60, 60, 60, 0.3)',
        },
        ticks: {
          color: 'rgba(160, 160, 160, 0.7)',
          callback: (value) => `${value} Mbps`,
        },
      },
    },
  }), []);

  // Update traffic data from interface stats
  const updateTrafficData = useCallback(() => {
    if (!interfaceStats || !currentInterface) return;

    const currentStats = interfaceStats.find(stat => stat.name === currentInterface);
    if (!currentStats) return;

    const now = new Date().toLocaleTimeString();
    const rxBytes = parseInt(currentStats['rx-byte'] || '0');
    const txBytes = parseInt(currentStats['tx-byte'] || '0');

    setPreviousStats(prev => {
      if (prev[currentInterface]) {
        const prevRxBytes = prev[currentInterface].rxBytes;
        const prevTxBytes = prev[currentInterface].txBytes;
        const timeDiff = 1; // 1 second interval

        const rxMbps = ((rxBytes - prevRxBytes) * 8) / (1000000 * timeDiff);
        const txMbps = ((txBytes - prevTxBytes) * 8) / (1000000 * timeDiff);

        setTrafficData(prevData => {
          const newData = [...prevData, {
            timestamp: now,
            rxMbps: Math.max(0, rxMbps),
            txMbps: Math.max(0, txMbps),
          }];
          // Keep only last 30 data points for better visualization
          return newData.slice(-30);
        });
      }
      
      return {
        ...prev,
        [currentInterface]: { rxBytes, txBytes }
      };
    });
  }, [interfaceStats, currentInterface]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsMonitoring(true);
    intervalRef.current = setInterval(() => {
      refetchStats();
    }, 1000);
  }, [refetchStats]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  // Clear data
  const clearData = useCallback(() => {
    setTrafficData([]);
    setPreviousStats({});
  }, []);

  // Handle interface change
  const handleInterfaceChange = useCallback((value: string) => {
    setSelectedInterface(value);
    if (isMonitoring) {
      // Reset data and restart monitoring with new interface
      clearData();
      // Clear the previous stats for the new interface
      setPreviousStats(prev => {
        const newStats = { ...prev };
        delete newStats[value];
        return newStats;
      });
    }
  }, [isMonitoring, clearData]);

  // Update traffic data when interface stats change
  useEffect(() => {
    if (isMonitoring) {
      updateTrafficData();
    }
  }, [isMonitoring, updateTrafficData]);

  // Auto-start monitoring on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startMonitoring();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty dependency - only run once on mount

  const hasData = trafficData.length > 0;

  return (
    <BaseCard
      icon={Activity}
      title={title}
      subtitle={`${subtitle}${currentInterface ? ` (${currentInterface})` : ''}`}
      delay={delay}
    >
      <div className="space-y-4">
        {/* Interface Selector and Controls */}
        <div className="flex justify-between items-center">
          <select 
            value={selectedInterface} 
            onChange={(e) => handleInterfaceChange(e.target.value)}
            className="select select-sm select-bordered"
          >
            <option value="">Auto WAN</option>
            {availableInterfaces.map((iface) => (
              <option key={iface.name} value={iface.name}>
                {iface.name} {iface.comment ? `(${iface.comment})` : ''}
              </option>
            ))}
          </select>
          
          <div className="flex gap-2">
            {!isMonitoring ? (
              <button 
                onClick={startMonitoring}
                className="btn btn-sm btn-primary"
              >
                <Play className="w-4 h-4 mr-1" />
                Start
              </button>
            ) : (
              <button 
                onClick={stopMonitoring}
                className="btn btn-sm btn-error"
              >
                <Pause className="w-4 h-4 mr-1" />
                Stop
              </button>
            )}
            <button 
              onClick={clearData}
              className="btn btn-sm btn-ghost"
              disabled={!hasData}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Current Speed Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-base-200 rounded-lg">
            <div className="text-xs opacity-60 mb-1">
              <ArrowDown className="w-3 h-3 inline mr-1" />
              Download
            </div>
            <div className="text-2xl font-bold text-primary">
              {currentDownload} Mbps
            </div>
            <div className="text-xs opacity-50 mt-1">
              Peak: {peakDownload} Mbps
            </div>
          </div>
          <div className="text-center p-3 bg-base-200 rounded-lg">
            <div className="text-xs opacity-60 mb-1">
              <ArrowUp className="w-3 h-3 inline mr-1" />
              Upload
            </div>
            <div className="text-2xl font-bold text-secondary">
              {currentUpload} Mbps
            </div>
            <div className="text-xs opacity-50 mt-1">
              Peak: {peakUpload} Mbps
            </div>
          </div>
        </div>
        
        {/* Chart Container */}
        <div className="h-80 relative overflow-hidden">
          {hasData ? (
            <div className="h-full w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm opacity-60">
                  {isMonitoring ? 'Loading...' : 'Click Start to begin monitoring'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Statistics */}
        <div className="divider"></div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-xs opacity-60">Avg Down</div>
            <div className="text-sm font-semibold">{avgDownload} Mbps</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-60">Avg Up</div>
            <div className="text-sm font-semibold">{avgUpload} Mbps</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-60">Total Down</div>
            <div className="text-sm font-semibold">{totalDownload} MB</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-60">Total Up</div>
            <div className="text-sm font-semibold">{totalUpload} MB</div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};