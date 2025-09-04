// Branding configuration that can be customized at build time
export interface BrandingConfig {
  appName: string;
  companyName: string;
  logoUrl?: string;
  favicon?: string;
  theme: {
    daisyUITheme: string;
    primaryColor?: string;
    secondaryColor?: string;
    customCSS?: string;
  };
  features: {
    showPoweredBy: boolean;
    customFooterText?: string;
    supportEmail?: string;
    supportUrl?: string;
  };
}

// Default branding (for free/open-source version)
const defaultBranding: BrandingConfig = {
  appName: 'TikView React',
  companyName: 'Open Source',
  theme: {
    daisyUITheme: 'halloween',
  },
  features: {
    showPoweredBy: true,
  }
};

// Load branding from environment variables (injected at build time)
export const branding: BrandingConfig = {
  appName: import.meta.env.VITE_APP_NAME || defaultBranding.appName,
  companyName: import.meta.env.VITE_COMPANY_NAME || defaultBranding.companyName,
  logoUrl: import.meta.env.VITE_LOGO_URL || defaultBranding.logoUrl,
  favicon: import.meta.env.VITE_FAVICON || defaultBranding.favicon,
  theme: {
    daisyUITheme: import.meta.env.VITE_THEME || defaultBranding.theme.daisyUITheme,
    primaryColor: import.meta.env.VITE_PRIMARY_COLOR,
    secondaryColor: import.meta.env.VITE_SECONDARY_COLOR,
    customCSS: import.meta.env.VITE_CUSTOM_CSS,
  },
  features: {
    showPoweredBy: import.meta.env.VITE_SHOW_POWERED_BY !== 'false',
    customFooterText: import.meta.env.VITE_FOOTER_TEXT,
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL,
    supportUrl: import.meta.env.VITE_SUPPORT_URL,
  }
};