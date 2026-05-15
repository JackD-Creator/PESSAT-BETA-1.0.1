import { useState, useEffect } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import { getTransactions, createLaborExpense, createOperationalExpense } from '../../lib/api/finance';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number, locale = 'id-ID') {
  return `Rp ${n.toLocaleString(locale)}`;
}

export function FinanceExpensesPage() {
  const { t, locale } = useTranslation();
  const { hasRole, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categoryLabels: Record<string, string> = {
    feed_purchase: t('finance.category.feed'),
    feed_usage: t('finance.category.feed.usage'),
    medicine_purchase: t('finance.category.medicine'),
    medicine_usage: t('finance.category.medicine.usage'),
    vet_service: t('finance.category.vet'),
    vaccination: t('finance.category.vaccination'),
    breeding: t('finance.category.reproduction'),
    animal_purchase: t('finance.category.livestock.purchase'),
    labor: t('finance.category.labor'),
    opex_electricity: t('finance.category.electricity'),
    opex_water: t('finance.category.water'),
    opex_fuel: t('finance.category.fuel'),
    stock_loss: t('finance.category.stock.loss'),
  };

  const [txs, setTxs] = useState<any[]>([]);
  const loadData = () => { if (user?.id) getTransactions(user.id).then(setTxs); };
  useEffect(() => { loadData(); }, [user?.id]);

  const expenses = txs.filter((tr: any) => tr.type === 'expense');
  const filtered = expenses.filter((tr: any) => categoryFilter === 'all' || tr.category === categoryFilter);

  const cashExpenses = expenses.filter((tr: any) => tr.cash_flow === 'cash_out').reduce((s: number, tr: any) => s + Number(tr.amount), 0);
  const nonCashExpenses = expenses.filter((tr: any) => tr.cash_flow === 'non_cash').reduce((s: number, tr: any) => s + Number(tr.amount), 0);

  const byCategory = Object.entries(
    expenses.reduce((acc: Record<string, number>, tr: any) => {
      acc[tr.category] = (acc[tr.category] || 0) + Number(tr.amount);
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  const maxCat = byCategory[0]?.[1] || 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('expense.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('expense.subtitle')}</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            {t('expense.add')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-l-error-500">
          <p className="text-xs text-neutral-500 font-medium">{t('expense.total.cash')}</p>
          <p className="text-2xl font-bold text-error-700 mt-1">{formatCurrency(cashExpenses)}</p>
        </div>
        <div className="card p-5 border-l-4 border-l-warning-500">
          <p className="text-xs text-neutral-500 font-medium">{t('expense.total.noncash')}</p>
          <p className="text-2xl font-bold text-warning-700 mt-1">{formatCurrency(nonCashExpenses)}</p>
        </div>
        <div className="card p-5 border-l-4 border-l-neutral-400">
          <p className="text-xs text-neutral-500 font-medium">{t('expense.total.all')}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(cashExpenses + nonCashExpenses)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        <div className="card p-5 lg:col-span-1">
          <h2 className="section-header mb-4">{t('expense.by.category')}</h2>
          <div className="space-y-3">
            {byCategory.map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-neutral-700">{categoryLabels[cat] || cat}</span>
                  <span className="text-xs font-semibold text-neutral-700">{formatCurrency(amount)}</span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-earth-400 rounded-full"
                    style={{ width: `${(amount / maxCat) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        <div className="card lg:col-span-2">
          <div className="p-4 border-b border-neutral-100 flex items-center gap-3">
            <h2 className="section-header">{t('expense.list.title')}</h2>
            <select className="select w-48 ml-auto" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">{t('expense.filter.all')}</option>
              {Object.entries(categoryLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('expense.table.date')}</th>
                  <th>{t('expense.table.category')}</th>
                  <th>{t('expense.table.description')}</th>
                  <th>{t('expense.table.type')}</th>
                  <th className="text-right">{t('expense.table.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tr => (
                  <tr key={tr.id}>
                    <td>{new Date(tr.transaction_date).toLocaleDateString(locale)}</td>
                    <td>
                      <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                        {categoryLabels[tr.category] || tr.category}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate text-sm">{tr.description}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tr.cash_flow === 'non_cash' ? 'bg-warning-100 text-warning-700' : 'bg-error-100 text-error-700'}`}>
                        {tr.cash_flow === 'non_cash' ? t('expense.form.cashflow.noncash') : t('expense.form.cashflow.cash')}
                      </span>
                    </td>
                    <td className="text-right font-semibold text-error-600">-{formatCurrency(tr.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('expense.form.title')} size="md">
        <ExpenseForm t={t} onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}

function ExpenseForm({ t, onClose }: { t: (key: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    expense_type: 'labor', category: 'labor', amount: '', expense_date: new Date().toISOString().split('T')[0],
    cash_flow: 'cash_out', description: '', worker_name: '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const categoryOptions: Record<string, string> = {
    labor: t('finance.category.labor'),
    opex_electricity: t('finance.category.electricity'),
    opex_water: t('finance.category.water'),
    opex_fuel: t('finance.category.fuel'),
    stock_loss: t('finance.category.stock.loss'),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount) { alert('Jumlah harus diisi'); return; }

    try {
      if (form.expense_type === 'labor') {
        await createLaborExpense(user?.id, {
          expense_date: form.expense_date,
          worker_name: form.worker_name || 'Unknown',
          expense_type: 'salary',
          amount,
          notes: form.description || undefined,
        });
      } else {
        await createOperationalExpense(user?.id, {
          expense_date: form.expense_date,
          category: form.category as any,
          amount,
          description: form.description || undefined,
          cash_flow: form.cash_flow as any,
        });
      }
      onClose();
    } catch { alert('Gagal menyimpan pengeluaran'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">{t('expense.form.category')}</label>
          <div className="flex gap-2 mb-2">
            <label className="flex items-center gap-1 text-sm"><input type="radio" name="expense_type" value="labor" checked={form.expense_type === 'labor'} onChange={change} /> Tenaga Kerja</label>
            <label className="flex items-center gap-1 text-sm"><input type="radio" name="expense_type" value="opex" checked={form.expense_type === 'opex'} onChange={change} /> Operasional</label>
          </div>
          {form.expense_type === 'labor' ? (
            <input name="worker_name" className="input" placeholder="Nama pekerja" value={form.worker_name} onChange={change} />
          ) : (
            <select name="category" className="select" value={form.category} onChange={change}>
              {Object.entries(categoryOptions).filter(([k]) => k !== 'labor').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="label">{t('expense.form.amount')}</label>
          <input name="amount" type="number" className="input" placeholder="500000" value={form.amount} onChange={change} required />
        </div>
        <div>
          <label className="label">{t('expense.form.date')}</label>
          <input name="expense_date" type="date" className="input" value={form.expense_date} onChange={change} />
        </div>
        <div>
          <label className="label">{t('expense.form.cashflow')}</label>
          <select name="cash_flow" className="select" value={form.cash_flow} onChange={change}>
            <option value="cash_out">{t('expense.form.cashflow.cash')}</option>
            <option value="non_cash">{t('expense.form.cashflow.noncash')}</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">{t('expense.form.description')}</label>
        <input name="description" className="input" placeholder={t('expense.form.description.placeholder')} value={form.description} onChange={change} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary">
          <DollarSign size={14} />
          {t('common.save')}
        </button>
      </div>
    </form>
  );
}
