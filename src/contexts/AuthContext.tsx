import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import type { User, UserRole, FarmProfile } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole, farm?: Partial<FarmProfile>) => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('livestock_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading] = useState(false);

  // No onAuthStateChange — we log in via REST fetch, not the GoTrueClient,
  // so the JS client's session is always null and would overwrite our state.

  const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
    Promise.race([
      promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
    ]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      // 1. Auth via REST (no JS client)
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!res.ok) return result.error_description || result.error || 'Login failed';
      // 2. Profile via REST (no JS client – avoids GoTrueClient/PostgREST init hangs)
      const pRes = await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${result.user.id}&select=*`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        },
      );
      const pData = await pRes.json();
      let profile = pData?.[0] ?? null;
      if (profile) {
        // If the fetched profile has no valid role, restore it to 'owner'
        const validRoles = ['owner', 'manager', 'worker'];
        if (!validRoles.includes(profile.role)) {
          profile = { ...profile, role: 'owner' };
          await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${result.user.id}`, {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_SERVICE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ role: 'owner' }),
          });
        }
        // If manager/worker linked to an owner, use owner's ID for data scope
        if (['manager', 'worker'].includes(profile.role) && profile.owner_id) {
          profile = { ...profile, id: profile.owner_id };
        }
        setUser(profile as unknown as User);
        localStorage.setItem('livestock_user', JSON.stringify(profile));
        return null;
      }
      return 'User profile not found';
    } catch (e: unknown) {
      console.error('login error:', e);
      if (e instanceof TypeError) return 'Gagal terhubung ke server. Periksa koneksi internet.';
      return e instanceof Error ? e.message : 'Terjadi kesalahan';
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: UserRole = 'owner', farm?: Partial<FarmProfile>): Promise<string | null> => {
    try {
      const { data, error } = await withTimeout(
        supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true }),
        15000,
      );
      if (error) return error.message;
      if (data.user) {
        const { error: profileError } = await supabaseAdmin.from('users').insert({
          id: data.user.id,
          full_name: fullName,
          email,
          role,
          is_active: true,
          password_hash: 'auth',
        });
        if (profileError) return profileError.message;
        if (farm) {
          const { error: farmError } = await supabaseAdmin.from('farm_profiles').insert({
            user_id: data.user.id,
            farm_name: farm.farm_name || '',
            owner_name: farm.owner_name || '',
            address: farm.address || '',
            farm_scale: farm.farm_scale || 'kecil',
            phone: farm.phone || '',
            email: farm.email || '',
            website: farm.website || '',
            social_media: farm.social_media || '',
          });
          if (farmError) return farmError.message;
        }
      }
      return null;
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'timeout') return 'Koneksi ke server lambat, coba lagi';
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
