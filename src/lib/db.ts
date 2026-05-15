import { supabase } from './supabase';
import type {
  User, Location, Animal, HerdGroup, FinancialTransaction,
  DailyProduction, Vaccination, BreedingEvent, Task, Alert,
  FeedInventory,
} from './mockData';

function mapRow<T>(row: Record<string, unknown> | null): T | null {
  return row as unknown as T;
}

function mapRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows as unknown as T[];
}

export async function getLocations(): Promise<Location[]> {
  const { data } = await supabase.from('locations').select('*').order('name');
  return mapRows<Location>(data ?? []);
}

export async function getAnimals(): Promise<Animal[]> {
  const { data } = await supabase.from('animals').select('*').order('tag_id');
  return mapRows<Animal>(data ?? []);
}

export async function getAnimalsBySpecies(species: string): Promise<Animal[]> {
  const { data } = await supabase.from('animals').select('*').eq('species', species).order('tag_id');
  return mapRows<Animal>(data ?? []);
}

export async function getAnimalCountBySpecies(): Promise<{ species: string; count: number }[]> {
  const { data } = await supabase.from('animals').select('species');
  if (!data) return [];
  const map: Record<string, number> = {};
  for (const row of data) {
    const s = row.species as string;
    map[s] = (map[s] || 0) + 1;
  }
  return Object.entries(map).map(([species, count]) => ({ species, count }));
}

export async function getHerdGroups(): Promise<HerdGroup[]> {
  const { data } = await supabase.from('herd_groups').select('*').order('name');
  return mapRows<HerdGroup>(data ?? []);
}

export async function getFinancialTransactions(): Promise<FinancialTransaction[]> {
  const { data } = await supabase.from('financial_transactions').select('*').order('transaction_date', { ascending: false });
  return mapRows<FinancialTransaction>(data ?? []);
}

export async function getFinancialTransactionsByMonth(yearMonth: string): Promise<FinancialTransaction[]> {
  const { data } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('transaction_date', `${yearMonth}-01`)
    .lt('transaction_date', `${yearMonth}-32`)
    .order('transaction_date', { ascending: false });
  return mapRows<FinancialTransaction>(data ?? []);
}

export async function getDailyProduction(limit = 14): Promise<DailyProduction[]> {
  const { data } = await supabase
    .from('daily_production')
    .select('*')
    .order('production_date', { ascending: false })
    .limit(limit);
  return mapRows<DailyProduction>(data ?? []);
}

export async function getVaccinations(): Promise<Vaccination[]> {
  const { data } = await supabase
    .from('vaccinations')
    .select('*')
    .order('date_administered', { ascending: false });
  return mapRows<Vaccination>(data ?? []);
}

export async function getBreedingEvents(): Promise<BreedingEvent[]> {
  const { data } = await supabase
    .from('breeding_events')
    .select('*')
    .order('event_date', { ascending: false });
  return mapRows<BreedingEvent>(data ?? []);
}

export async function getTasks(): Promise<Task[]> {
  const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
  return mapRows<Task>(data ?? []);
}

export async function getAlerts(): Promise<Alert[]> {
  const { data } = await supabase.from('alerts').select('*').order('created_at', { ascending: false });
  return mapRows<Alert>(data ?? []);
}

export async function getUnresolvedAlerts(): Promise<Alert[]> {
  const { data } = await supabase
    .from('alerts')
    .select('*')
    .eq('is_resolved', false)
    .order('created_at', { ascending: false });
  return mapRows<Alert>(data ?? []);
}

export async function getFeedInventory(): Promise<FeedInventory[]> {
  const { data } = await supabase
    .from('feed_inventory')
    .select('*, feeds(name, category)')
    .order('feed_id');
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
  const { data } = await supabase.from('users').select('*').order('full_name');
  return mapRows<User>(data ?? []);
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
  return mapRow<User>(data);
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

export async function getProductSales(): Promise<ProductSale[]> {
  const { data } = await supabase
    .from('product_sales')
    .select('*')
    .order('sale_date', { ascending: false });
  return mapRows<ProductSale>(data ?? []);
}
