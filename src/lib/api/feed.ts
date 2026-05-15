import { supabase } from '../supabase';
import { supabaseAdmin } from '../supabaseAdmin';
import type { Feed, FeedInventory, FeedPurchase, FeedConsumption, FeedFormula, FeedFormulaItem, NutritionRequirement } from '../../types';

// ─── Feeds ───
export async function getFeeds() {
  const { data, error } = await supabase.from('feeds').select('*').order('name');
  if (error) throw error;
  return data as Feed[];
}

export async function createFeed(feed: Partial<Feed>) {
  const { data, error } = await supabaseAdmin.from('feeds').insert(feed).select().single();
  if (error) throw error;
  return data as Feed;
}

// ─── Feed Inventory ───
export async function getFeedInventory() {
  const { data, error } = await supabase.from('feed_inventory').select('*, feeds(name, category)').order('feeds(name)');
  if (error) throw error;
  return data as (FeedInventory & { feeds: { name: string; category: string } })[];
}

export async function updateFeedThreshold(id: string, min_threshold: number) {
  const { error } = await supabaseAdmin.from('feed_inventory').update({ min_threshold }).eq('id', id);
  if (error) throw error;
}

// ─── Feed Purchases ───
export async function getFeedPurchases() {
  const { data, error } = await supabase.from('feed_purchases').select('*, feeds(name)').order('purchase_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as (FeedPurchase & { feeds: { name: string } })[];
}

export async function createFeedPurchase(purchase: Partial<FeedPurchase>) {
  const { data, error } = await supabaseAdmin.from('feed_purchases').insert(purchase).select().single();
  if (error) throw error;
  return data as FeedPurchase;
}

// ─── Feed Consumption ───
export async function getFeedConsumption() {
  const { data, error } = await supabase.from('feed_consumption').select('*, feeds(name)').order('consumption_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as (FeedConsumption & { feeds: { name: string } })[];
}

export async function createFeedConsumption(consumption: Partial<FeedConsumption>) {
  const { data, error } = await supabaseAdmin.from('feed_consumption').insert(consumption).select().single();
  if (error) throw error;
  return data as FeedConsumption;
}

// ─── Feed Formulas ───
export async function getFeedFormulas() {
  const { data, error } = await supabase.from('feed_formulas').select('*').order('name');
  if (error) throw error;
  return data as FeedFormula[];
}

export async function getFeedFormulaItems(formulaId: string) {
  const { data, error } = await supabase.from('feed_formula_items').select('*, feeds(name)').eq('formula_id', formulaId);
  if (error) throw error;
  return data as (FeedFormulaItem & { feeds: { name: string } })[];
}

// ─── Nutrition Requirements ───
export async function getNutritionRequirements(species?: string) {
  let q = supabase.from('nutrition_requirements').select('*');
  if (species) q = q.eq('species', species);
  const { data, error } = await q;
  if (error) throw error;
  return data as NutritionRequirement[];
}

// ─── Inventory Summary ───
export async function getFeedInventorySummary() {
  const { data, error } = await supabase.from('feed_inventory').select('total_cost, min_threshold, quantity_on_hand');
  if (error) throw error;
  return {
    totalValue: data.reduce((s, i) => s + Number(i.total_cost), 0),
    lowStock: data.filter(i => Number(i.quantity_on_hand) < Number(i.min_threshold)).length,
  };
}
