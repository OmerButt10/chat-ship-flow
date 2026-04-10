import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api, { setAuthToken } from '@/lib/api';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // load tokens from storage
  useEffect(() => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    if (access) {
      setAuthToken(access);
      // fetch whoami
      api.get('/whoami/').then(res => setUser(res.data)).catch(() => {
        // try refresh
        if (refresh) refreshToken(refresh);
      });
    }
  }, []);

  const refreshToken = useCallback(async (refresh: string) => {
    try {
      const res = await api.post('/token/refresh/', { refresh });
      const access = res.data.access;
      localStorage.setItem('access_token', access);
      setAuthToken(access);
      const who = await api.get('/whoami/');
      setUser(who.data);
    } catch (e) {
      logout();
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post('/token/', { username, password });
    const { access, refresh } = res.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setAuthToken(access);
    const who = await api.get('/whoami/');
    setUser(who.data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAuthToken(null);
    setUser(null);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    // Client-side role switch retained for demos; in production roles come from backend
    setUser(prev => prev ? { ...prev, role } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
