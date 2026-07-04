import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { TRANSLATIONS } from './translations';

export type AccentColor = 'sapphire' | 'emerald' | 'amber' | 'amethyst' | 'ruby';

export const ACCENT_PALETTES: Record<AccentColor, {
  name: string;
  light: { primary: string; primaryContainer: string };
  dark: { primary: string; primaryContainer: string };
}> = {
  sapphire: {
    name: 'Sapphire Blue',
    light: { primary: '#0051de', primaryContainer: '#2e6bff' },
    dark: { primary: '#4d89ff', primaryContainer: '#00308f' }
  },
  emerald: {
    name: 'Emerald Scholar',
    light: { primary: '#008a54', primaryContainer: '#21c27e' },
    dark: { primary: '#2ee092', primaryContainer: '#004d2e' }
  },
  amber: {
    name: 'Amber Wisdom',
    light: { primary: '#b56b00', primaryContainer: '#ffa114' },
    dark: { primary: '#ffc05c', primaryContainer: '#543000' }
  },
  amethyst: {
    name: 'Amethyst Thinker',
    light: { primary: '#8514d9', primaryContainer: '#b84cff' },
    dark: { primary: '#d18dfa', primaryContainer: '#430075' }
  },
  ruby: {
    name: 'Ruby Pedagogue',
    light: { primary: '#d9145c', primaryContainer: '#ff4a8b' },
    dark: { primary: '#ff5c99', primaryContainer: '#630022' }
  }
};

interface SettingsContextType {
  fontSize: number;
  setSavedFontSize: (size: number) => void;
  accentColor: AccentColor;
  setSavedAccentColor: (color: AccentColor) => void;
  denseLayout: boolean;
  setSavedDenseLayout: (dense: boolean) => void;
  appLanguage: string;
  setSavedAppLanguage: (lang: string) => void;
  regionFormat: string;
  setSavedRegionFormat: (region: string) => void;
  timezone: string;
  setSavedTimezone: (tz: string) => void;
  timezoneIANA: string;
  setSavedTimezoneIANA: (iana: string) => void;
  videoAutoplay: boolean;
  setSavedVideoAutoplay: (autoplay: boolean) => void;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.fontSize || 15;
    }
    return 15;
  });

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.accentColor || 'sapphire';
    }
    return 'sapphire';
  });

  const [denseLayout, setDenseLayout] = useState<boolean>(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.denseLayout || false;
    }
    return false;
  });

  const [appLanguage, setAppLanguage] = useState<string>(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.appLanguage || 'English';
    }
    return 'English';
  });

  const [regionFormat, setRegionFormat] = useState<string>(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.regionFormat || 'Bangladesh';
    }
    return 'Bangladesh';
  });

  const [timezone, setTimezone] = useState<string>(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.timezone || 'UTC+6 (Asia/Dhaka)';
    }
    return 'UTC+6 (Asia/Dhaka)';
  });

  const [timezoneIANA, setTimezoneIANA] = useState<string>(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.timezoneIANA || 'Asia/Dhaka';
    }
    return 'Asia/Dhaka';
  });

  const [videoAutoplay, setVideoAutoplay] = useState<boolean>(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.videoAutoplay !== undefined ? parsed.videoAutoplay : true;
    }
    return true;
  });

  const setSavedFontSize = (size: number) => {
    setFontSize(size);
    const scale = size / 15;
    document.documentElement.style.setProperty('--font-scale', `${scale}`);
  };

  const setSavedAccentColor = (color: AccentColor) => {
    setAccentColor(color);
  };

  const setSavedDenseLayout = (dense: boolean) => {
    setDenseLayout(dense);
  };

  const setSavedAppLanguage = (lang: string) => {
    setAppLanguage(lang);
    const saved = localStorage.getItem('userSettings') || '{}';
    try {
      const parsed = JSON.parse(saved);
      parsed.appLanguage = lang;
      localStorage.setItem('userSettings', JSON.stringify(parsed));
    } catch (e) {
      localStorage.setItem('userSettings', JSON.stringify({ appLanguage: lang }));
    }
  };

  const setSavedRegionFormat = (region: string) => {
    setRegionFormat(region);
    const saved = localStorage.getItem('userSettings') || '{}';
    try {
      const parsed = JSON.parse(saved);
      parsed.regionFormat = region;
      localStorage.setItem('userSettings', JSON.stringify(parsed));
    } catch (e) {
      localStorage.setItem('userSettings', JSON.stringify({ regionFormat: region }));
    }
  };

  const setSavedTimezone = (tz: string) => {
    setTimezone(tz);
    const saved = localStorage.getItem('userSettings') || '{}';
    try {
      const parsed = JSON.parse(saved);
      parsed.timezone = tz;
      localStorage.setItem('userSettings', JSON.stringify(parsed));
    } catch (e) {
      localStorage.setItem('userSettings', JSON.stringify({ timezone: tz }));
    }
  };

  const setSavedTimezoneIANA = (iana: string) => {
    setTimezoneIANA(iana);
    const saved = localStorage.getItem('userSettings') || '{}';
    try {
      const parsed = JSON.parse(saved);
      parsed.timezoneIANA = iana;
      localStorage.setItem('userSettings', JSON.stringify(parsed));
    } catch (e) {
      localStorage.setItem('userSettings', JSON.stringify({ timezoneIANA: iana }));
    }
  };

  const setSavedVideoAutoplay = (autoplay: boolean) => {
    setVideoAutoplay(autoplay);
    const saved = localStorage.getItem('userSettings') || '{}';
    try {
      const parsed = JSON.parse(saved);
      parsed.videoAutoplay = autoplay;
      localStorage.setItem('userSettings', JSON.stringify(parsed));
    } catch (e) {
      localStorage.setItem('userSettings', JSON.stringify({ videoAutoplay: autoplay }));
    }
  };

  const t = (key: string): string => {
    const lang = appLanguage || 'English';
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.English;
    return dict[key] || TRANSLATIONS.English[key] || key;
  };

  useEffect(() => {
    const scale = fontSize / 15;
    document.documentElement.style.setProperty('--font-scale', `${scale}`);
  }, [fontSize]);

  // Handle color accent theme variables injection
  useEffect(() => {
    const palette = ACCENT_PALETTES[accentColor] || ACCENT_PALETTES.sapphire;
    const colors = theme === 'dark' ? palette.dark : palette.light;
    
    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--primary-container', colors.primaryContainer);
  }, [accentColor, theme]);

  // Handle high density display class toggle
  useEffect(() => {
    if (denseLayout) {
      document.documentElement.classList.add('dense-layout');
    } else {
      document.documentElement.classList.remove('dense-layout');
    }
  }, [denseLayout]);

  return (
    <SettingsContext.Provider value={{
      fontSize,
      setSavedFontSize,
      accentColor,
      setSavedAccentColor,
      denseLayout,
      setSavedDenseLayout,
      appLanguage,
      setSavedAppLanguage,
      regionFormat,
      setSavedRegionFormat,
      timezone,
      setSavedTimezone,
      timezoneIANA,
      setSavedTimezoneIANA,
      videoAutoplay,
      setSavedVideoAutoplay,
      t
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

