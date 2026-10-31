import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../lib/api';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = localStorage.getItem('cde_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (theme === 'system') return getSystemTheme();
    return theme;
  });

  const applyThemeToDOM = useCallback((resolved: ResolvedTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Check prefers-reduced-motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      root.classList.add('theme-transition');
    }

    root.setAttribute('data-theme', resolved);
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update meta theme-color and color-scheme
    root.style.colorScheme = resolved;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', resolved === 'dark' ? '#0B1622' : '#FBF8F3');

    if (!reducedMotion) {
      setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 350);
    }
  }, []);

  const setTheme = useCallback(
    (newMode: ThemeMode) => {
      setThemeState(newMode);
      try {
        localStorage.setItem('cde_theme', newMode);
      } catch {}

      const resolved = newMode === 'system' ? getSystemTheme() : newMode;
      setResolvedTheme(resolved);
      applyThemeToDOM(resolved);

      // Persist theme preference to user database if authenticated
      if (typeof window !== 'undefined' && localStorage.getItem('cde_auth_token')) {
        authApi.updateProfile({ theme: newMode }).catch(() => {});
      }
    },
    [applyThemeToDOM]
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  // Listen for OS system theme changes
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (theme === 'system') {
        const sys = media.matches ? 'dark' : 'light';
        setResolvedTheme(sys);
        applyThemeToDOM(sys);
      }
    };

    media.addEventListener('change', listener);
    // Initial sync
    const initialResolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
    setResolvedTheme(initialResolved);
    applyThemeToDOM(initialResolved);

    return () => media.removeEventListener('change', listener);
  }, [theme, applyThemeToDOM]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

