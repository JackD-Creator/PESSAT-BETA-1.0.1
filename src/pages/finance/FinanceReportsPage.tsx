import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, BarChart2, Users, Milk } from 'lucide-react';
import { getFinancialTransactions } from '../../lib/db';
import { getAnimals, getDailyProduction } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

const categoryGroups: Record<string, { labelKey: string; categories: string[] }> = {
  revenue: { labelKey: 'report.revenue.group', categories: ['product_sale', 'animal_sale'] },
  feed: { labelKey: 'report.feed.group', categories: ['feed_purchase', 'feed_usage'] },
  health: { labelKey: 'report.health.group', categories: ['medicine_purchase', 'medicine_usage', 'vet_service', 'vaccination'] },
  breeding: { labelKey: 'report.reproduction.group', categories: ['breeding'] },
  livestock: { labelKey: 'report.livestock.group', categories: ['animal_purchase'] },
  labor: { labelKey: 'report.labor.group', categories: ['labor'] },
  opex: { labelKey: 'report.operational.group', categories: ['opex_electricity', 'opex_water', 'opex_fuel'] },
};

const reportCategoryLabels: Record<string, string> = {
  feed_purchase: 'finance.category.feed',
  feed_usage: 'finance.category.feed.usage',
  vet_service: 'finance.category.vet',
  vaccination: 'finance.category.vaccination',
  medicine_purchase: 'finance.category.medicine',
  labor: 'finance.category.labor',
  opex_electricity: 'finance.category.electricity',
};

export function FinanceReportsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [txs, setTxs] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [production, setProduction] = useState<any[]>([]);
  useEffect(() => {
    getFinancialTransactions(user?.id).then(setTxs);
    getAnimals(user?.id).then(setAnimals).catch(() => {});
    getDailyProduction(user?.id).then(p => setProduction((p as any[]).filter(r => r.product_type === 'milk'))).catch(() => {});
  }, [user?.id]);

  const income = txs.filter(tr => tr.type === 'income').reduce((s, tr) => s + tr.amount, 0);
  const expenseCash = txs.filter(tr => tr.type === 'expense' && tr.cash_flow === 'cash_out').reduce((s, tr) => s + tr.amount, 0);
  const expenseNonCash = txs.filter(tr => tr.type === 'expense' && tr.cash_flow === 'non_cash').reduce((s, tr) => s + tr.amount, 0);
  const grossProfit = income - expenseCash - expenseNonCash;
  const cashFlow = income - expenseCash;

  const totalExpenses = expenseCash + expenseNonCash;
  const activeAnimals = animals.filter((a: any) => a.status === 'active' || a.status === 'pregnant').length;
  const totalMilk30d = (production as any[]).slice(0, 30).reduce((s: number, d: any) => s + d.quantity, 0);
  const costPerHead = activeAnimals > 0 ? totalExpenses / activeAnimals : 0;
  const costPerLiter = totalMilk30d > 0 ? totalExpenses / totalMilk30d : 0;

  const byCategoryGroup = Object.entries(categoryGroups).map(([key, group]) => {
    const amount = txs
      .filter(tr => group.categories.includes(tr.category))
      .reduce((s, tr) => s + tr.amount, 0);
    const isRevenue = key === 'revenue';
    return { key, label: t(group.labelKey), amount, isRevenue };
  }).filter(g => g.amount > 0);

  const maxAmount = Math.max(...byCategoryGroup.map(g => g.amount));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('report.title')}</h1>
        <div className="flex gap-2">
          <select className="select w-36">
            <option>{t('report.may')}</option>
            <option>{t('report.april')}</option>
            <option>{t('report.march')}</option>
          </select>
          <button className="btn-secondary">{t('report.export')}</button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { labelKey: 'report.total.income', value: income, color: 'text-primary-700', bg: 'bg-primary-50', icon: <TrendingUp size={20} className="text-primary-600" /> },
          { labelKey: 'report.cash.expenses', value: expenseCash, color: 'text-error-700', bg: 'bg-error-50', icon: <TrendingDown size={20} className="text-error-600" /> },
          { labelKey: 'report.noncash.costs', value: expenseNonCash, color: 'text-warning-700', bg: 'bg-warning-50', icon: <DollarSign size={20} className="text-warning-600" /> },
          { labelKey: 'report.net.profit', value: grossProfit, color: grossProfit >= 0 ? 'text-primary-700' : 'text-error-700', bg: grossProfit >= 0 ? 'bg-primary-50' : 'bg-error-50', icon: <BarChart2 size={20} className={grossProfit >= 0 ? 'text-primary-600' : 'text-error-600'} /> },
        ].map(m => (
          <div key={m.labelKey} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-neutral-500 font-medium">{t(m.labelKey)}</p>
                <p className={`text-2xl font-bold mt-1 ${m.color}`}>{formatCurrency(m.value)}</p>
              </div>
              <div className={`${m.bg} p-2.5 rounded-xl`}>{m.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Cost efficiency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">Biaya Per Ekor (30 hari)</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(costPerHead)}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{activeAnimals} ekor aktif</p>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl"><Users size={20} className="text-blue-600" /></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">Biaya Per Liter (30 hari)</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(costPerLiter)}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{totalMilk30d.toFixed(0)} L total</p>
            </div>
            <div className="bg-green-50 p-2.5 rounded-xl"><Milk size={20} className="text-green-600" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Laba Rugi */}
        <div className="card p-5">
          <h2 className="section-header mb-4">{t('report.profitloss.title')}</h2>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-neutral-100">
              <span className="font-semibold text-neutral-700">{t('report.income.section')}</span>
            </div>
            <div className="flex justify-between py-1 pl-4">
              <span className="text-sm text-neutral-600">{t('report.product.sales')}</span>
              <span className="text-sm font-medium text-primary-600">{formatCurrency(txs.filter(tr => tr.category === 'product_sale').reduce((s, tr) => s + tr.amount, 0))}</span>
            </div>
            <div className="flex justify-between py-1 pl-4">
              <span className="text-sm text-neutral-600">{t('report.livestock.sales')}</span>
              <span className="text-sm font-medium text-primary-600">{formatCurrency(txs.filter(tr => tr.category === 'animal_sale').reduce((s, tr) => s + tr.amount, 0))}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-neutral-200 font-semibold">
              <span className="text-neutral-700">{t('report.total.income.label')}</span>
              <span className="text-primary-700">{formatCurrency(income)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-neutral-100 mt-2">
              <span className="font-semibold text-neutral-700">{t('report.expenses.section')}</span>
            </div>
            {['feed_purchase', 'feed_usage', 'vet_service', 'vaccination', 'medicine_purchase', 'labor', 'opex_electricity'].map(cat => {
              const total = txs.filter(tr => tr.category === cat).reduce((s, tr) => s + tr.amount, 0);
              if (!total) return null;
              return (
                <div key={cat} className="flex justify-between py-1 pl-4">
                  <span className="text-sm text-neutral-600">{t(reportCategoryLabels[cat] || cat)}</span>
                  <span className="text-sm font-medium text-error-600">({formatCurrency(total)})</span>
                </div>
              );
            })}
            <div className="flex justify-between py-2 border-t border-neutral-200 font-semibold">
              <span className="text-neutral-700">{t('report.total.expenses')}</span>
              <span className="text-error-700">({formatCurrency(expenseCash + expenseNonCash)})</span>
            </div>

            <div className={`flex justify-between py-3 border-t-2 border-neutral-200 font-bold text-lg ${grossProfit >= 0 ? 'text-primary-700' : 'text-error-700'}`}>
              <span>{t('report.net.profit.label')}</span>
              <span>{formatCurrency(grossProfit)}</span>
            </div>
          </div>
        </div>

        {/* Bar chart by category */}
        <div className="card p-5">
          <h2 className="section-header mb-4">{t('report.distribution.title')}</h2>
          <div className="space-y-3">
            {byCategoryGroup.sort((a, b) => b.amount - a.amount).map(g => (
              <div key={g.key}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-700">{g.label}</span>
                  <span className={`text-sm font-semibold ${g.isRevenue ? 'text-primary-700' : 'text-neutral-700'}`}>
                    {formatCurrency(g.amount)}
                  </span>
                </div>
                <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${g.isRevenue ? 'bg-primary-500' : 'bg-earth-400'}`}
                    style={{ width: `${(g.amount / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-600 mb-3">{t('report.cashflow.title')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">{t('report.cash.in')}</span>
                <span className="text-sm font-semibold text-primary-600">{formatCurrency(income)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">{t('report.cash.out')}</span>
                <span className="text-sm font-semibold text-error-600">{formatCurrency(expenseCash)}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-100 pt-2">
                <span className="text-sm font-semibold text-neutral-700">{t('report.net.cashflow')}</span>
                <span className={`text-sm font-bold ${cashFlow >= 0 ? 'text-primary-700' : 'text-error-700'}`}>{formatCurrency(cashFlow)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
