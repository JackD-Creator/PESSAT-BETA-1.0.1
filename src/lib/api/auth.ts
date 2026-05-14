import { supabase } from '../supabase';
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
