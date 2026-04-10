import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo users for MVP
const DEMO_USERS: Record<string, User> = {
  admin: { id: '1', email: 'admin@warehouse.com', full_name: 'Admin User', role: 'admin', created_at: new Date().toISOString() },
  staff: { id: '2', email: 'staff@warehouse.com', full_name: 'Staff Member', role: 'warehouse_staff', created_at: new Date().toISOString() },
  client: { id: '3', email: 'client@warehouse.com', full_name: 'Acme Corp', role: 'client', created_at: new Date().toISOString() },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_USERS.admin);

  const login = useCallback(async (email: string, _password: string) => {
    const found = Object.values(DEMO_USERS).find(u => u.email === email);
    if (found) setUser(found);
    else throw new Error('Invalid credentials');
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const switchRole = useCallback((role: UserRole) => {
    const found = Object.values(DEMO_USERS).find(u => u.role === role);
    if (found) setUser(found);
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
