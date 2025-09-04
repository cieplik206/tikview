import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  hover?: boolean;
  bordered?: boolean;
  compact?: boolean;
  delay?: number;
  noPadding?: boolean;
  className?: string;
  children: ReactNode;
  titleSlot?: ReactNode;
  actionSlot?: ReactNode;
}

const Card: React.FC<CardProps> = ({
  title = '',
  icon: Icon,
  hover = true,
  bordered = true,
  compact = false,
  delay = 0,
  noPadding = false,
  className = '',
  children,
  titleSlot,
  actionSlot,
}) => {
  const hasHeader = title || Icon || titleSlot || actionSlot;

  const getCardClasses = () => {
    const base = 'card bg-base-100 shadow-sm';
    const borderedClass = bordered ? 'card-border' : '';
    const compactClass = compact ? 'card-sm' : '';
    const hoverClass = hover ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl' : '';
    const animationClass = delay >= 0 ? 'animate-fade-in-up' : '';
    
    return [base, borderedClass, compactClass, hoverClass, animationClass, className]
      .filter(Boolean)
      .join(' ');
  };

  const getAnimationDelay = () => {
    return delay > 0 ? { animationDelay: `${delay}ms` } : {};
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="avatar">
            <div className="w-10 rounded-xl bg-primary text-primary-content">
              <Icon className="w-5 h-5 m-auto mt-2.5" />
            </div>
          </div>
        )}
        <h2 className="card-title text-base">
          {titleSlot || title}
        </h2>
      </div>
      {actionSlot && (
        <div className="card-actions">
          {actionSlot}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={getCardClasses()}
      style={getAnimationDelay()}
    >
      {hasHeader && !noPadding ? (
        <div className="card-body">
          {renderHeader()}
          {children}
        </div>
      ) : hasHeader && noPadding ? (
        <div className="card-body">
          {renderHeader()}
          {children}
        </div>
      ) : (
        <div className="card-body">
          {children}
        </div>
      )}
    </div>
  );
};

export default Card;