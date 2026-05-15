import { supabaseAdmin } from '../supabaseAdmin';
import { recordFinancialTransaction } from './finance';
import type { Feed, FeedInventory, FeedPurchase, FeedConsumption, FeedFormula, FeedFormulaItem, NutritionRequirement } from '../../types';

// ─── Feeds ───
export async function getFeeds(userId: string = '') {
  if (!userId) return [];
  const q = supabaseAdmin.from('feeds').select('*').eq('user_id', userId);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return data as Feed[];
}

export async function createFeed(userId: string = '', feed: Partial<Feed>) {
  if (!userId) throw new Error('User ID required');
  const { data, error } = await supabaseAdmin.from('feeds').insert({ ...feed, user_id: userId }).select().single();
  if (error) throw error;
  return data as Feed;
}

// ─── Feed Inventory ───
export async function getFeedInventory(userId: string = '') {
  if (!userId) return [];
  const q = supabaseAdmin.from('feed_inventory').select('*, feeds(name, category)').eq('user_id', userId);
  const { data, error } = await q.order('feeds(name)');
  if (error) throw error;
  return data as (FeedInventory & { feeds: { name: string; category: string } })[];
}

export async function updateFeedThreshold(userId: string = '', id: string, min_threshold: number) {
  if (!userId) return;
  const { error } = await supabaseAdmin.from('feed_inventory').update({ min_threshold }).eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// ─── Feed Purchases ───
export async function getFeedPurchases(userId: string = '') {
  if (!userId) return [];
  const q = supabaseAdmin.from('feed_purchases').select('*, feeds(name)').eq('user_id', userId);
  const { data, error } = await q.order('purchase_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as (FeedPurchase & { feeds: { name: string } })[];
}

export async function createFeedPurchase(userId: string = '', purchase: Partial<FeedPurchase>) {
  if (!userId) throw new Error('User ID required');
  const { data, error } = await supabaseAdmin.from('feed_purchases').insert({ ...purchase, user_id: userId }).select().single();
  if (error) throw error;

  // Update inventory
  const inv = await supabaseAdmin.from('feed_inventory').select('*').eq('feed_id', purchase.feed_id!).eq('user_id', userId).maybeSingle();
  if (inv.data) {
    const oldQty = Number(inv.data.quantity_on_hand);
    const oldAvg = Number(inv.data.avg_cost_per_unit);
    const newQty = Number(purchase.quantity) || 0;
    const newPpu = Number(purchase.price_per_unit) || 0;
    const avg = oldQty > 0 ? (oldAvg * oldQty + newPpu * newQty) / (oldQty + newQty) : newPpu;
    await supabaseAdmin.from('feed_inventory').update({
      quantity_on_hand: oldQty + newQty,
      avg_cost_per_unit: Math.round(avg * 100) / 100,
      total_cost: (oldQty + newQty) * Math.round(avg * 100) / 100,
      last_purchase_date: purchase.purchase_date,
    }).eq('id', inv.data.id);
  } else {
    const ppu = Number(purchase.price_per_unit) || 0;
    const qty = Number(purchase.quantity) || 0;
    await supabaseAdmin.from('feed_inventory').insert({
      feed_id: purchase.feed_id!,
      user_id: userId,
      quantity_on_hand: qty,
      avg_cost_per_unit: ppu,
      total_cost: qty * ppu,
      min_threshold: 0,
      last_purchase_date: purchase.purchase_date,
    });
  }

  // Record financial transaction
  const amount = (Number(purchase.quantity) || 0) * (Number(purchase.price_per_unit) || 0);
  if (amount > 0) {
    recordFinancialTransaction(userId, {
      type: 'expense',
      category: 'feed_purchase',
      amount,
      description: 'Pembelian pakan',
      transaction_date: purchase.purchase_date || new Date().toISOString().split('T')[0],
      cash_flow: 'cash_out',
      source_table: 'feed_purchases',
      source_id: data?.id,
    });
  }

  return data as FeedPurchase;
}

// ─── Feed Consumption ───
export async function getFeedConsumption(userId: string = '') {
  if (!userId) return [];
  const q = supabaseAdmin.from('feed_consumption').select('*, feeds(name)').eq('user_id', userId);
  const { data, error } = await q.order('consumption_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as (FeedConsumption & { feeds: { name: string } })[];
}

export async function createFeedConsumption(userId: string = '', consumption: Partial<FeedConsumption>) {
  if (!userId) throw new Error('User ID required');
  const { data, error } = await supabaseAdmin.from('feed_consumption').insert({ ...consumption, user_id: userId }).select().single();
  if (error) throw error;

  // Update inventory
  const inv = await supabaseAdmin.from('feed_inventory').select('*').eq('feed_id', consumption.feed_id!).eq('user_id', userId).maybeSingle();
  if (inv.data) {
    const oldQty = Number(inv.data.quantity_on_hand);
    const newQty = Number(consumption.quantity) || 0;
    const remaining = Math.max(0, oldQty - newQty);
    const avg = Number(inv.data.avg_cost_per_unit);
    await supabaseAdmin.from('feed_inventory').update({
      quantity_on_hand: remaining,
      total_cost: remaining * avg,
    }).eq('id', inv.data.id);
  }

  // Record financial transaction (non-cash expense for feed usage)
  const usageAmount = (Number(consumption.quantity) || 0) * (Number(inv.data?.avg_cost_per_unit) || 0);
  if (usageAmount > 0) {
    recordFinancialTransaction(userId, {
      type: 'expense',
      category: 'feed_usage',
      amount: usageAmount,
      description: 'Pemakaian pakan',
      transaction_date: consumption.consumption_date || new Date().toISOString().split('T')[0],
      cash_flow: 'non_cash',
      source_table: 'feed_consumption',
      source_id: data?.id,
    });
  }

  return data as FeedConsumption;
}

// ─── Feed Formulas ───
export async function getFeedFormulas(userId: string = '') {
  if (!userId) return [];
  const q = supabaseAdmin.from('feed_formulas').select('*').eq('user_id', userId);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return data as FeedFormula[];
}

export async function createFeedFormula(userId: string = '', formula: Partial<FeedFormula>) {
  if (!userId) throw new Error('User ID required');
  const { data, error } = await supabaseAdmin.from('feed_formulas').insert({ ...formula, user_id: userId }).select().single();
  if (error) throw error;
  return data as FeedFormula;
}

export async function getFeedFormulaItems(userId: string = '', formulaId: string) {
  if (!userId) return [];
  const q = supabaseAdmin.from('feed_formula_items').select('*, feeds(name)').eq('formula_id', formulaId).eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return data as (FeedFormulaItem & { feeds: { name: string } })[];
}

export async function createFeedFormulaItem(userId: string = '', item: Partial<FeedFormulaItem>) {
  if (!userId) throw new Error('User ID required');
  const { data, error } = await supabaseAdmin.from('feed_formula_items').insert({ ...item, user_id: userId }).select().single();
  if (error) throw error;
  return data as FeedFormulaItem;
}

// ─── Nutrition Requirements ───
export async function getNutritionRequirements(userId: string = '', species?: string) {
  if (!userId) return [];
  let q = supabaseAdmin.from('nutrition_requirements').select('*').eq('user_id', userId);
  if (species) q = q.eq('species', species);
  const { data, error } = await q;
  if (error) throw error;
  return data as NutritionRequirement[];
}

export async function createNutritionRequirement(userId: string = '', req: Partial<NutritionRequirement>) {
  if (!userId) throw new Error('User ID required');
  const { data, error } = await supabaseAdmin.from('nutrition_requirements').insert({ ...req, user_id: userId }).select().single();
  if (error) throw error;
  return data as NutritionRequirement;
}

export async function updateNutritionRequirement(userId: string = '', id: string, req: Partial<NutritionRequirement>) {
  if (!userId) throw new Error('User ID required');
  const { data, error } = await supabaseAdmin.from('nutrition_requirements').update(req).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as NutritionRequirement;
}

export async function deleteNutritionRequirement(userId: string = '', id: string) {
  if (!userId) return;
  const { error } = await supabaseAdmin.from('nutrition_requirements').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// ─── Inventory Summary ───
export async function updateFeed(userId: string = '', id: string, feed: Partial<Feed>) {
  if (!userId) throw new Error('User ID required');
  const { data, error } = await supabaseAdmin.from('feeds').update(feed).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as Feed;
}

export async function deleteFeed(userId: string = '', id: string) {
  if (!userId) return;
  const { error } = await supabaseAdmin.from('feeds').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function updateFeedPurchase(userId: string = '', id: string, purchase: Partial<FeedPurchase>) {
  if (!userId) throw new Error('User ID required');
  const { data, error } = await supabaseAdmin.from('feed_purchases').update(purchase).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as FeedPurchase;
}

export async function deleteFeedPurchase(userId: string = '', id: string) {
  if (!userId) return;
  const { error } = await supabaseAdmin.from('feed_purchases').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function updateFeedConsumption(userId: string = '', id: string, consumption: Partial<FeedConsumption>) {
  if (!userId) throw new Error('User ID required');
  const { data, error } = await supabaseAdmin.from('feed_consumption').update(consumption).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as FeedConsumption;
}

export async function deleteFeedConsumption(userId: string = '', id: string) {
  if (!userId) return;
  const { error } = await supabaseAdmin.from('feed_consumption').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function updateFeedFormula(userId: string = '', id: string, formula: Partial<FeedFormula>) {
  if (!userId) throw new Error('User ID required');
  const { data, error } = await supabaseAdmin.from('feed_formulas').update(formula).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as FeedFormula;
}

export async function deleteFeedFormula(userId: string = '', id: string) {
  if (!userId) return;
  const { error } = await supabaseAdmin.from('feed_formulas').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function getFeedInventorySummary(userId: string = '') {
  if (!userId) return { totalValue: 0, lowStock: 0 };
  const q = supabaseAdmin.from('feed_inventory').select('total_cost, min_threshold, quantity_on_hand').eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return {
    totalValue: data.reduce((s, i) => s + Number(i.total_cost), 0),
    lowStock: data.filter(i => Number(i.quantity_on_hand) < Number(i.min_threshold)).length,
  };
}
