import { supabaseAdmin } from '../supabaseAdmin';
import type { FinancialTransaction, LaborExpense, OperationalExpense, StockAdjustment } from '../../types';

// ─── Financial Transactions ───
export async function getTransactions(userId: string, params?: { type?: string; category?: string; cashFlow?: string; dateFrom?: string; dateTo?: string }) {
  let q = supabaseAdmin.from('financial_transactions').select('*, animals(tag_id)').eq('user_id', userId).order('transaction_date', { ascending: false }).limit(100);
  if (params?.type) q = q.eq('type', params.type);
  if (params?.category) q = q.eq('category', params.category);
  if (params?.cashFlow) q = q.eq('cash_flow', params.cashFlow);
  if (params?.dateFrom) q = q.gte('transaction_date', params.dateFrom);
  if (params?.dateTo) q = q.lte('transaction_date', params.dateTo);
  const { data, error } = await q;
  if (error) throw error;
  return data as (FinancialTransaction & { animals: { tag_id: string } | null })[];
}

export async function getFinanceSummary(userId: string) {
  let q = supabaseAdmin.from('financial_transactions')
    .select('type, cash_flow, amount')
    .gte('transaction_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
    .eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  let income = 0, expense = 0, cashIn = 0, cashOut = 0;
  for (const t of data) {
    const amt = Number(t.amount);
    if (t.type === 'income') income += amt;
    else expense += amt;
    if (t.cash_flow === 'cash_in') cashIn += amt;
    else if (t.cash_flow === 'cash_out') cashOut += amt;
  }
  return { income, expense, profit: income - expense, cashIn, cashOut, netCash: cashIn - cashOut, count: data.length };
}

// ─── Labor Expenses ───
export async function createLaborExpense(userId: string, expense: Partial<LaborExpense>) {
  const { data, error } = await supabaseAdmin.from('labor_expenses').insert({ ...expense, user_id: userId }).select().single();
  if (error) throw error;
  return data as LaborExpense;
}

// ─── Operational Expenses ───
export async function createOperationalExpense(userId: string, expense: Partial<OperationalExpense>) {
  const { data, error } = await supabaseAdmin.from('operational_expenses').insert({ ...expense, user_id: userId }).select().single();
  if (error) throw error;
  return data as OperationalExpense;
}

// ─── Stock Adjustments ───
export async function getStockAdjustments(userId: string) {
  let q = supabaseAdmin.from('stock_adjustments').select('*').eq('user_id', userId);
  const { data, error } = await q.order('adjustment_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as StockAdjustment[];
}

export async function createStockAdjustment(userId: string, adjustment: Partial<StockAdjustment>) {
  const { data, error } = await supabaseAdmin.from('stock_adjustments').insert({ ...adjustment, user_id: userId }).select().single();
  if (error) throw error;
  return data as StockAdjustment;
}
