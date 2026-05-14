import { supabase } from '../supabase';
import { supabaseAdmin } from '../supabaseAdmin';
import type { User } from '../../types';

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { user: data.user };
}

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) return { error: error.message };
  return { user: data.user };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) return { error: error.message };
  return {};
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) return null;
  return data as User;
}

export function onAuthChange(callback: (user: unknown) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

// ─── Admin: User Management ───

export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as User[];
}

export async function createUser(input: {
  email: string; password: string; full_name: string; role: User['role']; phone?: string;
}) {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Failed to create auth user');

  const { data: profile, error: profileError } = await supabaseAdmin.from('users').insert({
    id: authData.user.id,
    full_name: input.full_name,
    email: input.email,
    password_hash: input.password,
    role: input.role,
    phone: input.phone || null,
    is_active: true,
  }).select().single();
  if (profileError) throw new Error(profileError.message);
  return profile as User;
}

export async function updateUser(id: string, input: {
  full_name?: string; role?: User['role']; phone?: string; is_active?: boolean;
}) {
  const { data, error } = await supabase.from('users').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as User;
}

export async function deactivateUser(id: string) {
  return updateUser(id, { is_active: false });
}

export async function activateUser(id: string) {
  return updateUser(id, { is_active: true });
}
