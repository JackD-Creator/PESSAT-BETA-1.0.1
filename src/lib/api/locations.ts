import { supabaseAdmin } from '../supabaseAdmin';
import type { Location } from '../../types';

export async function getLocations() {
  const { data, error } = await supabaseAdmin.from('locations').select('*').order('name');
  if (error) throw error;
  return data as Location[];
}

export async function createLocation(location: Partial<Location>) {
  const { data, error } = await supabaseAdmin.from('locations').insert(location).select().single();
  if (error) throw error;
  return data as Location;
}

export async function updateLocation(id: string, location: Partial<Location>) {
  const { data, error } = await supabaseAdmin.from('locations').update(location).eq('id', id).select().single();
  if (error) throw error;
  return data as Location;
}

export async function deleteLocation(id: string) {
  const { error } = await supabaseAdmin.from('locations').delete().eq('id', id);
  if (error) throw error;
}
