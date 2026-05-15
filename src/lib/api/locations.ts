import { supabase } from '../supabase';
import { supabaseAdmin } from '../supabaseAdmin';
import type { Location } from '../../types';

export async function getLocations() {
  const { data, error } = await supabase.from('locations').select('*').order('name');
  if (error) throw error;
  return data as Location[];
}

export async function createLocation(location: Partial<Location>) {
  const { data, error } = await supabaseAdmin.from('locations').insert(location).select().single();
  if (error) throw error;
  return data as Location;
}
