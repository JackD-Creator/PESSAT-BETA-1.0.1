import { useState } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import { mockFinancialTransactions } from '../../lib/mockData';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function FinanceExpensesPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
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

  const expenses = mockFinancialTransactions.filter(tr => tr.type === 'expense');
  const filtered = expenses.filter(tr => categoryFilter === 'all' || tr.category === categoryFilter);

  const cashExpenses = expenses.filter(tr => tr.cash_flow === 'cash_out').reduce((s, tr) => s + tr.amount, 0);
  const nonCashExpenses = expenses.filter(tr => tr.cash_flow === 'non_cash').reduce((s, tr) => s + tr.amount, 0);

  const byCategory = Object.entries(
    expenses.reduce((acc, tr) => {
      acc[tr.category] = (acc[tr.category] || 0) + tr.amount;
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
                    <td>{new Date(tr.transaction_date).toLocaleDateString('id-ID')}</td>
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
        <ExpenseForm t={t} onClose={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}

function ExpenseForm({ t, onClose }: { t: (key: string) => string; onClose: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); alert('Pengeluaran tersimpan (demo)'); onClose(); }} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">{t('expense.form.category')}</label>
          <select className="select">
            {Object.entries({
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
            }).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('expense.form.amount')}</label>
          <input type="number" className="input" placeholder="500000" />
        </div>
        <div>
          <label className="label">{t('expense.form.date')}</label>
          <input type="date" className="input" defaultValue="2026-05-14" />
        </div>
        <div>
          <label className="label">{t('expense.form.cashflow')}</label>
          <select className="select">
            <option value="cash_out">{t('expense.form.cashflow.cash')}</option>
            <option value="non_cash">{t('expense.form.cashflow.noncash')}</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">{t('expense.form.description')}</label>
        <input className="input" placeholder={t('expense.form.description.placeholder')} />
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
