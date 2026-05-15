import { useState, useEffect } from 'react';
import { getTransactions } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number, locale = 'id-ID') {
  return `Rp ${n.toLocaleString(locale)}`;
}

export function FinancePage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactions(user?.id)
      .then(data => setTransactions(data as any[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = transactions.filter(tr => {
    const matchType = filter === 'all' || tr.type === filter || tr.cash_flow === filter;
    const matchDate = tr.transaction_date >= dateFrom && tr.transaction_date <= dateTo;
    return matchType && matchDate;
  });

  const totalIncome = filtered.filter(tr => tr.type === 'income').reduce((s: number, tr: any) => s + Number(tr.amount), 0);
  const totalExpenseCash = filtered.filter(tr => tr.type === 'expense' && tr.cash_flow === 'cash_out').reduce((s: number, tr: any) => s + Number(tr.amount), 0);
  const totalExpenseNonCash = filtered.filter(tr => tr.type === 'expense' && tr.cash_flow === 'non_cash').reduce((s: number, tr: any) => s + Number(tr.amount), 0);

  const categoryLabels: Record<string, string> = {
    feed_purchase: t('finance.category.feed'),
    feed_usage: t('finance.category.feed.usage'),
    medicine_purchase: t('finance.category.medicine'),
    medicine_usage: t('finance.category.medicine.usage'),
    vet_service: t('finance.category.vet'),
    vaccination: t('finance.category.vaccination'),
    breeding: t('finance.category.reproduction'),
    animal_sale: t('finance.category.livestock.sale'),
    animal_purchase: t('finance.category.livestock.purchase'),
    product_sale: t('finance.category.product.sale'),
    labor: t('finance.category.labor'),
    opex_electricity: t('finance.category.electricity'),
    opex_water: t('finance.category.water'),
    stock_loss: t('finance.category.stock.loss'),
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('finance.title')}</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-primary-500">
          <p className="text-xs text-neutral-500 font-medium">{t('finance.income')}</p>
          <p className="text-2xl font-bold text-primary-700 mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-error-500">
          <p className="text-xs text-neutral-500 font-medium">{t('finance.cash.outflow')}</p>
          <p className="text-2xl font-bold text-error-700 mt-1">{formatCurrency(totalExpenseCash)}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-warning-500">
          <p className="text-xs text-neutral-500 font-medium">{t('finance.non.cash')}</p>
          <p className="text-2xl font-bold text-warning-700 mt-1">{formatCurrency(totalExpenseNonCash)}</p>
        </div>
        <div className={`card p-4 border-l-4 ${totalIncome - totalExpenseCash >= 0 ? 'border-l-primary-500' : 'border-l-error-500'}`}>
          <p className="text-xs text-neutral-500 font-medium">{t('finance.net.cash')}</p>
          <p className={`text-2xl font-bold mt-1 ${totalIncome - totalExpenseCash >= 0 ? 'text-primary-700' : 'text-error-700'}`}>
            {formatCurrency(totalIncome - totalExpenseCash)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : (
      <div className="card">
        {/* Filters */}
        <div className="p-4 border-b border-neutral-100 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-500">{t('finance.from')}</label>
            <input type="date" className="input w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-500">{t('finance.to')}</label>
            <input type="date" className="input w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <select className="select w-40" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">{t('finance.filter.all')}</option>
            <option value="income">{t('finance.filter.income')}</option>
            <option value="expense">{t('finance.filter.expense')}</option>
            <option value="cash_in">{t('finance.filter.cash.in')}</option>
            <option value="cash_out">{t('finance.filter.cash.out')}</option>
            <option value="non_cash">{t('finance.filter.non.cash')}</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('finance.table.date')}</th>
                <th>{t('finance.table.category')}</th>
                <th>{t('finance.table.description')}</th>
                <th>{t('finance.table.source')}</th>
                <th>{t('finance.table.cashflow')}</th>
                <th className="text-right">{t('finance.table.amount')}</th>
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
                  <td className="max-w-[240px] truncate">{tr.description}</td>
                  <td className="text-xs text-neutral-400">{tr.source_table}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      tr.cash_flow === 'cash_in' ? 'bg-primary-100 text-primary-700' :
                      tr.cash_flow === 'cash_out' ? 'bg-error-100 text-error-700' :
                      'bg-warning-100 text-warning-700'
                    }`}>
                      {tr.cash_flow === 'cash_in' ? t('finance.cashflow.in') : tr.cash_flow === 'cash_out' ? t('finance.cashflow.out') : t('finance.cashflow.non')}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`font-semibold ${tr.type === 'income' ? 'text-primary-600' : 'text-error-600'}`}>
                      {tr.type === 'income' ? '+' : '-'}{formatCurrency(tr.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-neutral-100 text-sm text-neutral-400">
          {t('finance.count').replace('{count}', String(filtered.length))}
        </div>
      </div>)}
    </div>
  );
}
