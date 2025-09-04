import React from 'react';
import { 
  Heart, 
  Thermometer, 
  Cpu, 
  MemoryStick, 
  HardDrive,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { BaseCard } from '../ui/BaseCard';
import { StatusBadge } from '../ui/StatusBadge';
import { useSystemResources, useSystemHealth } from '../../hooks/useMikrotikQuery';

interface Props {
  title?: string;
  delay?: number;
}

interface HealthMetricProps {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  status: 'good' | 'warning' | 'critical' | 'unknown';
  threshold?: string;
}

const HealthMetric: React.FC<HealthMetricProps> = ({ 
  icon: Icon, 
  label, 
  value, 
  unit = '', 
  status,
  threshold 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'text-success';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-error';
      default: return 'text-base-content/60';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'critical': return <XCircle className="w-4 h-4 text-error" />;
      default: return <AlertTriangle className="w-4 h-4 text-base-content/40" />;
    }
  };

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${getStatusColor()}`} />
            <span className="text-sm font-medium">{label}</span>
          </div>
          {getStatusIcon()}
        </div>
        
        <div className="flex items-baseline gap-1 mb-1">
          <span className={`text-2xl font-bold ${getStatusColor()}`}>
            {value}
          </span>
          {unit && (
            <span className="text-sm text-base-content/60">{unit}</span>
          )}
        </div>
        
        {threshold && (
          <div className="text-xs text-base-content/50">
            Threshold: {threshold}
          </div>
        )}
      </div>
    </div>
  );
};

export const SystemHealth: React.FC<Props> = ({ 
  title = "System Health", 
  delay = 150 
}) => {
  const { data: systemResource, isLoading: loadingResource } = useSystemResources();
  const { data: healthDataRaw, isLoading: loadingHealth } = useSystemHealth();
  
  // Ensure healthData is always an array
  const healthData = Array.isArray(healthDataRaw) ? healthDataRaw : [];

  // Calculate derived metrics
  const cpuLoad = systemResource?.['cpu-load'] || 0;
  const totalMemory = systemResource?.['total-memory'] || 0;
  const freeMemory = systemResource?.['free-memory'] || 0;
  const usedMemory = totalMemory - freeMemory;
  const memoryPercentage = totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 100) : 0;

  // Format memory values
  const formatMemory = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  // Get temperature from health data
  const temperatureMetric = healthData.find(metric => 
    metric.type === 'C' && metric.name?.toLowerCase().includes('temp')
  );
  const temperature = temperatureMetric ? parseInt(temperatureMetric.value) : null;

  // Get voltage metrics
  const voltageMetrics = healthData.filter(metric => metric.type === 'V');

  // Determine health status
  const getHealthStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'good';
  };

  const getTemperatureStatus = (temp: number) => {
    if (temp >= 80) return 'critical';
    if (temp >= 65) return 'warning';
    return 'good';
  };

  const uptime = systemResource?.uptime || '0s';
  const formatUptime = (uptimeStr: string) => {
    // Parse MikroTik uptime format
    const match = uptimeStr.match(/(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
    if (!match) return uptimeStr;
    
    const [, weeks, days, hours, minutes] = match;
    const parts = [];
    
    if (weeks) parts.push(`${weeks}w`);
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes && !weeks) parts.push(`${minutes}m`);
    
    return parts.join(' ') || uptimeStr;
  };

  // Overall system health
  const criticalIssues = [
    cpuLoad > 90 && 'CPU overload',
    memoryPercentage > 95 && 'Memory critical',
    temperature && temperature > 80 && 'Temperature critical'
  ].filter(Boolean);

  const warnings = [
    cpuLoad > 75 && cpuLoad <= 90 && 'CPU high',
    memoryPercentage > 85 && memoryPercentage <= 95 && 'Memory high',
    temperature && temperature > 65 && temperature <= 80 && 'Temperature elevated'
  ].filter(Boolean);

  const overallStatus = criticalIssues.length > 0 ? 'critical' : 
                       warnings.length > 0 ? 'warning' : 'good';

  const getOverallStatusLabel = () => {
    if (criticalIssues.length > 0) return 'Critical';
    if (warnings.length > 0) return 'Warning';
    return 'Healthy';
  };

  const getOverallStatusVariant = (): "success" | "warning" | "error" => {
    switch (overallStatus) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      default: return 'success';
    }
  };

  if (loadingResource && loadingHealth) {
    return (
      <BaseCard
        icon={Heart}
        title={title}
        delay={delay}
      >
        <div className="text-center py-8">
          <div className="loading loading-spinner loading-md"></div>
          <p className="text-sm text-base-content/60 mt-2">Loading system health...</p>
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard
      icon={Heart}
      title={title}
      delay={delay}
      action={
        <StatusBadge variant={getOverallStatusVariant()} size="sm">
          {getOverallStatusLabel()}
        </StatusBadge>
      }
    >
      <div className="space-y-4">
        {/* Overall Status Summary */}
        <div className="card bg-base-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">System Overview</h3>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-base-content/60" />
              <span className="text-sm">Uptime: {formatUptime(uptime)}</span>
            </div>
          </div>
          
          {criticalIssues.length > 0 && (
            <div className="alert alert-error mb-2">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">Critical issues detected: {criticalIssues.join(', ')}</span>
            </div>
          )}
          
          {warnings.length > 0 && !criticalIssues.length && (
            <div className="alert alert-warning mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Warnings: {warnings.join(', ')}</span>
            </div>
          )}
          
          {overallStatus === 'good' && (
            <div className="alert alert-success">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">All systems operating normally</span>
            </div>
          )}
        </div>

        {/* Health Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <HealthMetric
            icon={Cpu}
            label="CPU Load"
            value={cpuLoad.toString()}
            unit="%"
            status={getHealthStatus(cpuLoad, { warning: 75, critical: 90 })}
            threshold="< 75%"
          />
          
          <HealthMetric
            icon={MemoryStick}
            label="Memory"
            value={memoryPercentage.toString()}
            unit="%"
            status={getHealthStatus(memoryPercentage, { warning: 85, critical: 95 })}
            threshold="< 85%"
          />
          
          {temperature !== null && (
            <HealthMetric
              icon={Thermometer}
              label="Temperature"
              value={temperature.toString()}
              unit="°C"
              status={getTemperatureStatus(temperature)}
              threshold="< 65°C"
            />
          )}
          
          <HealthMetric
            icon={HardDrive}
            label="Free Memory"
            value={formatMemory(freeMemory)}
            status={freeMemory > totalMemory * 0.15 ? 'good' : 
                    freeMemory > totalMemory * 0.05 ? 'warning' : 'critical'}
            threshold="> 15%"
          />
          
          {voltageMetrics.slice(0, 2).map((voltage, index) => (
            <HealthMetric
              key={voltage['.id'] || `voltage-${index}`}
              icon={Zap}
              label={voltage.name || `Voltage ${index + 1}`}
              value={voltage.value}
              unit="V"
              status="good" // Would need thresholds for proper status
            />
          ))}
        </div>

        {/* Detailed Health Data */}
        {healthData.length > 0 && (
          <details className="collapse collapse-arrow bg-base-200">
            <summary className="collapse-title text-sm font-medium">
              Advanced Health Metrics ({healthData.length} sensors)
            </summary>
            <div className="collapse-content">
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Sensor</th>
                      <th>Value</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {healthData.map((metric, index) => (
                      <tr key={metric['.id'] || `health-metric-${index}`}>
                        <td className="font-medium">{metric.name}</td>
                        <td className="font-mono">
                          {metric.value} {metric.type === 'C' ? '°C' : 
                                       metric.type === 'V' ? 'V' :
                                       metric.type === 'W' ? 'W' :
                                       metric.type === '%' ? '%' :
                                       metric.type === 'rpm' ? 'rpm' : ''}
                        </td>
                        <td>
                          <span className="badge badge-sm">
                            {metric.type === 'C' ? 'Temperature' :
                             metric.type === 'V' ? 'Voltage' :
                             metric.type === 'W' ? 'Power' :
                             metric.type === '%' ? 'Percentage' :
                             metric.type === 'rpm' ? 'Fan Speed' : metric.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        )}
      </div>
    </BaseCard>
  );
};