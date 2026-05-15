import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { type User, type UserRole } from '../lib/mockData';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../lib/db';

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
    try {
      const { data: authData } = await supabase.auth.signInWithPassword({ email, password });
      if (authData.session) {
        const profile = await getUserProfile(authData.session.user.id);
        if (profile) {
          setUser(profile);
          localStorage.setItem('livestock_user', JSON.stringify(profile));
          setIsSupabase(true);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
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
