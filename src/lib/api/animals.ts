import { supabase } from '../supabase';
import type { Animal, WeightRecord, AnimalMovement, HerdGroup, HerdGroupMember } from '../../types';

// ─── Animals ───
export async function getAnimals(params?: {
  species?: string; status?: string; location_id?: string; herd_group_id?: string;
}) {
  let q = supabase.from('animals').select('*, locations!animals_current_location_id_fkey(name)');
  if (params?.species) q = q.eq('species', params.species);
  if (params?.status) q = q.eq('status', params.status);
  if (params?.location_id) q = q.eq('current_location_id', params.location_id);
  if (params?.herd_group_id) {
    const { data: memberIds } = await supabase.from('herd_group_members').select('animal_id').eq('herd_group_id', params.herd_group_id);
    if (memberIds?.length) q = q.in('id', memberIds.map(m => m.animal_id));
  }
  q = q.order('created_at', { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  return data as (Animal & { locations: { name: string } | null })[];
}

export async function getAnimal(id: string) {
  const { data, error } = await supabase.from('animals').select('*, locations!animals_current_location_id_fkey(name), dam:dam_id(tag_id, breed), sire:sire_id(tag_id, breed)').eq('id', id).single();
  if (error) throw error;
  return data as Animal & { locations: { name: string } | null; dam: { tag_id: string; breed: string } | null; sire: { tag_id: string; breed: string } | null };
}

export async function createAnimal(animal: Partial<Animal>) {
  const { data, error } = await supabase.from('animals').insert(animal).select().single();
  if (error) throw error;
  return data as Animal;
}

export async function updateAnimal(id: string, animal: Partial<Animal>) {
  const { data, error } = await supabase.from('animals').update(animal).eq('id', id).select().single();
  if (error) throw error;
  return data as Animal;
}

export async function deleteAnimal(id: string) {
  const { error } = await supabase.from('animals').delete().eq('id', id);
  if (error) throw error;
}

// ─── Weight Records ───
export async function getWeightRecords(animalId: string) {
  const { data, error } = await supabase.from('weight_records').select('*, users!weight_records_recorded_by_fkey(full_name)').eq('animal_id', animalId).order('weigh_date', { ascending: false });
  if (error) throw error;
  return data as (WeightRecord & { users: { full_name: string } | null })[];
}

export async function createWeightRecord(record: Partial<WeightRecord>) {
  const { data, error } = await supabase.from('weight_records').insert(record).select().single();
  if (error) throw error;
  return data as WeightRecord;
}

// ─── Movements ───
export async function getMovements(animalId: string) {
  const { data, error } = await supabase.from('animal_movements').select('*, from:from_location_id(name), to:to_location_id(name)').eq('animal_id', animalId).order('movement_date', { ascending: false });
  if (error) throw error;
  return data as (AnimalMovement & { from: { name: string } | null; to: { name: string } | null })[];
}

export async function createMovement(movement: Partial<AnimalMovement>) {
  const { data, error } = await supabase.from('animal_movements').insert(movement).select().single();
  if (error) throw error;
  return data as AnimalMovement;
}

// ─── Herd Groups ───
export async function getHerdGroups() {
  const { data, error } = await supabase.from('herd_groups').select('*, locations(name)').order('name');
  if (error) throw error;
  return data as (HerdGroup & { locations: { name: string } | null })[];
}

export async function createHerdGroup(group: Partial<HerdGroup>) {
  const { data, error } = await supabase.from('herd_groups').insert(group).select().single();
  if (error) throw error;
  return data as HerdGroup;
}

export async function getHerdGroupMembers(herdGroupId: string) {
  const { data, error } = await supabase.from('herd_group_members').select('*, animals(tag_id, species, breed, gender, status)').eq('herd_group_id', herdGroupId);
  if (error) throw error;
  return data as (HerdGroupMember & { animals: Partial<Animal> })[];
}

// ─── Counts ───
export async function getAnimalCounts() {
  const { data, error } = await supabase.from('animals').select('species, status');
  if (error) throw error;
  const species: Record<string, number> = {};
  const status: Record<string, number> = {};
  for (const a of data) {
    species[a.species] = (species[a.species] || 0) + 1;
    status[a.status] = (status[a.status] || 0) + 1;
  }
  return { species, status, total: data.length };
}
