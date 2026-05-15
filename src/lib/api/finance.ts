import { supabaseAdmin } from '../supabaseAdmin';
import type { FinancialTransaction, LaborExpense, OperationalExpense, StockAdjustment } from '../../types';

// ─── Helper: auto-record financial transaction ───
export async function recordFinancialTransaction(userId: string, tx: {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  transaction_date: string;
  cash_flow: 'cash_in' | 'cash_out' | 'non_cash';
  source_table?: string;
  source_id?: string;
}) {
  const { error } = await supabaseAdmin.from('financial_transactions').insert({
    user_id: userId,
    type: tx.type,
    category: tx.category,
    amount: tx.amount,
    description: tx.description || '',
    transaction_date: tx.transaction_date,
    cash_flow: tx.cash_flow,
    source_table: tx.source_table || null,
    source_id: tx.source_id || null,
  });
  if (error) console.error('[finance] recordFinancialTransaction error:', error.message);
}

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
  const q = supabaseAdmin.from('financial_transactions').select('type, cash_flow, amount')
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
export async function getLaborExpenses(userId: string) {
  const q = supabaseAdmin.from('labor_expenses').select('*').eq('user_id', userId);
  const { data, error } = await q.order('expense_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as LaborExpense[];
}

export async function createLaborExpense(userId: string, expense: Partial<LaborExpense>) {
  const { data, error } = await supabaseAdmin.from('labor_expenses').insert({ ...expense, user_id: userId }).select().single();
  if (error) throw error;

  const labAmount = Number(expense.amount) || 0;
  if (labAmount > 0) {
    recordFinancialTransaction(userId, {
      type: 'expense',
      category: 'labor',
      amount: labAmount,
      description: expense.notes || 'Biaya tenaga kerja',
      transaction_date: expense.expense_date || new Date().toISOString().split('T')[0],
      cash_flow: 'cash_out',
      source_table: 'labor_expenses',
      source_id: data?.id,
    });
  }

  return data as LaborExpense;
}

// ─── Operational Expenses ───
export async function getOperationalExpenses(userId: string) {
  const q = supabaseAdmin.from('operational_expenses').select('*').eq('user_id', userId);
  const { data, error } = await q.order('expense_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as OperationalExpense[];
}

export async function createOperationalExpense(userId: string, expense: Partial<OperationalExpense>) {
  const { data, error } = await supabaseAdmin.from('operational_expenses').insert({ ...expense, user_id: userId }).select().single();
  if (error) throw error;

  const opAmount = Number(expense.amount) || 0;
  if (opAmount > 0) {
    recordFinancialTransaction(userId, {
      type: 'expense',
      category: expense.category || 'opex_electricity',
      amount: opAmount,
      description: expense.description || 'Biaya operasional',
      transaction_date: expense.expense_date || new Date().toISOString().split('T')[0],
      cash_flow: (expense as any).cash_flow === 'non_cash' ? 'non_cash' : 'cash_out',
      source_table: 'operational_expenses',
      source_id: data?.id,
    });
  }

  return data as OperationalExpense;
}

// ─── Stock Adjustments ───
export async function getStockAdjustments(userId: string) {
  const q = supabaseAdmin.from('stock_adjustments').select('*, feeds!left(name), medicines!left(name)').eq('user_id', userId);
  const { data, error } = await q.order('adjustment_date', { ascending: false }).limit(50);
  if (error) throw error;
  return data as (StockAdjustment & { feeds?: { name: string } | null; medicines?: { name: string } | null })[];
}

export async function createStockAdjustment(userId: string, adjustment: Partial<StockAdjustment>) {
  const { data, error } = await supabaseAdmin.from('stock_adjustments').insert({ ...adjustment, user_id: userId }).select().single();
  if (error) throw error;

  // Record financial loss
  const lossAmount = Math.abs(Number((adjustment as any).total_cost_change) || 0);
  if (lossAmount > 0) {
    recordFinancialTransaction(userId, {
      type: 'expense',
      category: 'stock_loss',
      amount: lossAmount,
      description: `Penyesuaian stok: ${adjustment.reason || ''}`,
      transaction_date: adjustment.adjustment_date || new Date().toISOString().split('T')[0],
      cash_flow: 'non_cash',
      source_table: 'stock_adjustments',
      source_id: data?.id,
    });
  }

  return data as StockAdjustment;
}
