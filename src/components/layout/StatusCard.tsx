import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../ui';

interface StatusCardProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  label: string;
  change?: number | null;
  loading?: boolean;
  delay?: number;
  className?: string;
  children?: ReactNode;
}

const StatusCard: React.FC<StatusCardProps> = ({
  icon,
  title,
  value,
  label,
  change = null,
  loading = false,
  delay = 0,
  className = '',
  children,
}) => {
  const ChangeIcon = change !== null ? (change >= 0 ? TrendingUp : TrendingDown) : null;

  const getChangeClasses = () => {
    const base = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium';
    const variant = change !== null && change >= 0 
      ? 'bg-success/10 text-success' 
      : 'bg-error/10 text-error';
    
    return `${base} ${variant}`;
  };

  return (
    <Card 
      icon={icon} 
      title={title} 
      delay={delay}
      className={className}
    >
      <div className="space-y-4">
        {!loading ? (
          <div>
            <div className="text-4xl font-bold bg-gradient-to-r from-white to-base-content bg-clip-text text-transparent">
              {value}
            </div>
            <div className="text-sm text-base-content/70 mt-2">{label}</div>
            
            {change !== null && ChangeIcon && (
              <div className="mt-3">
                <span className={getChangeClasses()}>
                  <ChangeIcon className="w-3 h-3" />
                  {Math.abs(change)}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-10 bg-base-300 rounded-lg animate-pulse"></div>
            <div className="h-4 bg-base-300 rounded w-2/3 animate-pulse"></div>
          </div>
        )}
        
        {children}
      </div>
    </Card>
  );
};

export default StatusCard;