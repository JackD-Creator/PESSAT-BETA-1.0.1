import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { type User, type UserRole } from '../lib/mockData';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../lib/db';

const DEMO_USERS: User[] = [
  { id: 1, full_name: 'Budi Santoso', email: 'budi@farm.id', role: 'owner', phone: '081234567890', is_active: true },
  { id: 2, full_name: 'Dewi Lestari', email: 'dewi@farm.id', role: 'manager', phone: '081234567891', is_active: true },
  { id: 3, full_name: 'Andi Pratama', email: 'andi@farm.id', role: 'worker', phone: '081234567892', is_active: true },
  { id: 4, full_name: 'Siti Rahayu', email: 'siti@farm.id', role: 'worker', phone: '081234567893', is_active: true },
];

const DEMO_CREDENTIALS: Record<string, string> = {
  'budi@farm.id': 'owner123',
  'dewi@farm.id': 'manager123',
  'andi@farm.id': 'worker123',
  'siti@farm.id': 'worker123',
};

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  isSupabase: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('livestock_user');
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });
  const [isSupabase, setIsSupabase] = useState(false);

  useEffect(() => {
    try {
      const checkSupabase = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsSupabase(true);
          const profile = await getUserProfile(data.session.user.id);
          if (profile) {
            setUser(profile);
            localStorage.setItem('livestock_user', JSON.stringify(profile));
          } else {
            setUser(null);
            localStorage.removeItem('livestock_user');
            setIsSupabase(false);
          }
        } else {
          setUser(null);
          localStorage.removeItem('livestock_user');
          setIsSupabase(false);
        }
      };
      checkSupabase();

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          setIsSupabase(true);
          const profile = await getUserProfile(session.user.id);
          if (profile) {
            setUser(profile);
            localStorage.setItem('livestock_user', JSON.stringify(profile));
          }
        } else {
          setIsSupabase(false);
          setUser(null);
          localStorage.removeItem('livestock_user');
        }
      });
      return () => listener?.subscription.unsubscribe();
    } catch (err) {
      console.error('Auth init error:', err);
      setUser(null);
      localStorage.removeItem('livestock_user');
      setIsSupabase(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const expectedPassword = DEMO_CREDENTIALS[email];
    if (expectedPassword && expectedPassword === password) {
      const found = DEMO_USERS.find(u => u.email === email);
      if (found) {
        setUser(found);
        localStorage.setItem('livestock_user', JSON.stringify(found));
        return true;
      }
    }

    try {
      const { data: authData } = await supabase.auth.signInWithPassword({ email, password });
      if (authData?.session) {
        const profile = await getUserProfile(authData.session.user.id);
        if (profile) {
          setUser(profile);
          localStorage.setItem('livestock_user', JSON.stringify(profile));
          setIsSupabase(true);
          return true;
        }
      }
    } catch {
      // supabase unavailable
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('livestock_user');
    setIsSupabase(false);
  }, []);

  const hasRole = useCallback((roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasRole, isSupabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
