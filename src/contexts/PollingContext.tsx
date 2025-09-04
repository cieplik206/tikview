import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PollingContextType {
  pollingInterval: number;
  setPollingInterval: (interval: number) => void;
  pollingMultiplier: number; // Multiplier for different polling rates
}

const PollingContext = createContext<PollingContextType | undefined>(undefined);

const STORAGE_KEY = 'polling-interval';
const DEFAULT_INTERVAL = 2000; // 2 seconds default

export const PollingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pollingInterval, setPollingIntervalState] = useState<number>(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_INTERVAL;
  });

  const setPollingInterval = (interval: number) => {
    setPollingIntervalState(interval);
    localStorage.setItem(STORAGE_KEY, interval.toString());
  };

  // Calculate multiplier based on base interval (for different polling rates)
  const pollingMultiplier = pollingInterval / 1000; // Convert to seconds for multiplier

  useEffect(() => {
    // Verify stored value is valid
    if (![1000, 2000, 5000, 10000, 30000].includes(pollingInterval)) {
      setPollingInterval(DEFAULT_INTERVAL);
    }
  }, []);

  return (
    <PollingContext.Provider value={{ pollingInterval, setPollingInterval, pollingMultiplier }}>
      {children}
    </PollingContext.Provider>
  );
};

export const usePolling = () => {
  const context = useContext(PollingContext);
  if (context === undefined) {
    throw new Error('usePolling must be used within a PollingProvider');
  }
  return context;
};

// Helper hook to get adjusted polling interval for specific query types
export const usePollingInterval = (baseInterval: number | false) => {
  const { pollingInterval, pollingMultiplier } = usePolling();
  
  if (baseInterval === false) return false; // No polling
  
  // Adjust the interval based on the global setting
  // If base was 2s and user selected 5s, scale proportionally
  const scaleFactor = pollingInterval / DEFAULT_INTERVAL;
  return Math.round(baseInterval * scaleFactor);
};