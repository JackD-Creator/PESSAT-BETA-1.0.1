import { useState } from 'react';
import { Plus, TrendingUp, ShoppingBag } from 'lucide-react';
import { mockFinancialTransactions, mockDailyProduction } from '../../lib/mockData';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function ProductSalesPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const salesTxs = mockFinancialTransactions.filter(t => t.category === 'product_sale');
  const totalRevenue = salesTxs.reduce((s, t) => s + t.amount, 0);
  const totalLiters = mockDailyProduction.reduce((s, d) => s + d.quantity, 0);
  const avgPricePerLiter = totalLiters > 0 ? totalRevenue / totalLiters : 20000;

  const mockProductSales = [
    { id: 1, sale_date: '2026-05-10', product_type: 'Susu Segar', quantity: 160, unit: 'liter', price_per_unit: 20000, total: 3200000, buyer: 'Koperasi Susu Jaya', payment: 'Tunai' },
    { id: 2, sale_date: '2026-05-09', product_type: 'Susu Segar', quantity: 159, unit: 'liter', price_per_unit: 20000, total: 3180000, buyer: 'Koperasi Susu Jaya', payment: 'Transfer' },
    { id: 3, sale_date: '2026-05-07', product_type: 'Susu Segar', quantity: 170, unit: 'liter', price_per_unit: 20000, total: 3400000, buyer: 'Koperasi Susu Jaya', payment: 'Transfer' },
    { id: 4, sale_date: '2026-05-04', product_type: 'Susu Segar', quantity: 165, unit: 'liter', price_per_unit: 20000, total: 3300000, buyer: 'Pasar Segar Indah', payment: 'Tunai' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('sales.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('sales.subtitle')}</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            {t('sales.add')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">{t('sales.total.revenue')}</p>
              <p className="text-2xl font-bold text-primary-700 mt-1">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{salesTxs.length} transaksi</p>
            </div>
            <div className="bg-primary-50 p-3 rounded-xl">
              <TrendingUp size={22} className="text-primary-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs text-neutral-500 font-medium">{t('sales.total.volume')}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{totalLiters.toLocaleString()} L</p>
          <p className="text-xs text-neutral-400 mt-0.5">{t('sales.milk.sold')}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-neutral-500 font-medium">{t('sales.avg.price')}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(Math.round(avgPricePerLiter))}/L</p>
          <p className="text-xs text-neutral-400 mt-0.5">{t('sales.per.liter')}</p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="section-header">{t('sales.history.title')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('sales.table.date')}</th>
                <th>{t('sales.table.product')}</th>
                <th>{t('sales.table.amount')}</th>
                <th>{t('sales.table.unitprice')}</th>
                <th>{t('sales.table.total')}</th>
                <th>{t('sales.table.buyer')}</th>
                <th>{t('sales.table.payment')}</th>
              </tr>
            </thead>
            <tbody>
              {mockProductSales.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.sale_date).toLocaleDateString('id-ID')}</td>
                  <td>
                    <span className="badge badge-blue">{s.product_type}</span>
                  </td>
                  <td className="font-semibold">{s.quantity.toLocaleString()} {s.unit}</td>
                  <td>{formatCurrency(s.price_per_unit)}/{s.unit}</td>
                  <td className="font-semibold text-primary-700">{formatCurrency(s.total)}</td>
                  <td>{s.buyer}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.payment === 'Tunai' ? 'bg-primary-100 text-primary-700' : 'bg-info-100 text-info-700'}`}>
                      {s.payment === 'Tunai' ? t('sales.payment.cash') : t('sales.payment.transfer')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('sales.form.title')} size="md">
        <SaleForm onClose={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}

function SaleForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <form onSubmit={(e) => { e.preventDefault(); alert('Penjualan tersimpan (demo)'); onClose(); }} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">{t('sales.form.product')}</label>
          <select className="select">
            <option>{t('sales.product.freshmilk')}</option>
            <option>{t('sales.product.wool')}</option>
            <option>{t('sales.product.compost')}</option>
          </select>
        </div>
        <div>
          <label className="label">{t('sales.form.buyer')}</label>
          <input className="input" placeholder={t('sales.form.buyer.placeholder')} />
        </div>
        <div>
          <label className="label">{t('sales.form.amount')}</label>
          <input type="number" step="0.1" className="input" placeholder={t('sales.form.amount.placeholder')} />
        </div>
        <div>
          <label className="label">{t('sales.form.unitprice')}</label>
          <input type="number" className="input" placeholder={t('sales.form.unitprice.placeholder')} />
        </div>
        <div>
          <label className="label">{t('sales.form.date')}</label>
          <input type="date" className="input" defaultValue="2026-05-14" />
        </div>
        <div>
          <label className="label">{t('sales.form.payment')}</label>
          <select className="select">
            <option>{t('sales.payment.cash')}</option>
            <option>{t('sales.payment.transfer')}</option>
            <option>{t('sales.payment.credit')}</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary">
          <ShoppingBag size={14} />
          {t('common.save')}
        </button>
      </div>
    </form>
  );
}
