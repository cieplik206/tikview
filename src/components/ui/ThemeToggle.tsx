import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <label 
      className="flex cursor-pointer gap-2 items-center"
      data-testid="theme-toggle"
    >
      {/* Sun icon for light mode */}
      <Sun 
        className={`w-5 h-5 ${theme === 'garden' ? 'text-yellow-500' : 'text-base-content/50'}`}
        aria-hidden="true"
      />
      
      <input
        type="checkbox"
        className="toggle"
        checked={theme === 'halloween'}
        onChange={toggleTheme}
        aria-label={`Switch to ${theme === 'garden' ? 'dark' : 'light'} mode`}
      />
      
      {/* Moon icon for dark mode */}
      <Moon 
        className={`w-5 h-5 ${theme === 'halloween' ? 'text-blue-500' : 'text-base-content/50'}`}
        aria-hidden="true"
      />
    </label>
  );
};