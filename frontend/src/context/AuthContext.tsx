import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, authChannel, type UserResponse } from '../lib/api';
import { queryClient } from '../lib/queryClient';

export type UserRole = 'user' | 'admin' | 'spi';

interface AuthContextType {
  user: UserResponse | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register' | 'forgot';
  openAuthModal: (tab?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  login: (credentials: { email: string; password: string; remember?: boolean; turnstile_token?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone: string;
    address?: string;
    turnstile_token?: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<UserResponse>) => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'forgot'>('login');

  const openAuthModal = useCallback((tab: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Multi-tab cross synchronization & OAuth callback handler
  useEffect(() => {
    // 1. Check OAuth callback parameters in URL
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const authToken = searchParams.get('auth_token');
      const authError = searchParams.get('auth_error');

      if (authToken) {
        localStorage.setItem('cde_auth_token', authToken);
        window.history.replaceState({}, '', window.location.pathname);
        authChannel?.postMessage({ type: 'LOGIN', timestamp: Date.now() });
        fetchCurrentUser();
      } else if (authError) {
        window.history.replaceState({}, '', window.location.pathname);
        fetchCurrentUser();
      } else {
        fetchCurrentUser();
      }
    } else {
      fetchCurrentUser();
    }

    // 2. BroadcastChannel cross-tab listener
    const handleBroadcast = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === 'LOGOUT' || data?.type === 'SESSION_EXPIRED') {
        setUser(null);
        queryClient.cancelQueries();
        queryClient.clear();
        setIsAuthModalOpen(false);
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      } else if (data?.type === 'LOGIN') {
        fetchCurrentUser();
      }
    };

    authChannel?.addEventListener('message', handleBroadcast);

    // 3. Storage event fallback for browsers without BroadcastChannel support
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'cde_auth_sync' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed.event === 'LOGOUT') {
            setUser(null);
            queryClient.cancelQueries();
            queryClient.clear();
            setIsAuthModalOpen(false);
            window.history.replaceState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          } else if (parsed.event === 'LOGIN') {
            fetchCurrentUser();
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      authChannel?.removeEventListener('message', handleBroadcast);
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchCurrentUser]);

  const login = useCallback(
    async (credentials: { email: string; password: string; remember?: boolean; turnstile_token?: string }) => {
      try {
        const res = await authApi.login(credentials);
        setUser(res.user);
        setIsAuthModalOpen(false);
        authChannel?.postMessage({ type: 'LOGIN', timestamp: Date.now() });
        try {
          localStorage.setItem('cde_auth_sync', JSON.stringify({ event: 'LOGIN', timestamp: Date.now() }));
        } catch {}
        return { success: true, message: res.message };
      } catch (err: any) {
        const error = err.response?.data?.error || 'LOGIN_FAILED';
        const message = err.response?.data?.message || 'Login gagal, periksa email dan kata sandi Anda.';
        return { success: false, message, error };
      }
    },
    []
  );

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      phone: string;
      address?: string;
      turnstile_token?: string;
    }) => {
      try {
        const res = await authApi.register(data);
        setUser(res.user);
        setIsAuthModalOpen(false);
        authChannel?.postMessage({ type: 'LOGIN', timestamp: Date.now() });
        try {
          localStorage.setItem('cde_auth_sync', JSON.stringify({ event: 'LOGIN', timestamp: Date.now() }));
        } catch {}
        return { success: true, message: res.message };
      } catch (err: any) {
        const error = err.response?.data?.error || 'REGISTER_FAILED';
        const message = err.response?.data?.message || 'Pendaftaran akun gagal. Periksa data Anda.';
        return { success: false, message, error };
      }
    },
    []
  );

  // Single robust logout function - Single Source of Truth
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout request note:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('cde_auth_token');
      localStorage.removeItem('cde_user_role');
      localStorage.removeItem('cde_auth');
      localStorage.removeItem('cde_auth_role');

      // Invalidate and cancel all TanStack Query requests
      queryClient.cancelQueries();
      queryClient.clear();

      // Close any open auth modal
      setIsAuthModalOpen(false);

      // Broadcast logout across tabs
      authChannel?.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
      try {
        localStorage.setItem('cde_auth_sync', JSON.stringify({ event: 'LOGOUT', timestamp: Date.now() }));
      } catch {}

      // Navigate back to root
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, []);

  const updateUser = useCallback((updated: Partial<UserResponse>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  }, []);

  const role: UserRole | null = user?.role || null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        updateUser,
        refetchUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
