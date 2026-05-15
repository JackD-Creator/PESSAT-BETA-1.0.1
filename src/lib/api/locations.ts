import { supabaseAdmin } from '../supabaseAdmin';
import type { Location } from '../../types';

export async function getLocations(userId: string) {
  const q = supabaseAdmin.from('locations').select('*').eq('user_id', userId);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return data as Location[];
}

export async function createLocation(userId: string, location: Partial<Location>) {
  const { data, error } = await supabaseAdmin.from('locations').insert({ ...location, user_id: userId }).select().single();
  if (error) throw error;
  return data as Location;
}

export async function updateLocation(userId: string, id: string, location: Partial<Location>) {
  const { data, error } = await supabaseAdmin.from('locations').update(location).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as Location;
}

export async function deleteLocation(userId: string, id: string) {
  const { error } = await supabaseAdmin.from('locations').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}
