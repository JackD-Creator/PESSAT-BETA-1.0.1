import { supabaseAdmin } from '../supabaseAdmin';
import type { Medicine, MedicineInventory, MedicinePurchase, MedicineUsage } from '../../types';

// ─── Medicines ───
export async function getMedicines(userId: string) {
  let q = supabaseAdmin.from('medicines').select('*').eq('user_id', userId);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return data as Medicine[];
}

export async function createMedicine(userId: string, medicine: Partial<Medicine>) {
  const { data, error } = await supabaseAdmin.from('medicines').insert({ ...medicine, user_id: userId }).select().single();
  if (error) throw error;
  return data as Medicine;
}

// ─── Medicine Inventory ───
export async function getMedicineInventory(userId: string) {
  let q = supabaseAdmin.from('medicine_inventory').select('*, medicines(name, type)').eq('user_id', userId);
  const { data, error } = await q.order('medicines(name)');
  if (error) throw error;
  return data as (MedicineInventory & { medicines: { name: string; type: string } })[];
}

// ─── Medicine Purchases ───
export async function createMedicinePurchase(userId: string, purchase: Partial<MedicinePurchase>) {
  const { data, error } = await supabaseAdmin.from('medicine_purchases').insert({ ...purchase, user_id: userId }).select().single();
  if (error) throw error;
  return data as MedicinePurchase;
}

// ─── Medicine Usages ───
export async function createMedicineUsage(userId: string, usage: Partial<MedicineUsage>) {
  const { data, error } = await supabaseAdmin.from('medicine_usages').insert({ ...usage, user_id: userId }).select().single();
  if (error) throw error;
  return data as MedicineUsage;
}

// ─── Inventory Summary ───
export async function getMedicineInventorySummary(userId: string) {
  let q = supabaseAdmin.from('medicine_inventory').select('total_cost, min_threshold, quantity_on_hand').eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return {
    totalValue: data.reduce((s, i) => s + Number(i.total_cost), 0),
    lowStock: data.filter(i => Number(i.quantity_on_hand) < Number(i.min_threshold)).length,
  };
}
