import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ColorTheme {
  id: string;
  name: string;
  // Background colors
  bgPrimary: string;      // Main app background
  bgSecondary: string;    // Card/container background
  bgAccent: string;       // Highlighted sections
  // Brand colors
  primary: string;        // Primary brand color
  primaryLight: string;   // Light variant
  primaryDark: string;    // Dark variant
  // Status colors
  success: string;
  warning: string;
  danger: string;
  info: string;
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Border
  border: string;
  borderLight: string;
}

export const themes: Record<string, ColorTheme> = {
  teal: {
    id: 'teal',
    name: 'Teal Ocean',
    bgPrimary: 'bg-teal-50',
    bgSecondary: 'bg-white',
    bgAccent: 'bg-teal-100',
    primary: 'teal-600',
    primaryLight: 'teal-100',
    primaryDark: 'teal-700',
    success: 'emerald-500',
    warning: 'amber-500',
    danger: 'red-500',
    info: 'sky-500',
    textPrimary: 'gray-900',
    textSecondary: 'gray-600',
    textMuted: 'gray-400',
    border: 'gray-200',
    borderLight: 'gray-100',
  },
  ocean: {
    id: 'ocean',
    name: 'Deep Ocean',
    bgPrimary: 'bg-slate-100',
    bgSecondary: 'bg-white',
    bgAccent: 'bg-blue-50',
    primary: 'blue-600',
    primaryLight: 'blue-100',
    primaryDark: 'blue-700',
    success: 'emerald-500',
    warning: 'amber-500',
    danger: 'rose-500',
    info: 'cyan-500',
    textPrimary: 'slate-900',
    textSecondary: 'slate-600',
    textMuted: 'slate-400',
    border: 'slate-200',
    borderLight: 'slate-100',
  },
  forest: {
    id: 'forest',
    name: 'Forest Green',
    bgPrimary: 'bg-emerald-50',
    bgSecondary: 'bg-white',
    bgAccent: 'bg-emerald-100',
    primary: 'emerald-600',
    primaryLight: 'emerald-100',
    primaryDark: 'emerald-700',
    success: 'green-500',
    warning: 'yellow-500',
    danger: 'red-500',
    info: 'teal-500',
    textPrimary: 'gray-900',
    textSecondary: 'gray-600',
    textMuted: 'gray-400',
    border: 'gray-200',
    borderLight: 'gray-100',
  },
  sunset: {
    id: 'sunset',
    name: 'Warm Sunset',
    bgPrimary: 'bg-orange-50',
    bgSecondary: 'bg-white',
    bgAccent: 'bg-amber-100',
    primary: 'orange-600',
    primaryLight: 'orange-100',
    primaryDark: 'orange-700',
    success: 'emerald-500',
    warning: 'amber-500',
    danger: 'red-500',
    info: 'sky-500',
    textPrimary: 'gray-900',
    textSecondary: 'gray-600',
    textMuted: 'gray-400',
    border: 'gray-200',
    borderLight: 'gray-100',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender Dreams',
    bgPrimary: 'bg-purple-50',
    bgSecondary: 'bg-white',
    bgAccent: 'bg-violet-100',
    primary: 'violet-600',
    primaryLight: 'violet-100',
    primaryDark: 'violet-700',
    success: 'emerald-500',
    warning: 'amber-500',
    danger: 'rose-500',
    info: 'indigo-500',
    textPrimary: 'gray-900',
    textSecondary: 'gray-600',
    textMuted: 'gray-400',
    border: 'gray-200',
    borderLight: 'gray-100',
  },
};

interface ThemeContextType {
  theme: ColorTheme;
  themeName: string;
  setTheme: (themeId: string) => void;
  availableThemes: typeof themes;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeName, setThemeName] = useState<string>(() => {
    const saved = localStorage.getItem('serhub_theme');
    return saved && themes[saved] ? saved : 'teal';
  });

  const setTheme = (themeId: string) => {
    if (themes[themeId]) {
      setThemeName(themeId);
      localStorage.setItem('serhub_theme', themeId);
    }
  };

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', themeName);
  }, [themeName]);

  return (
    <ThemeContext.Provider value={{
      theme: themes[themeName],
      themeName,
      setTheme,
      availableThemes: themes,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
