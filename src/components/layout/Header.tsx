import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button, StatusBadge } from '../ui';
import { PollingIntervalSelector } from '../ui/PollingIntervalSelector';
import { ThemeToggle } from '../ui/ThemeToggle';
import { logout } from '../../store/slices/authSlice';

interface HeaderProps {
  routerName?: string;
}

const Header: React.FC<HeaderProps> = ({
  routerName = '',
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const handleLogout = () => {
    // Clear all cached queries on logout
    queryClient.clear();
    dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <header className="card bg-base-200/50 backdrop-blur-md shadow-xl mb-4 md:mb-8 animate-slide-down relative z-20">
      <div className="card-body p-4 md:p-6 flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="header-left w-full md:w-auto">
          <h1 className="text-xl md:text-3xl font-bold text-base-content mb-2">
            Network Dashboard
          </h1>
          <div className="flex items-center">
            <StatusBadge 
              variant="success" 
              size={isMobile ? 'sm' : 'md'}
              pulse
              className="inline-flex flex-wrap"
            >
              <span className="whitespace-nowrap">Connected to</span>
              <span className="font-semibold truncate max-w-[150px] md:max-w-none">
                {routerName || 'MikroTik'}
              </span>
            </StatusBadge>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto max-[400px]:flex-col max-[400px]:w-full sm:max-[768px]:flex-row">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Polling Interval Selector */}
          <PollingIntervalSelector />
          
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full sm:w-auto text-sm md:text-base max-[400px]:w-full max-[400px]:justify-center sm:max-[768px]:flex-1"
            aria-label="Logout"
          >
            <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;