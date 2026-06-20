import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeColors {
  isDark: boolean;
  bg: string;               // App/Screen level background
  bgAlt: string;            // Secondary background (e.g. login container background)
  cardBg: string;           // Card body background
  cardBorder: string;       // Card border color
  text: string;             // Main primary text color
  textMuted: string;        // Secondary description/muted text
  textLight: string;        // Lighter metadata text
  inputBg: string;          // Form input background
  inputBorder: string;      // Form input border
  inputText: string;        // Form input text
  shadowColor: string;      // Shadow color
  shadowBox: string;        // Web Neomorphic / Shadow styles
  shadowInset: string;      // Web Inset Neomorphic shadow styles
  divider: string;          // Borders/Dividers
  primary: string;          // Main brand color (indigo)
  primaryHover: string;
  accent: string;           // Success / active accents
  sidebarBg: string;        // Sidebar panel background
  sidebarText: string;      // Sidebar link/item text
  sidebarTextActive: string;// Active sidebar text
  sidebarItemBgActive: string;// Active sidebar item background
  sidebarBorder: string;    // Sidebar divider/border
  glassBg: string;          // Blurry backdrop backgrounds
  glassBorder: string;      // Blurry backdrop borders
  tooltipBg: string;        // Citation tooltip card background
  tooltipBorder: string;    // Citation tooltip card border
  accentBg: string;         // Light version of brand (indigo badge/banner bg)
}

const lightTheme: ThemeColors = {
  isDark: false,
  bg: '#f0f2f5',
  bgAlt: '#f3f4f6',
  cardBg: '#ffffff',
  cardBorder: 'rgba(255, 255, 255, 0.5)',
  text: '#1e293b',
  textMuted: '#4b5563',
  textLight: '#64748b',
  inputBg: '#f3f4f6',
  inputBorder: 'rgba(99, 102, 241, 0.1)',
  inputText: '#1f2937',
  shadowColor: '#d1d9e6',
  shadowBox: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
  shadowInset: 'inset 6px 6px 12px #d1d9e6, inset -6px -6px 12px #ffffff',
  divider: '#cbd5e1',
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  accent: '#10b981',
  sidebarBg: '#ffffff',
  sidebarText: '#64748b',
  sidebarTextActive: '#6366f1',
  sidebarItemBgActive: '#f3f4f6',
  sidebarBorder: '#e5e7eb',
  glassBg: 'rgba(240, 242, 245, 0.8)',
  glassBorder: 'rgba(226, 232, 240, 0.3)',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
  accentBg: 'rgba(99, 102, 241, 0.1)',
};

const darkTheme: ThemeColors = {
  isDark: true,
  bg: '#0d0e12',
  bgAlt: '#090a0f',
  cardBg: '#13151a',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  textLight: '#64748b',
  inputBg: 'rgba(30, 41, 59, 0.4)',
  inputBorder: '#334155',
  inputText: '#f8fafc',
  shadowColor: '#000000',
  shadowBox: '0 8px 30px rgba(0, 0, 0, 0.4)',
  shadowInset: 'inset 2px 2px 5px rgba(0,0,0,0.3)',
  divider: '#1e293b',
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  accent: '#10b981',
  sidebarBg: '#090a0f',
  sidebarText: '#94a3b8',
  sidebarTextActive: '#ffffff',
  sidebarItemBgActive: '#13151a',
  sidebarBorder: '#1e293b',
  glassBg: 'rgba(13, 14, 18, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  tooltipBg: '#181b24',
  tooltipBorder: '#2d3748',
  accentBg: 'rgba(99, 102, 241, 0.2)',
};

interface ThemeContextType {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  theme: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_PREF_KEY = 'theme_preference';

const getStoredPreference = (): ThemePreference => {
  if (Platform.OS === 'web') {
    try {
      const stored = localStorage.getItem(THEME_PREF_KEY);
      if (stored === 'system' || stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      return 'system';
    }
  }
  return 'system';
};

const setStoredPreference = (pref: ThemePreference) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(THEME_PREF_KEY, pref);
    } catch (e) {
      console.error('Error saving theme preference', e);
    }
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    setThemePreferenceState(getStoredPreference());
  }, []);

  const setThemePreference = (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    setStoredPreference(pref);
  };

  const isDark =
    themePreference === 'system'
      ? systemColorScheme === 'dark'
      : themePreference === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, theme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
