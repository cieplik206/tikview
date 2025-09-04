import React, { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeStyle = '' | 'outline' | 'soft' | 'dash' | 'ghost';
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface StatusBadgeProps {
  variant?: BadgeVariant;
  style?: BadgeStyle;
  text?: string;
  showDot?: boolean;
  pulse?: boolean;
  size?: BadgeSize;
  className?: string;
  children?: ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'success',
  style = 'outline',
  text = '',
  showDot = true,
  pulse = false,
  size = 'md',
  className = '',
  children,
}) => {
  const getBadgeClasses = () => {
    const base = 'badge gap-2 font-medium';
    
    // Color variants
    const variantMap: Record<BadgeVariant, string> = {
      primary: 'badge-primary',
      secondary: 'badge-secondary',
      accent: 'badge-accent',
      success: 'badge-success',
      warning: 'badge-warning',
      error: 'badge-error',
      info: 'badge-info',
      neutral: 'badge-neutral'
    };
    
    // Style modifiers
    const styleMap: Record<string, string> = {
      outline: 'badge-outline',
      soft: 'badge-soft',
      dash: 'badge-dash',
      ghost: 'badge-ghost'
    };
    
    // Size modifiers
    const sizeMap: Record<BadgeSize, string> = {
      xs: 'badge-xs',
      sm: 'badge-sm',
      md: 'badge-md',
      lg: 'badge-lg',
      xl: 'badge-xl'
    };
    
    const pulseClass = pulse ? 'animate-pulse' : '';
    
    return [
      base,
      variantMap[variant],
      style ? styleMap[style] : '',
      sizeMap[size],
      pulseClass,
      className
    ].filter(Boolean).join(' ');
  };

  const getDotClasses = () => {
    const sizes = {
      xs: 'w-1 h-1',
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
      xl: 'w-3 h-3'
    };
    
    const animation = pulse ? 'animate-blink' : '';
    
    return `${sizes[size]} rounded-full bg-current ${animation}`.trim();
  };

  return (
    <div className={getBadgeClasses()}>
      {showDot && <span className={getDotClasses()} />}
      {children || text}
    </div>
  );
};

export { StatusBadge };
export default StatusBadge;