import React from 'react';
import { Outlet } from 'react-router-dom';
import { Home } from 'lucide-react';
import Header from './Header';
import TabNav from './TabNav';
import { UserDataPrefetch } from '../auth/UserDataPrefetch';
import { PermissionsDisplay } from '../auth/PermissionsDisplay';

export const DashboardLayout: React.FC = () => {
  // Tab navigation configuration matching Vue version
  const tabs = [
    { id: 'overview', label: 'Overview', path: '/dashboard/overview', icon: Home }
  ];

  return (
    <div className="min-h-screen bg-base-100">
      {/* Prefetch user data on mount - will cache forever until logout */}
      <UserDataPrefetch />
      
      {/* Load and display user permissions */}
      <PermissionsDisplay />
      
      <div className="max-w-[1400px] mx-auto p-5 relative">
        {/* Header */}
        <Header 
          routerName="MikroTik CHR"
        />
        
        {/* Tab Navigation */}
        <TabNav tabs={tabs} />
        
        {/* Page Content */}
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};