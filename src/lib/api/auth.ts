import { supabaseAdmin } from '../supabaseAdmin';
import type { User } from '../../types';

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { user: data.user };
}

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabaseAdmin.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) return { error: error.message };
  return { user: data.user };
}

export async function logout() {
  const { error } = await supabaseAdmin.auth.signOut();
  if (error) return { error: error.message };
  return {};
}

export async function getCurrentUser() {
  const { data } = await supabaseAdmin.auth.getUser();
  return data.user;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
  if (error) return null;
  return data as User;
}

export function onAuthChange(callback: (user: unknown) => void) {
  return supabaseAdmin.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

// ─── Admin: User Management ───

export async function getUsers() {
  const { data, error } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });
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
  const { data, error } = await supabaseAdmin.from('users').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as User;
}

export async function deactivateUser(id: string) {
  return updateUser(id, { is_active: false });
}

export async function activateUser(id: string) {
  return updateUser(id, { is_active: true });
}

const DATA_TABLES = [
  'animals','locations','herd_groups','herd_group_members',
  'weight_records','animal_movements',
  'health_records','vaccinations','breeding_events',
  'feeds','feed_inventory','feed_purchases','feed_consumption',
  'feed_formulas','feed_formula_items','nutrition_requirements',
  'medicines','medicine_inventory','medicine_purchases','medicine_usages',
  'daily_production','product_sales','animal_purchases','animal_sales',
  'labor_expenses','operational_expenses','stock_adjustments',
  'financial_transactions','alerts','tasks',
  'attribute_definitions','animal_attributes','genetic_records',
];

export async function deleteUser(id: string) {
  for (const table of DATA_TABLES) {
    await supabaseAdmin.from(table).delete().eq('user_id', id);
  }
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authError) throw new Error(authError.message);
  const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
  if (error) throw error;
}
