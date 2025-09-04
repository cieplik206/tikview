import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Tab {
  id: string;
  label: string;
  shortLabel?: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface TabNavProps {
  tabs: Tab[];
  className?: string;
}

const TabNav: React.FC<TabNavProps> = ({
  tabs,
  className = '',
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleTabClick = (path: string, event: React.MouseEvent) => {
    event.preventDefault();
    navigate(path);
  };

  return (
    <div role="tablist" className={`tabs tabs-box overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;

        return (
          <a
            key={tab.id}
            role="tab"
            className={`tab whitespace-nowrap ${
              isActive ? 'tab-active' : ''
            }`}
            aria-selected={isActive}
            href={tab.path}
            onClick={(event) => handleTabClick(tab.path, event)}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
          </a>
        );
      })}
    </div>
  );
};

export default TabNav;