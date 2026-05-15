import { supabase } from '../supabase';
import { supabaseAdmin } from '../supabaseAdmin';
import type { Medicine, MedicineInventory, MedicinePurchase, MedicineUsage } from '../../types';

// ─── Medicines ───
export async function getMedicines() {
  const { data, error } = await supabase.from('medicines').select('*').order('name');
  if (error) throw error;
  return data as Medicine[];
}

export async function createMedicine(medicine: Partial<Medicine>) {
  const { data, error } = await supabaseAdmin.from('medicines').insert(medicine).select().single();
  if (error) throw error;
  return data as Medicine;
}

// ─── Medicine Inventory ───
export async function getMedicineInventory() {
  const { data, error } = await supabase.from('medicine_inventory').select('*, medicines(name, type)').order('medicines(name)');
  if (error) throw error;
  return data as (MedicineInventory & { medicines: { name: string; type: string } })[];
}

// ─── Medicine Purchases ───
export async function createMedicinePurchase(purchase: Partial<MedicinePurchase>) {
  const { data, error } = await supabaseAdmin.from('medicine_purchases').insert(purchase).select().single();
  if (error) throw error;
  return data as MedicinePurchase;
}

// ─── Medicine Usages ───
export async function createMedicineUsage(usage: Partial<MedicineUsage>) {
  const { data, error } = await supabaseAdmin.from('medicine_usages').insert(usage).select().single();
  if (error) throw error;
  return data as MedicineUsage;
}

// ─── Inventory Summary ───
export async function getMedicineInventorySummary() {
  const { data, error } = await supabase.from('medicine_inventory').select('total_cost, min_threshold, quantity_on_hand');
  if (error) throw error;
  return {
    totalValue: data.reduce((s, i) => s + Number(i.total_cost), 0),
    lowStock: data.filter(i => Number(i.quantity_on_hand) < Number(i.min_threshold)).length,
  };
}
