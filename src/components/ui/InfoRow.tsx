import React, { ReactNode } from 'react';

interface InfoRowProps {
  label: string;
  value?: string | number | ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  children?: ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  icon: Icon,
  className = '',
  labelClassName = '',
  valueClassName = '',
  children,
}) => {
  return (
    <div className={`flex justify-between items-center py-2 ${className}`}>
      <div className={`flex items-center gap-2 text-base-content/70 ${labelClassName}`}>
        {Icon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
      </div>
      <div className={`text-base-content font-medium ${valueClassName}`}>
        {children || value}
      </div>
    </div>
  );
};

export default InfoRow;