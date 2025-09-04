import { branding } from '../config/branding';
import { useEffect } from 'react';

export const useBranding = () => {
  // Apply theme on mount
  useEffect(() => {
    // Set DaisyUI theme
    document.documentElement.setAttribute('data-theme', branding.theme.daisyUITheme);
    
    // Apply custom CSS if provided
    if (branding.theme.customCSS) {
      const style = document.createElement('style');
      style.textContent = branding.theme.customCSS;
      style.id = 'custom-branding-css';
      document.head.appendChild(style);
      
      return () => {
        document.getElementById('custom-branding-css')?.remove();
      };
    }
    
    // Set custom CSS variables for colors
    if (branding.theme.primaryColor) {
      document.documentElement.style.setProperty('--primary', branding.theme.primaryColor);
    }
    if (branding.theme.secondaryColor) {
      document.documentElement.style.setProperty('--secondary', branding.theme.secondaryColor);
    }
    
    // Update favicon if provided
    if (branding.favicon) {
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = branding.favicon;
      }
    }
    
    // Update document title
    document.title = branding.appName;
  }, []);
  
  return branding;
};