import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

export const colors = {
  dark: {
    // Backgrounds - using deep blues/purples instead of pure black
    background: '#0D1117',
    surface: '#161B22',
    surfaceElevated: '#21262D',
    surfaceHighlight: '#30363D',
    
    // Text
    textPrimary: '#F0F6FC',
    textSecondary: '#8B949E',
    textMuted: '#6E7681',
    
    // Accent
    primary: '#6366F1',
    primaryMuted: 'rgba(99, 102, 241, 0.15)',
    
    // Status
    success: '#22C55E',
    successMuted: 'rgba(34, 197, 94, 0.15)',
    warning: '#F59E0B',
    warningMuted: 'rgba(245, 158, 11, 0.15)',
    danger: '#EF4444',
    dangerMuted: 'rgba(239, 68, 68, 0.15)',
    
    // Borders
    border: '#30363D',
    borderLight: '#21262D',
  },
  light: {
    // Backgrounds - using warm grays instead of pure white
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    surfaceHighlight: '#E2E8F0',
    
    // Text
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    
    // Accent
    primary: '#6366F1',
    primaryMuted: 'rgba(99, 102, 241, 0.1)',
    
    // Status
    success: '#16A34A',
    successMuted: 'rgba(22, 163, 74, 0.1)',
    warning: '#D97706',
    warningMuted: 'rgba(217, 119, 6, 0.1)',
    danger: '#DC2626',
    dangerMuted: 'rgba(220, 38, 38, 0.1)',
    
    // Borders
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
  },
};

type ThemeColors = typeof colors.dark;

type ThemeContextType = {
  mode: ThemeMode;
  theme: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_KEY = '@bike_rental_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark') {
          setMode(saved);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
    }
  }, [mode, loaded]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const theme = colors[mode];

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
