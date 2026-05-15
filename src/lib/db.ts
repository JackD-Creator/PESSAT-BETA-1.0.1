import { supabaseAdmin } from './supabaseAdmin';
import type {
  User, Location, Animal, HerdGroup, FinancialTransaction,
  DailyProduction, Vaccination, BreedingEvent, Task, Alert,
  FeedInventory,
} from './mockData';

function mapRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows as unknown as T[];
}

export async function getLocations(userId?: string): Promise<Location[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('locations').select('*');
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('name');
  return mapRows<Location>(data ?? []);
}

export async function getAnimals(userId?: string): Promise<Animal[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('animals').select('*');
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('tag_id');
  return mapRows<Animal>(data ?? []);
}

export async function getAnimalsBySpecies(species: string, userId?: string): Promise<Animal[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('animals').select('*').eq('species', species);
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('tag_id');
  return mapRows<Animal>(data ?? []);
}

export async function getAnimalCountBySpecies(userId?: string): Promise<{ species: string; count: number }[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('animals').select('species');
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q;
  if (!data) return [];
  const map: Record<string, number> = {};
  for (const row of data) {
    const s = row.species as string;
    map[s] = (map[s] || 0) + 1;
  }
  return Object.entries(map).map(([species, count]) => ({ species, count }));
}

export async function getHerdGroups(userId?: string): Promise<HerdGroup[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('herd_groups').select('*');
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('name');
  return mapRows<HerdGroup>(data ?? []);
}

export async function getFinancialTransactions(userId?: string): Promise<FinancialTransaction[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('financial_transactions').select('*');
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('transaction_date', { ascending: false });
  return mapRows<FinancialTransaction>(data ?? []);
}

export async function getFinancialTransactionsByMonth(yearMonth: string, userId?: string): Promise<FinancialTransaction[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('financial_transactions')
    .select('*')
    .gte('transaction_date', `${yearMonth}-01`)
    .lt('transaction_date', `${yearMonth}-32`);
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('transaction_date', { ascending: false });
  return mapRows<FinancialTransaction>(data ?? []);
}

export async function getDailyProduction(userId?: string, limit = 14): Promise<DailyProduction[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('daily_production').select('*');
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('production_date', { ascending: false }).limit(limit);
  return mapRows<DailyProduction>(data ?? []);
}

export async function getVaccinations(userId?: string): Promise<Vaccination[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('vaccinations').select('*');
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('date_administered', { ascending: false });
  return mapRows<Vaccination>(data ?? []);
}

export async function getBreedingEvents(userId?: string): Promise<BreedingEvent[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('breeding_events').select('*');
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('event_date', { ascending: false });
  return mapRows<BreedingEvent>(data ?? []);
}

export async function getTasks(userId?: string): Promise<Task[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('tasks').select('*');
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('created_at', { ascending: false });
  return mapRows<Task>(data ?? []);
}

export async function getAlerts(userId?: string): Promise<Alert[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('alerts').select('*');
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('created_at', { ascending: false });
  return mapRows<Alert>(data ?? []);
}

export async function getUnresolvedAlerts(userId?: string): Promise<Alert[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('alerts').select('*').eq('is_resolved', false);
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('created_at', { ascending: false });
  return mapRows<Alert>(data ?? []);
}

export async function getFeedInventory(userId?: string): Promise<FeedInventory[]> {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin.from('feed_inventory').select('*, feeds(name, category)');
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('feed_id');
  if (!data) return [];
  return data.map((row: Record<string, unknown>) => {
    const feed = row.feeds as Record<string, unknown> | undefined;
    return {
      id: row.id,
      feed_id: row.feed_id,
      feed_name: feed?.name as string ?? '',
      feed_category: feed?.category as string ?? '',
      quantity_on_hand: Number(row.quantity_on_hand),
      unit: 'kg',
      avg_cost_per_unit: Number(row.avg_cost_per_unit),
      total_cost: Number(row.total_cost),
      min_threshold: Number(row.min_threshold),
      last_purchase_date: row.last_purchase_date as string | undefined,
      days_remaining: 0,
    } as FeedInventory;
  });
}

export async function getUsers(): Promise<User[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin.from('users').select('*').order('full_name');
  return mapRows<User>(data ?? []);
}

export async function getUserProfile(uid: string): Promise<User | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin.from('users').select('*').eq('id', uid).single();
  return data as User | null;
}

export interface ProductSale {
  id: string;
  sale_date: string;
  product_type: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_amount: number;
  buyer_name: string | null;
  payment_method: string | null;
}

export async function getProductSales(userId?: string): Promise<ProductSale[]> {
  let q = supabaseAdmin.from('product_sales').select('*');
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.order('sale_date', { ascending: false });
  return mapRows<ProductSale>(data ?? []);
}
