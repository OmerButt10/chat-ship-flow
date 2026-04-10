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
  // For local development we provide a demo authenticated user so the app
  // doesn't redirect to login while auth is intentionally disabled on the backend.
  const DEMO_USER: User = {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'dev@local',
    full_name: 'Developer',
    role: 'admin',
    created_at: new Date().toISOString(),
  };

  const [user, setUser] = useState<User | null>(DEMO_USER);


  // In this dev mode the login/logout functions are no-ops that operate on
  // the demo user so UI behaves as authenticated without needing real tokens.
  const refreshToken = useCallback(async (_refresh: string) => {
    // no-op in dev
    setUser(DEMO_USER);
  }, []);

  const login = useCallback(async (_username: string, _password: string) => {
    setUser(DEMO_USER);
  }, []);

  const logout = useCallback(() => {
    // keep demo user active for development convenience
    setUser(DEMO_USER);
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
