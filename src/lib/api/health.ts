import { supabaseAdmin } from '../supabaseAdmin';
import type { HealthRecord, Vaccination, BreedingEvent } from '../../types';

// ─── Health Records ───
export async function getHealthRecords(userId: string, animalId?: string) {
  let q = supabaseAdmin.from('health_records').select('*, animals!inner(tag_id)').eq('user_id', userId).order('record_date', { ascending: false });
  if (animalId) q = q.eq('animal_id', animalId);
  const { data, error } = await q;
  if (error) throw error;
  return data as (HealthRecord & { animals: { tag_id: string } })[];
}

export async function createHealthRecord(userId: string, record: Partial<HealthRecord>) {
  const { data, error } = await supabaseAdmin.from('health_records').insert({ ...record, user_id: userId }).select().single();
  if (error) throw error;
  return data as HealthRecord;
}

export async function resolveHealthRecord(userId: string, id: string, resolved: boolean) {
  const { error } = await supabaseAdmin.from('health_records').update({ is_resolved: resolved }).eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// ─── Vaccinations ───
export async function getVaccinations(userId: string, animalId?: string) {
  let q = supabaseAdmin.from('vaccinations').select('*, animals!vaccinations_animal_id_fkey(tag_id), herd_groups(name)').eq('user_id', userId).order('date_administered', { ascending: false });
  if (animalId) q = q.eq('animal_id', animalId);
  const { data, error } = await q;
  if (error) throw error;
  return data as (Vaccination & { animals: { tag_id: string } | null; herd_groups: { name: string } | null })[];
}

export async function createVaccination(userId: string, vaccination: Partial<Vaccination>) {
  const { data, error } = await supabaseAdmin.from('vaccinations').insert({ ...vaccination, user_id: userId }).select().single();
  if (error) throw error;
  return data as Vaccination;
}

// ─── Breeding Events ───
export async function getBreedingEvents(userId: string, animalId?: string) {
  let q = supabaseAdmin.from('breeding_events').select('*, animals!breeding_events_animal_id_fkey(tag_id), sire:sire_id(tag_id)').eq('user_id', userId).order('event_date', { ascending: false });
  if (animalId) q = q.eq('animal_id', animalId);
  const { data, error } = await q;
  if (error) throw error;
  return data as (BreedingEvent & { animals: { tag_id: string }; sire: { tag_id: string } | null })[];
}

export async function createBreedingEvent(userId: string, event: Partial<BreedingEvent>) {
  const { data, error } = await supabaseAdmin.from('breeding_events').insert({ ...event, user_id: userId }).select().single();
  if (error) throw error;
  return data as BreedingEvent;
}
