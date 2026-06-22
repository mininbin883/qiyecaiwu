import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { clearAuthToken, fetchBootstrap, getAuthToken, login as loginRequest, setAuthToken, type AuthUser } from '@/services/api';
import { initializeCollections } from '@/data/mockData';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  bootstrapped: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  bootstrap: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const bootstrap = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchBootstrap();
      initializeCollections(response.collections);
      setUser(response.user);
      setBootstrapped(true);
    } catch (err) {
      clearAuthToken();
      setUser(null);
      setBootstrapped(false);
      setError(err instanceof Error ? err.message : '登录已失效');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginRequest(username, password);
      setAuthToken(response.token);
      const bootstrapResponse = await fetchBootstrap();
      initializeCollections(bootstrapResponse.collections);
      setUser(response.user);
      setBootstrapped(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setBootstrapped(false);
  }, []);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    return user.permissions.includes('all') || user.permissions.includes(permission);
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    error,
    bootstrapped,
    login,
    logout,
    bootstrap,
    hasPermission,
  }), [bootstrap, bootstrapped, error, hasPermission, loading, login, logout, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
