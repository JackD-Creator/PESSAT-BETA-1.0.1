import { supabaseAdmin } from '../supabaseAdmin';
import { recordFinancialTransaction } from './finance';
import type { Medicine, MedicineInventory, MedicinePurchase, MedicineUsage } from '../../types';

// ─── Medicines ───
export async function getMedicines(userId: string) {
  const q = supabaseAdmin.from('medicines').select('*').eq('user_id', userId);
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
  const q = supabaseAdmin.from('medicine_inventory').select('*, medicines(name, type)').eq('user_id', userId);
  const { data, error } = await q.order('medicines(name)');
  if (error) throw error;
  return data as (MedicineInventory & { medicines: { name: string; type: string } })[];
}

export async function updateMedicineThreshold(userId: string, id: string, min_threshold: number) {
  const { error } = await supabaseAdmin.from('medicine_inventory').update({ min_threshold }).eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// ─── Medicine Purchases ───
export async function getMedicinePurchases(userId: string) {
  const q = supabaseAdmin.from('medicine_purchases').select('*, medicines(name)').eq('user_id', userId);
  const { data, error } = await q.order('purchase_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as (MedicinePurchase & { medicines: { name: string } })[];
}

export async function createMedicinePurchase(userId: string, purchase: Partial<MedicinePurchase>) {
  const { data, error } = await supabaseAdmin.from('medicine_purchases').insert({ ...purchase, user_id: userId }).select().single();
  if (error) throw error;

  const inv = await supabaseAdmin.from('medicine_inventory').select('*').eq('medicine_id', purchase.medicine_id!).eq('user_id', userId).maybeSingle();
  if (inv.data) {
    const oldQty = Number(inv.data.quantity_on_hand);
    const oldAvg = Number(inv.data.avg_cost_per_unit);
    const newQty = Number(purchase.quantity) || 0;
    const newPpu = Number(purchase.price_per_unit) || 0;
    const avg = oldQty > 0 ? (oldAvg * oldQty + newPpu * newQty) / (oldQty + newQty) : newPpu;
    await supabaseAdmin.from('medicine_inventory').update({
      quantity_on_hand: oldQty + newQty,
      avg_cost_per_unit: Math.round(avg * 100) / 100,
      total_cost: (oldQty + newQty) * Math.round(avg * 100) / 100,
    }).eq('id', inv.data.id);
  } else {
    const ppu = Number(purchase.price_per_unit) || 0;
    const qty = Number(purchase.quantity) || 0;
    await supabaseAdmin.from('medicine_inventory').insert({
      medicine_id: purchase.medicine_id!,
      user_id: userId,
      quantity_on_hand: qty,
      avg_cost_per_unit: ppu,
      total_cost: qty * ppu,
      min_threshold: 0,
    });
  }

  // Record financial transaction
  const medAmount = (Number(purchase.quantity) || 0) * (Number(purchase.price_per_unit) || 0);
  if (medAmount > 0) {
    recordFinancialTransaction(userId, {
      type: 'expense',
      category: 'medicine_purchase',
      amount: medAmount,
      description: 'Pembelian obat',
      transaction_date: purchase.purchase_date || new Date().toISOString().split('T')[0],
      cash_flow: 'cash_out',
      source_table: 'medicine_purchases',
      source_id: data?.id,
    });
  }

  return data as MedicinePurchase;
}

// ─── Medicine Usages ───
export async function getMedicineUsages(userId: string) {
  const q = supabaseAdmin.from('medicine_usages').select('*, medicines(name)').eq('user_id', userId);
  const { data, error } = await q.order('usage_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as (MedicineUsage & { medicines: { name: string } })[];
}

export async function createMedicineUsage(userId: string, usage: Partial<MedicineUsage>) {
  const { data, error } = await supabaseAdmin.from('medicine_usages').insert({ ...usage, user_id: userId }).select().single();
  if (error) throw error;

  const inv = await supabaseAdmin.from('medicine_inventory').select('*').eq('medicine_id', usage.medicine_id!).eq('user_id', userId).maybeSingle();
  if (inv.data) {
    const oldQty = Number(inv.data.quantity_on_hand);
    const rem = Math.max(0, oldQty - Number(usage.quantity));
    await supabaseAdmin.from('medicine_inventory').update({
      quantity_on_hand: rem,
      total_cost: rem * Number(inv.data.avg_cost_per_unit),
    }).eq('id', inv.data.id);
  }

  // Record financial transaction (non-cash for medicine usage)
  const usageAmt = (Number(usage.quantity) || 0) * (Number(inv.data?.avg_cost_per_unit) || 0);
  if (usageAmt > 0) {
    recordFinancialTransaction(userId, {
      type: 'expense',
      category: 'medicine_usage',
      amount: usageAmt,
      description: 'Pemakaian obat',
      transaction_date: usage.usage_date || new Date().toISOString().split('T')[0],
      cash_flow: 'non_cash',
      source_table: 'medicine_usages',
      source_id: data?.id,
    });
  }

  return data as MedicineUsage;
}

// ─── Inventory Summary ───
export async function updateMedicine(userId: string, id: string, medicine: Partial<Medicine>) {
  const { data, error } = await supabaseAdmin.from('medicines').update(medicine).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as Medicine;
}

export async function deleteMedicine(userId: string, id: string) {
  const { error } = await supabaseAdmin.from('medicines').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function updateMedicinePurchase(userId: string, id: string, purchase: Partial<MedicinePurchase>) {
  const { data, error } = await supabaseAdmin.from('medicine_purchases').update(purchase).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as MedicinePurchase;
}

export async function deleteMedicinePurchase(userId: string, id: string) {
  const { error } = await supabaseAdmin.from('medicine_purchases').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function updateMedicineUsage(userId: string, id: string, usage: Partial<MedicineUsage>) {
  const { data, error } = await supabaseAdmin.from('medicine_usages').update(usage).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as MedicineUsage;
}

export async function deleteMedicineUsage(userId: string, id: string) {
  const { error } = await supabaseAdmin.from('medicine_usages').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function getMedicineInventorySummary(userId: string) {
  const q = supabaseAdmin.from('medicine_inventory').select('total_cost, min_threshold, quantity_on_hand').eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return {
    totalValue: data.reduce((s, i) => s + Number(i.total_cost), 0),
    lowStock: data.filter(i => Number(i.quantity_on_hand) < Number(i.min_threshold)).length,
  };
}
