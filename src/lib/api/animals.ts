import { supabaseAdmin } from '../supabaseAdmin';
import type { Animal, WeightRecord, AnimalMovement, HerdGroup, HerdGroupMember } from '../../types';

// ─── Animals ───
export async function getAnimals(userId: string, params?: {
  species?: string; status?: string; location_id?: string; herd_group_id?: string;
}) {
  console.log('[getAnimals] userId:', userId);
  let q = supabaseAdmin.from('animals').select('*, locations!animals_current_location_id_fkey(name)');
  q = q.eq('user_id', userId);
  if (params?.species) q = q.eq('species', params.species);
  if (params?.status) q = q.eq('status', params.status);
  if (params?.location_id) q = q.eq('current_location_id', params.location_id);
  if (params?.herd_group_id) {
    const { data: memberIds } = await supabaseAdmin.from('herd_group_members').select('animal_id').eq('herd_group_id', params.herd_group_id);
    if (memberIds?.length) q = q.in('id', memberIds.map(m => m.animal_id));
  }
  q = q.order('created_at', { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  return data as (Animal & { locations: { name: string } | null })[];
}

export async function getAnimal(userId: string, id: string) {
  const q = supabaseAdmin.from('animals').select('*, locations!animals_current_location_id_fkey(name), dam:dam_id(tag_id, breed), sire:sire_id(tag_id, breed)').eq('id', id).eq('user_id', userId);
  const { data, error } = await q.single();
  if (error) throw error;
  return data as Animal & { locations: { name: string } | null; dam: { tag_id: string; breed: string } | null; sire: { tag_id: string; breed: string } | null };
}

async function syncLocationOccupancy(userId: string, locationId: string) {
  if (!locationId) return;
  const { count } = await supabaseAdmin.from('animals').select('id', { count: 'exact', head: true }).eq('current_location_id', locationId).eq('user_id', userId);
  await supabaseAdmin.from('locations').update({ current_occupancy: count || 0 }).eq('id', locationId).eq('user_id', userId);
}

export async function createAnimal(userId: string, animal: Partial<Animal>) {
  const { data, error } = await supabaseAdmin.from('animals').insert({ ...animal, user_id: userId }).select().single();
  if (error) throw error;
  if (data.current_location_id) syncLocationOccupancy(userId, data.current_location_id);
  return data as Animal;
}

export async function updateAnimal(userId: string, id: string, animal: Partial<Animal>) {
  // Get old location before updating
  const { data: old } = await supabaseAdmin.from('animals').select('current_location_id').eq('id', id).eq('user_id', userId).single();
  const { data, error } = await supabaseAdmin.from('animals').update(animal).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  // Sync old and new locations
  if (old?.current_location_id) syncLocationOccupancy(userId, old.current_location_id);
  if (data.current_location_id) syncLocationOccupancy(userId, data.current_location_id);
  return data as Animal;
}

export async function deleteAnimal(userId: string, id: string) {
  const { data: old } = await supabaseAdmin.from('animals').select('current_location_id').eq('id', id).eq('user_id', userId).single();
  const { error } = await supabaseAdmin.from('animals').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
  if (old?.current_location_id) syncLocationOccupancy(userId, old.current_location_id);
}

// ─── Weight Records ───
export async function getWeightRecords(userId: string, animalId: string) {
  const q = supabaseAdmin.from('weight_records').select('*, users!weight_records_recorded_by_fkey(full_name)').eq('animal_id', animalId).eq('user_id', userId);
  const { data, error } = await q.order('weigh_date', { ascending: false });
  if (error) throw error;
  return data as (WeightRecord & { users: { full_name: string } | null })[];
}

export async function createWeightRecord(userId: string, record: Partial<WeightRecord>) {
  const { data, error } = await supabaseAdmin.from('weight_records').insert({ ...record, user_id: userId }).select().single();
  if (error) throw error;
  return data as WeightRecord;
}

// ─── Movements ───
export async function getMovements(userId: string, animalId: string) {
  const q = supabaseAdmin.from('animal_movements').select('*, from:from_location_id(name), to:to_location_id(name)').eq('animal_id', animalId).eq('user_id', userId);
  const { data, error } = await q.order('movement_date', { ascending: false });
  if (error) throw error;
  return data as (AnimalMovement & { from: { name: string } | null; to: { name: string } | null })[];
}

export async function createMovement(userId: string, movement: Partial<AnimalMovement>) {
  const { data, error } = await supabaseAdmin.from('animal_movements').insert({ ...movement, user_id: userId }).select().single();
  if (error) throw error;
  return data as AnimalMovement;
}

// ─── Herd Groups ───
export async function getHerdGroups(userId: string) {
  const q = supabaseAdmin.from('herd_groups').select('*, locations(name)').eq('user_id', userId);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return data as (HerdGroup & { locations: { name: string } | null })[];
}

export async function createHerdGroup(userId: string, group: Partial<HerdGroup>) {
  const { data, error } = await supabaseAdmin.from('herd_groups').insert({ ...group, user_id: userId }).select().single();
  if (error) throw error;
  return data as HerdGroup;
}

export async function updateHerdGroup(userId: string, id: string, group: Partial<HerdGroup>) {
  const { data, error } = await supabaseAdmin.from('herd_groups').update(group).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as HerdGroup;
}

export async function deleteHerdGroup(userId: string, id: string) {
  const { error } = await supabaseAdmin.from('herd_groups').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function getHerdGroupMembers(_userId: string, herdGroupId: string) {
  const q = supabaseAdmin.from('herd_group_members').select('*, animals(tag_id, species, breed, gender, status)').eq('herd_group_id', herdGroupId);
  const { data, error } = await q;
  if (error) throw error;
  return data as (HerdGroupMember & { animals: Partial<Animal> })[];
}

// ─── Counts ───
export async function getAnimalCounts(userId: string) {
  const q = supabaseAdmin.from('animals').select('species, status').eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  const species: Record<string, number> = {};
  const status: Record<string, number> = {};
  for (const a of data) {
    species[a.species] = (species[a.species] || 0) + 1;
    status[a.status] = (status[a.status] || 0) + 1;
  }
  return { species, status, total: data.length };
}

// ─── Animal Attributes ───
export async function getAnimalAttributes(userId: string, animalId: string) {
  const { data, error } = await supabaseAdmin.from('animal_attributes').select('*').eq('animal_id', animalId).eq('user_id', userId);
  if (error) throw error;
  return data as any[];
}
