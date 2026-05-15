import { supabaseAdmin } from '../supabaseAdmin';
import { recordFinancialTransaction } from './finance';
import type { DailyProduction, ProductSale, AnimalPurchase, AnimalSale } from '../../types';

// ─── Daily Production ───
export async function getDailyProduction(userId: string, params?: { dateFrom?: string; dateTo?: string; productType?: string }) {
  let q = supabaseAdmin.from('daily_production').select('*, animals!daily_production_animal_id_fkey(tag_id), herd_groups(name)').eq('user_id', userId).order('production_date', { ascending: false });
  if (params?.dateFrom) q = q.gte('production_date', params.dateFrom);
  if (params?.dateTo) q = q.lte('production_date', params.dateTo);
  if (params?.productType) q = q.eq('product_type', params.productType);
  const { data, error } = await q.limit(50);
  if (error) throw error;
  return data as (DailyProduction & { animals: { tag_id: string } | null; herd_groups: { name: string } | null })[];
}

export async function createDailyProduction(userId: string, record: Partial<DailyProduction>) {
  const { data, error } = await supabaseAdmin.from('daily_production').insert({ ...record, user_id: userId }).select().single();
  if (error) throw error;
  return data as DailyProduction;
}

export async function getProductionSummary(userId: string, days: number = 7) {
  const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const q = supabaseAdmin.from('daily_production')
    .select('production_date, product_type, quantity, unit')
    .gte('production_date', from)
    .eq('user_id', userId);
  const { data, error } = await q.order('production_date');
  if (error) throw error;
  return data;
}

// ─── Product Sales ───
export async function getProductSales(userId: string) {
  const q = supabaseAdmin.from('product_sales').select('*').eq('user_id', userId);
  const { data, error } = await q.order('sale_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as ProductSale[];
}

export async function createProductSale(userId: string, sale: Partial<ProductSale>) {
  const { data, error } = await supabaseAdmin.from('product_sales').insert({ ...sale, user_id: userId }).select().single();
  if (error) throw error;

  // Record financial transaction
  const saleAmount = (Number(sale.quantity) || 0) * (Number(sale.price_per_unit) || 0);
  if (saleAmount > 0) {
    recordFinancialTransaction(userId, {
      type: 'income',
      category: 'product_sale',
      amount: saleAmount,
      description: `Penjualan ${sale.product_type || 'produk'}`,
      transaction_date: sale.sale_date || new Date().toISOString().split('T')[0],
      cash_flow: 'cash_in',
      source_table: 'product_sales',
      source_id: data?.id,
    });
  }

  return data as ProductSale;
}

// ─── Animal Purchases ───
export async function getAnimalPurchases(userId: string) {
  const q = supabaseAdmin.from('animal_purchases').select('*, animals(tag_id, species, breed)').eq('user_id', userId);
  const { data, error } = await q.order('purchase_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as (AnimalPurchase & { animals: { tag_id: string; species: string; breed: string } })[];
}

export async function createAnimalPurchase(userId: string, purchase: Partial<AnimalPurchase>) {
  const { data, error } = await supabaseAdmin.from('animal_purchases').insert({ ...purchase, user_id: userId }).select().single();
  if (error) throw error;

  const apAmount = purchase.total_cost || purchase.purchase_price || 0;
  if (apAmount > 0) {
    recordFinancialTransaction(userId, {
      type: 'expense',
      category: 'animal_purchase',
      amount: apAmount,
      description: 'Pembelian ternak',
      transaction_date: purchase.purchase_date || new Date().toISOString().split('T')[0],
      cash_flow: 'cash_out',
      source_table: 'animal_purchases',
      source_id: data?.id,
    });
  }

  return data as AnimalPurchase;
}

// ─── Animal Sales ───
export async function getAnimalSales(userId: string) {
  const q = supabaseAdmin.from('animal_sales').select('*, animals(tag_id, species, breed)').eq('user_id', userId);
  const { data, error } = await q.order('sale_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as (AnimalSale & { animals: { tag_id: string; species: string; breed: string } })[];
}

export async function createAnimalSale(userId: string, sale: Partial<AnimalSale>) {
  const { data, error } = await supabaseAdmin.from('animal_sales').insert({ ...sale, user_id: userId }).select().single();
  if (error) throw error;

  const asAmount = sale.sale_price || 0;
  if (asAmount > 0) {
    recordFinancialTransaction(userId, {
      type: 'income',
      category: 'animal_sale',
      amount: asAmount,
      description: 'Penjualan ternak',
      transaction_date: sale.sale_date || new Date().toISOString().split('T')[0],
      cash_flow: 'cash_in',
      source_table: 'animal_sales',
      source_id: data?.id,
    });
  }

  return data as AnimalSale;
}

export async function updateDailyProduction(userId: string, id: string, record: Partial<DailyProduction>) {
  const { data, error } = await supabaseAdmin.from('daily_production').update(record).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as DailyProduction;
}

export async function deleteDailyProduction(userId: string, id: string) {
  const { error } = await supabaseAdmin.from('daily_production').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function updateProductSale(userId: string, id: string, sale: Partial<ProductSale>) {
  const { data, error } = await supabaseAdmin.from('product_sales').update(sale).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as ProductSale;
}

export async function deleteProductSale(userId: string, id: string) {
  const { error } = await supabaseAdmin.from('product_sales').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function updateAnimalPurchase(userId: string, id: string, purchase: Partial<AnimalPurchase>) {
  const { data, error } = await supabaseAdmin.from('animal_purchases').update(purchase).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as AnimalPurchase;
}

export async function deleteAnimalPurchase(userId: string, id: string) {
  const { error } = await supabaseAdmin.from('animal_purchases').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function updateAnimalSale(userId: string, id: string, sale: Partial<AnimalSale>) {
  const { data, error } = await supabaseAdmin.from('animal_sales').update(sale).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as AnimalSale;
}

export async function deleteAnimalSale(userId: string, id: string) {
  const { error } = await supabaseAdmin.from('animal_sales').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}
