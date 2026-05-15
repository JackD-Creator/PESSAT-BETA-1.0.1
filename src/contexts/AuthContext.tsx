import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../lib/db';
import type { User, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!cancelled && data.session) {
          const profile = await getUserProfile(data.session.user.id);
          if (!cancelled && profile) {
            setUser(profile as unknown as User);
            localStorage.setItem('livestock_user', JSON.stringify(profile));
          }
        }
      } catch {
        // ignore
      }
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const profile = await getUserProfile(session.user.id);
        if (profile) {
          setUser(profile as unknown as User);
          localStorage.setItem('livestock_user', JSON.stringify(profile));
        }
      } else {
        setUser(null);
        localStorage.removeItem('livestock_user');
      }
    });
    return () => {
      cancelled = true;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return error.message;
      if (!data.session) return 'Login failed';
      const profile = await getUserProfile(data.session.user.id);
      if (profile) {
        setUser(profile as unknown as User);
        localStorage.setItem('livestock_user', JSON.stringify(profile));
        return null;
      }
      return 'User profile not found';
    } catch {
      return 'Unable to connect to server';
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return error.message;
      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          full_name: fullName,
          email,
          role: 'worker',
          is_active: true,
        });
        if (profileError) return profileError.message;
      }
      return null;
    } catch {
      return 'Unable to connect to server';
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    localStorage.removeItem('livestock_user');
  }, []);

  const hasRole = useCallback((roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, isAuthenticated: !!user, isLoading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
