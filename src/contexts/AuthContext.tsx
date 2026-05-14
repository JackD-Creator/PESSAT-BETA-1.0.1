import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { type User, type UserRole, mockUsers } from '../lib/mockData';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  isSupabase: boolean;
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
  const [isSupabase, setIsSupabase] = useState(false);

  useEffect(() => {
    const checkSupabase = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsSupabase(true);
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
        if (profile) {
          setUser(profile as unknown as User);
          localStorage.setItem('livestock_user', JSON.stringify(profile));
        }
      }
    };
    checkSupabase();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setIsSupabase(true);
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUser(profile as unknown as User);
          localStorage.setItem('livestock_user', JSON.stringify(profile));
        }
      } else {
        setIsSupabase(false);
        setUser(null);
        localStorage.removeItem('livestock_user');
      }
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Try Supabase Auth first
    const { data: authData } = await supabase.auth.signInWithPassword({ email, password });
    if (authData.session) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.session.user.id)
        .single();
      if (profile) {
        setUser(profile as unknown as User);
        localStorage.setItem('livestock_user', JSON.stringify(profile));
        setIsSupabase(true);
        return true;
      }
    }

    // Fallback to demo accounts
    const expectedPassword = DEMO_CREDENTIALS[email];
    if (!expectedPassword || expectedPassword !== password) return false;
    const found = mockUsers.find(u => u.email === email);
    if (!found) return false;
    setUser(found);
    localStorage.setItem('livestock_user', JSON.stringify(found));
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
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
