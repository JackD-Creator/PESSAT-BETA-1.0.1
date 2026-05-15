import { useState, useEffect } from 'react';
import { Plus, TrendingUp, ShoppingBag } from 'lucide-react';
import { getFinancialTransactions, getDailyProduction, getProductSales } from '../../lib/db';
import type { ProductSale } from '../../lib/db';
import { createProductSale } from '../../lib/api/production';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function ProductSalesPage() {
  const { hasRole, user } = useAuth();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [txs, setTxs] = useState<any[]>([]);
  const [production, setProduction] = useState<any[]>([]);
  const [sales, setSales] = useState<ProductSale[]>([]);

  const loadData = () => {
    getFinancialTransactions(user?.id).then(setTxs);
    getDailyProduction(user?.id, 30).then(setProduction);
    getProductSales(user?.id).then(setSales);
  };

  useEffect(() => { loadData(); }, []);

  const salesTxs = txs.filter((t: any) => t.category === 'product_sale');
  const totalRevenue = salesTxs.reduce((s: number, t: any) => s + t.amount, 0);
  const totalLiters = production.reduce((s: number, d: any) => s + d.quantity, 0);
  const avgPricePerLiter = totalLiters > 0 ? totalRevenue / totalLiters : 20000;

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
              {sales.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.sale_date).toLocaleDateString('id-ID')}</td>
                  <td>
                    <span className="badge badge-blue">{s.product_type}</span>
                  </td>
                  <td className="font-semibold">{s.quantity.toLocaleString()} {s.unit}</td>
                  <td>{formatCurrency(s.price_per_unit)}/{s.unit}</td>
                  <td className="font-semibold text-primary-700">{formatCurrency(s.total_amount)}</td>
                  <td>{s.buyer_name || '-'}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.payment_method === 'cash' ? 'bg-primary-100 text-primary-700' : 'bg-info-100 text-info-700'}`}>
                      {s.payment_method === 'cash' ? t('sales.payment.cash') : s.payment_method === 'transfer' ? t('sales.payment.transfer') : s.payment_method || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('sales.form.title')} size="md">
        <SaleForm onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}

function SaleForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({
    product_type: 'milk', sale_date: '2026-05-14', quantity: '',
    unit: 'L', price_per_unit: '', buyer_name: '', payment_method: 'cash',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const ppu = Number(form.price_per_unit);
    if (!qty || !ppu) { alert('Jumlah dan harga harus diisi'); return; }
    try {
      await createProductSale({
        sale_date: form.sale_date,
        product_type: form.product_type as any,
        quantity: qty,
        unit: form.unit,
        price_per_unit: ppu,
        total_amount: qty * ppu,
        buyer_name: form.buyer_name || undefined,
        payment_method: form.payment_method,
        recorded_by: (user as any)?.full_name || undefined,
      });
      onClose();
    } catch { alert('Gagal menyimpan penjualan'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">{t('sales.form.product')}</label>
          <select name="product_type" className="select" value={form.product_type} onChange={change}>
            <option value="milk">{t('sales.product.freshmilk')}</option>
          </select>
        </div>
        <div>
          <label className="label">{t('sales.form.buyer')}</label>
          <input name="buyer_name" className="input" placeholder={t('sales.form.buyer.placeholder')} value={form.buyer_name} onChange={change} />
        </div>
        <div>
          <label className="label">{t('sales.form.amount')}</label>
          <input name="quantity" type="number" step="0.1" className="input" placeholder={t('sales.form.amount.placeholder')} value={form.quantity} onChange={change} required />
        </div>
        <div>
          <label className="label">{t('sales.form.unitprice')}</label>
          <input name="price_per_unit" type="number" className="input" placeholder={t('sales.form.unitprice.placeholder')} value={form.price_per_unit} onChange={change} required />
        </div>
        <div>
          <label className="label">{t('sales.form.date')}</label>
          <input name="sale_date" type="date" className="input" value={form.sale_date} onChange={change} />
        </div>
        <div>
          <label className="label">{t('sales.form.payment')}</label>
          <select name="payment_method" className="select" value={form.payment_method} onChange={change}>
            <option value="cash">{t('sales.payment.cash')}</option>
            <option value="transfer">{t('sales.payment.transfer')}</option>
            <option value="credit">{t('sales.payment.credit')}</option>
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
