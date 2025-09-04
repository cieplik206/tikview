import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BaseCardProps {
  icon?: LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  subtitle?: string;
  delay?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  icon: Icon,
  title,
  subtitle,
  delay = 0,
  action,
  children,
  className = '',
}) => {
  const animationStyle = delay > 0 ? { animationDelay: `${delay}ms` } : {};

  return (
    <div 
      className={`card card-border bg-base-100 shadow-sm animate-fade-in transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${className}`}
      style={animationStyle}
    >
      <div className="card-body">
        {/* Header with title and actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-content grid place-items-center">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="card-title text-base">{title}</h2>
              {subtitle && (
                <p className="text-sm text-base-content/60">{subtitle}</p>
              )}
            </div>
          </div>
          
          {action && (
            <div className="card-actions">
              {action}
            </div>
          )}
        </div>

        {/* Content - separated from header */}
        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>
  );
};