import React, { createContext, useContext, useState, useCallback } from 'react';
import { type User, type UserRole, mockUsers } from '../lib/mockData';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_CREDENTIALS: Record<string, string> = {
  'budi@farm.id': 'owner123',
  'dewi@farm.id': 'manager123',
  'andi@farm.id': 'worker123',
  'siti@farm.id': 'worker123',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('livestock_user');
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const expectedPassword = DEMO_CREDENTIALS[email];
    if (!expectedPassword || expectedPassword !== password) return false;
    const found = mockUsers.find(u => u.email === email);
    if (!found) return false;
    setUser(found);
    localStorage.setItem('livestock_user', JSON.stringify(found));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('livestock_user');
  }, []);

  const hasRole = useCallback((roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
