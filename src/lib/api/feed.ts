import { supabaseAdmin } from '../supabaseAdmin';
import type { Feed, FeedInventory, FeedPurchase, FeedConsumption, FeedFormula, FeedFormulaItem, NutritionRequirement } from '../../types';

// ─── Feeds ───
export async function getFeeds(userId: string) {
  let q = supabaseAdmin.from('feeds').select('*').eq('user_id', userId);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return data as Feed[];
}

export async function createFeed(userId: string, feed: Partial<Feed>) {
  const { data, error } = await supabaseAdmin.from('feeds').insert({ ...feed, user_id: userId }).select().single();
  if (error) throw error;
  return data as Feed;
}

// ─── Feed Inventory ───
export async function getFeedInventory(userId: string) {
  let q = supabaseAdmin.from('feed_inventory').select('*, feeds(name, category)').eq('user_id', userId);
  const { data, error } = await q.order('feeds(name)');
  if (error) throw error;
  return data as (FeedInventory & { feeds: { name: string; category: string } })[];
}

export async function updateFeedThreshold(userId: string, id: string, min_threshold: number) {
  const { error } = await supabaseAdmin.from('feed_inventory').update({ min_threshold }).eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// ─── Feed Purchases ───
export async function getFeedPurchases(userId: string) {
  let q = supabaseAdmin.from('feed_purchases').select('*, feeds(name)').eq('user_id', userId);
  const { data, error } = await q.order('purchase_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as (FeedPurchase & { feeds: { name: string } })[];
}

export async function createFeedPurchase(userId: string, purchase: Partial<FeedPurchase>) {
  const { data, error } = await supabaseAdmin.from('feed_purchases').insert({ ...purchase, user_id: userId }).select().single();
  if (error) throw error;
  return data as FeedPurchase;
}

// ─── Feed Consumption ───
export async function getFeedConsumption(userId: string) {
  let q = supabaseAdmin.from('feed_consumption').select('*, feeds(name)').eq('user_id', userId);
  const { data, error } = await q.order('consumption_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as (FeedConsumption & { feeds: { name: string } })[];
}

export async function createFeedConsumption(userId: string, consumption: Partial<FeedConsumption>) {
  const { data, error } = await supabaseAdmin.from('feed_consumption').insert({ ...consumption, user_id: userId }).select().single();
  if (error) throw error;
  return data as FeedConsumption;
}

// ─── Feed Formulas ───
export async function getFeedFormulas(userId: string) {
  let q = supabaseAdmin.from('feed_formulas').select('*').eq('user_id', userId);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return data as FeedFormula[];
}

export async function getFeedFormulaItems(userId: string, formulaId: string) {
  let q = supabaseAdmin.from('feed_formula_items').select('*, feeds(name)').eq('formula_id', formulaId).eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return data as (FeedFormulaItem & { feeds: { name: string } })[];
}

// ─── Nutrition Requirements ───
export async function getNutritionRequirements(userId: string, species?: string) {
  let q = supabaseAdmin.from('nutrition_requirements').select('*').eq('user_id', userId);
  if (species) q = q.eq('species', species);
  const { data, error } = await q;
  if (error) throw error;
  return data as NutritionRequirement[];
}

// ─── Inventory Summary ───
export async function getFeedInventorySummary(userId: string) {
  let q = supabaseAdmin.from('feed_inventory').select('total_cost, min_threshold, quantity_on_hand').eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return {
    totalValue: data.reduce((s, i) => s + Number(i.total_cost), 0),
    lowStock: data.filter(i => Number(i.quantity_on_hand) < Number(i.min_threshold)).length,
  };
}
