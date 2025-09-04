import React, { useMemo } from 'react';
import { Monitor, CheckCircle } from 'lucide-react';
import { BaseCard } from '../ui/BaseCard';
import { StatusBadge } from '../ui';
import { 
  useSystemResources, 
  useSystemHealth,
  useSystemIdentity 
} from '../../hooks/useMikrotikQuery';

interface SystemMetric {
  label: string;
  value: string;
  subtext?: string;
  customClass?: string;
}

interface HealthCheck {
  name: string;
  ok: boolean;
}

const SystemStatus: React.FC = () => {
  // Use TanStack Query hooks to fetch data
  const { data: resources, error: resourceError, isLoading: resourcesLoading } = useSystemResources();
  
  const { data: health, error: healthError } = useSystemHealth();

  const { data: identity } = useSystemIdentity();

  // Format memory values
  const formatMemory = (bytes: number): string => {
    if (!bytes && bytes !== 0) return '0MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${Math.round(mb)}MB`;
    } else {
      return `${(mb / 1024).toFixed(1)}GB`;
    }
  };

  // Format uptime string
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

  // Calculate temperature display
  const temperatureDisplay = useMemo(() => {
    if (health && health.length > 0) {
      const tempMetric = health.find((m: any) => m.name === 'cpu-temperature');
      
      if (tempMetric) {
        const temp = parseFloat(tempMetric.value);
        let color = 'text-success'; // normal
        let status = 'Optimal';
        
        if (temp >= 60 && temp < 70) {
          color = 'text-warning';
          status = 'Warm';
        } else if (temp >= 70 && temp < 80) {
          color = 'text-warning';
          status = 'Hot';
        } else if (temp >= 80) {
          color = 'text-error';
          status = 'Critical';
        }
        
        return {
          value: `${temp}°C`,
          subtext: status,
          color
        };
      }
    }
    
    // Check if health monitoring failed or not supported
    if (healthError) {
      return {
        value: 'N/A',
        subtext: 'Not Supported',
        color: 'text-base-content/50'
      };
    }
    
    return {
      value: '--',
      subtext: 'Loading...',
      color: 'text-base-content/50'
    };
  }, [health, healthError]);

  // Calculate metrics from resources data
  const metrics: SystemMetric[] = useMemo(() => {
    if (!resources) {
      return [
        { label: 'CPU Usage', value: '0%', subtext: 'Loading...' },
        { label: 'Memory', value: '0%', subtext: 'Loading...' },
        { label: 'Temperature', value: '--', subtext: 'Loading...' },
        { label: 'Uptime', value: 'N/A', subtext: 'Loading...' }
      ];
    }

    const cpuLoad = parseInt(String(resources['cpu-load'] || '0'));
    const cpuCount = parseInt(String(resources['cpu-count'] || '1'));
    const cpuFreq = parseInt(String(resources['cpu-frequency'] || '0'));
    
    const totalMem = parseInt(String(resources['total-memory'] || '0'));
    const freeMem = parseInt(String(resources['free-memory'] || '0'));
    const usedMem = totalMem - freeMem;
    const memoryPercentage = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;

    const cpuInfo = cpuCount && cpuFreq 
      ? `${cpuCount} cores at ${(cpuFreq / 1000).toFixed(1)}GHz`
      : cpuCount 
        ? `${cpuCount} cores`
        : '';

    return [
      { 
        label: 'CPU Usage', 
        value: `${cpuLoad}%`, 
        subtext: cpuInfo || 'Loading...'
      },
      { 
        label: 'Memory', 
        value: `${memoryPercentage}%`, 
        subtext: `${formatMemory(usedMem)} / ${formatMemory(totalMem)}`
      },
      { 
        label: 'Temperature', 
        value: temperatureDisplay.value, 
        subtext: temperatureDisplay.subtext,
        customClass: temperatureDisplay.color
      },
      { 
        label: 'Uptime', 
        value: formatUptime(resources.uptime || ''), 
        subtext: 'Since last restart'
      }
    ];
  }, [resources, temperatureDisplay]);

  // Calculate health checks
  const healthChecks: HealthCheck[] = useMemo(() => {
    if (!resources) {
      return [
        { name: 'CPU', ok: true },
        { name: 'Memory', ok: true },
        { name: 'Temp', ok: true },
        { name: 'Network', ok: true },
        { name: 'Firewall', ok: true },
        { name: 'DNS', ok: true }
      ];
    }

    const cpuLoad = parseInt(String(resources['cpu-load'] || '0'));
    const totalMem = parseInt(String(resources['total-memory'] || '0'));
    const freeMem = parseInt(String(resources['free-memory'] || '0'));
    const memoryPercentage = totalMem > 0 ? Math.round(((totalMem - freeMem) / totalMem) * 100) : 0;
    
    const tempOk = temperatureDisplay.value === 'N/A' || 
                   (temperatureDisplay.subtext !== 'Hot' && 
                    temperatureDisplay.subtext !== 'Critical');

    return [
      { name: 'CPU', ok: cpuLoad < 80 },
      { name: 'Memory', ok: memoryPercentage < 90 },
      { name: 'Temp', ok: tempOk },
      { name: 'Network', ok: true },
      { name: 'Firewall', ok: true },
      { name: 'DNS', ok: true }
    ];
  }, [resources, temperatureDisplay]);

  // Calculate system health
  const systemHealth = useMemo(() => {
    if (!resources) {
      return { status: 'success' as const, label: 'Optimal' };
    }

    const cpuLoad = parseInt(String(resources['cpu-load'] || '0'));
    const totalMem = parseInt(String(resources['total-memory'] || '0'));
    const freeMem = parseInt(String(resources['free-memory'] || '0'));
    const memoryPercentage = totalMem > 0 ? Math.round(((totalMem - freeMem) / totalMem) * 100) : 0;

    if (cpuLoad > 80 || memoryPercentage > 90) {
      return { status: 'error' as const, label: 'Critical' };
    } else if (cpuLoad > 60 || memoryPercentage > 75) {
      return { status: 'warning' as const, label: 'Warning' };
    } else {
      return { status: 'success' as const, label: 'Optimal' };
    }
  }, [resources]);

  if (resourceError) {
    return (
      <BaseCard icon={Monitor} title="System Status" delay={400}>
        <div className="text-center text-error">
          Failed to load system status
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard icon={Monitor} title="System Status" delay={400}>
      <div className="grid grid-cols-2 gap-5">
        {metrics.map((metric, index) => (
          <div key={metric.label}>
            <div className="text-sm text-base-content/70 mb-2">{metric.label}</div>
            <div 
              className={`text-3xl font-bold ${
                metric.customClass || 'bg-gradient-to-r from-white to-base-content bg-clip-text text-transparent'
              }`}
            >
              {resourcesLoading && index === 0 ? 'Loading...' : metric.value}
            </div>
            {metric.subtext && (
              <div className="text-xs text-base-content/70 mt-1">
                {metric.subtext}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-5 pt-5 border-t border-base-content/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-base-content/70">System Health</span>
          <StatusBadge variant={systemHealth.status} size="sm">
            {systemHealth.label}
          </StatusBadge>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {healthChecks.map((check) => (
            <div
              key={check.name}
              className="flex items-center gap-2 text-xs"
            >
              <CheckCircle 
                className={`w-3 h-3 ${
                  check.ok ? 'text-success' : 'text-error'
                }`}
              />
              <span className="text-base-content/70">{check.name}</span>
            </div>
          ))}
        </div>
      </div>
    </BaseCard>
  );
};

export default SystemStatus;