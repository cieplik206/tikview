import React, { useState } from 'react';
import { 
  RotateCcw, 
  Wifi, 
  Shield, 
  Download, 
  Settings,
  Network,
  Clock,
  Database,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { BaseCard } from '../ui/BaseCard';
import { StatusBadge } from '../ui/StatusBadge';

interface Props {
  title?: string;
  delay?: number;
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  description: string;
  variant?: 'primary' | 'secondary' | 'warning' | 'error';
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  icon: Icon, 
  label, 
  description, 
  variant = 'primary',
  onClick, 
  loading = false,
  disabled = false
}) => {
  const getButtonClasses = () => {
    const baseClasses = "btn btn-sm flex-col h-auto py-3 min-h-[80px] transition-all duration-200";
    
    switch (variant) {
      case 'warning':
        return `${baseClasses} btn-warning hover:btn-warning/90`;
      case 'error':
        return `${baseClasses} btn-error hover:btn-error/90`;
      case 'secondary':
        return `${baseClasses} btn-secondary hover:btn-secondary/90`;
      default:
        return `${baseClasses} btn-primary hover:btn-primary/90`;
    }
  };

  return (
    <button
      className={getButtonClasses()}
      onClick={onClick}
      disabled={disabled || loading}
      title={description}
    >
      {loading ? (
        <div className="loading loading-spinner loading-sm"></div>
      ) : (
        <Icon className="w-5 h-5" />
      )}
      <span className="text-xs font-medium mt-1 text-center leading-tight">
        {label}
      </span>
    </button>
  );
};

export const QuickActions: React.FC<Props> = ({ 
  title = "Quick Actions", 
  delay = 300 
}) => {
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());

  const executeAction = async (actionId: string, action: () => Promise<void>) => {
    setLoadingActions(prev => new Set(prev).add(actionId));
    
    try {
      await action();
      // Show success notification (you might want to add a toast system)
      console.log(`Action ${actionId} completed successfully`);
    } catch (error) {
      console.error(`Action ${actionId} failed:`, error);
      // Show error notification
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  };

  const actions = [
    {
      id: 'reboot',
      icon: RotateCcw,
      label: 'Reboot System',
      description: 'Restart the router (requires confirmation)',
      variant: 'warning' as const,
      onClick: () => executeAction('reboot', async () => {
        if (confirm('Are you sure you want to reboot the router? This will temporarily disconnect all users.')) {
          // API call to reboot system
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        }
      })
    },
    {
      id: 'backup',
      icon: Download,
      label: 'Create Backup',
      description: 'Download system configuration backup',
      variant: 'primary' as const,
      onClick: () => executeAction('backup', async () => {
        // API call to create and download backup
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
        console.log('Backup created and downloaded');
      })
    },
    {
      id: 'wifi-reset',
      icon: Wifi,
      label: 'Reset WiFi',
      description: 'Restart wireless interfaces',
      variant: 'secondary' as const,
      onClick: () => executeAction('wifi-reset', async () => {
        // API call to reset WiFi
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      })
    },
    {
      id: 'firewall',
      icon: Shield,
      label: 'Firewall Rules',
      description: 'Quick access to firewall configuration',
      variant: 'primary' as const,
      onClick: () => executeAction('firewall', async () => {
        // Navigate to firewall rules
        console.log('Opening firewall rules');
      })
    },
    {
      id: 'interfaces',
      icon: Network,
      label: 'Network Setup',
      description: 'Configure network interfaces',
      variant: 'primary' as const,
      onClick: () => executeAction('interfaces', async () => {
        // Navigate to network interfaces
        console.log('Opening network interfaces');
      })
    },
    {
      id: 'time-sync',
      icon: Clock,
      label: 'Sync Time',
      description: 'Synchronize system time with NTP',
      variant: 'secondary' as const,
      onClick: () => executeAction('time-sync', async () => {
        // API call to sync time
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      })
    },
    {
      id: 'clear-logs',
      icon: Database,
      label: 'Clear Logs',
      description: 'Clear system logs (keeps recent entries)',
      variant: 'warning' as const,
      onClick: () => executeAction('clear-logs', async () => {
        if (confirm('Clear system logs? Recent entries will be preserved.')) {
          // API call to clear logs
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        }
      })
    },
    {
      id: 'health-check',
      icon: CheckCircle,
      label: 'Health Check',
      description: 'Run system diagnostics',
      variant: 'primary' as const,
      onClick: () => executeAction('health-check', async () => {
        // API call to run health check
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API call
      })
    }
  ];

  return (
    <BaseCard
      icon={Settings}
      title={title}
      delay={delay}
      action={
        <StatusBadge variant="info" size="sm">
          {actions.length} Actions
        </StatusBadge>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {actions.map((action) => (
          <ActionButton
            key={action.id}
            icon={action.icon}
            label={action.label}
            description={action.description}
            variant={action.variant}
            onClick={action.onClick}
            loading={loadingActions.has(action.id)}
          />
        ))}
      </div>

      {/* System Status Indicators */}
      <div className="divider mt-6"></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm font-medium">System</span>
          </div>
          <StatusBadge variant="success" size="sm">Healthy</StatusBadge>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Wifi className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Network</span>
          </div>
          <StatusBadge variant="success" size="sm">Online</StatusBadge>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">Security</span>
          </div>
          <StatusBadge variant="warning" size="sm">Monitor</StatusBadge>
        </div>
      </div>
    </BaseCard>
  );
};