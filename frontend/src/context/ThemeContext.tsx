import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, authChannel } from '../lib/api';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const resolveEffectiveTheme = (): { theme: ThemeMode; resolved: ResolvedTheme } => {
  if (typeof window === 'undefined') return { theme: 'light', resolved: 'light' };
  try {
    const saved = localStorage.getItem('cde_theme');
    // Jika localStorage berisi 'system' dari sebelumnya, perlakukan sebagai 'light'
    if (saved === 'system') return { theme: 'light', resolved: 'light' };
    if (saved === 'light' || saved === 'dark') {
      // Nilai tersimpan 'light'/'dark' dihormati HANYA untuk pengguna login
      const hasAuth = Boolean(localStorage.getItem('cde_auth_token'));
      if (hasAuth) {
        return { theme: saved, resolved: saved };
      }
    }
  } catch {}
  return { theme: 'light', resolved: 'light' };
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeState, setThemeState] = useState<ThemeMode>(() => resolveEffectiveTheme().theme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveEffectiveTheme().resolved);

  const applyThemeToDOM = useCallback((resolved: ResolvedTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Check prefers-reduced-motion
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      // Jika memilih system, perlakukan sebagai light (TAHAP V9)
      const effectiveMode: ThemeMode = newMode === 'system' ? 'light' : newMode;
      const effectiveResolved: ResolvedTheme = effectiveMode === 'dark' ? 'dark' : 'light';

      setThemeState(effectiveMode);
      setResolvedTheme(effectiveResolved);

      try {
        localStorage.setItem('cde_theme', effectiveMode);
      } catch {}

      applyThemeToDOM(effectiveResolved);

      // Persist theme preference to user database if authenticated
      if (typeof window !== 'undefined' && localStorage.getItem('cde_auth_token')) {
        authApi.updateProfile({ theme: effectiveMode }).catch(() => {});
      }
    },
    [applyThemeToDOM]
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  // Synchronize on mount and listen for login/logout/storage events
  useEffect(() => {
    const syncThemeFromAuth = () => {
      const { theme: nextTheme, resolved: nextResolved } = resolveEffectiveTheme();
      setThemeState(nextTheme);
      setResolvedTheme(nextResolved);
      applyThemeToDOM(nextResolved);
    };

    // Initial DOM sync on mount
    applyThemeToDOM(resolvedTheme);

    const handleBroadcast = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === 'LOGIN' || data?.type === 'LOGOUT' || data?.type === 'SESSION_EXPIRED') {
        syncThemeFromAuth();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cde_auth_token' || e.key === 'cde_theme' || e.key === 'cde_auth_sync') {
        syncThemeFromAuth();
      }
    };

    authChannel?.addEventListener('message', handleBroadcast);
    window.addEventListener('storage', handleStorage);

    return () => {
      authChannel?.removeEventListener('message', handleBroadcast);
      window.removeEventListener('storage', handleStorage);
    };
  }, [applyThemeToDOM, resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme: themeState, resolvedTheme, setTheme, toggleTheme }}>
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
