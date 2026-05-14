import { supabase } from '../supabase';
import type { HealthRecord, Vaccination, BreedingEvent } from '../../types';

// ─── Health Records ───
export async function getHealthRecords(animalId?: string) {
  let q = supabase.from('health_records').select('*, animals!inner(tag_id)').order('record_date', { ascending: false });
  if (animalId) q = q.eq('animal_id', animalId);
  const { data, error } = await q;
  if (error) throw error;
  return data as (HealthRecord & { animals: { tag_id: string } })[];
}

export async function createHealthRecord(record: Partial<HealthRecord>) {
  const { data, error } = await supabase.from('health_records').insert(record).select().single();
  if (error) throw error;
  return data as HealthRecord;
}

export async function resolveHealthRecord(id: string, resolved: boolean) {
  const { error } = await supabase.from('health_records').update({ is_resolved: resolved }).eq('id', id);
  if (error) throw error;
}

// ─── Vaccinations ───
export async function getVaccinations(animalId?: string) {
  let q = supabase.from('vaccinations').select('*, animals!vaccinations_animal_id_fkey(tag_id), herd_groups(name)').order('date_administered', { ascending: false });
  if (animalId) q = q.eq('animal_id', animalId);
  const { data, error } = await q;
  if (error) throw error;
  return data as (Vaccination & { animals: { tag_id: string } | null; herd_groups: { name: string } | null })[];
}

export async function createVaccination(vaccination: Partial<Vaccination>) {
  const { data, error } = await supabase.from('vaccinations').insert(vaccination).select().single();
  if (error) throw error;
  return data as Vaccination;
}

// ─── Breeding Events ───
export async function getBreedingEvents(animalId?: string) {
  let q = supabase.from('breeding_events').select('*, animals!breeding_events_animal_id_fkey(tag_id), sire:sire_id(tag_id)').order('event_date', { ascending: false });
  if (animalId) q = q.eq('animal_id', animalId);
  const { data, error } = await q;
  if (error) throw error;
  return data as (BreedingEvent & { animals: { tag_id: string }; sire: { tag_id: string } | null })[];
}

export async function createBreedingEvent(event: Partial<BreedingEvent>) {
  const { data, error } = await supabase.from('breeding_events').insert(event).select().single();
  if (error) throw error;
  return data as BreedingEvent;
}
