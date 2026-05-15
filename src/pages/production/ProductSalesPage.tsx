import { useState, useEffect } from 'react';
import { Plus, TrendingUp, ShoppingBag, Pencil, Trash2, DollarSign, Package, Users } from 'lucide-react';
import { getProductSales, createProductSale, updateProductSale, deleteProductSale } from '../../lib/api/production';
import type { ProductSale } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number, locale = 'id-ID') {
  return `Rp. ${n.toLocaleString(locale)},-`;
}

export function ProductSalesPage() {
  const { hasRole, user } = useAuth();
  const { t, locale } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductSale | null>(null);
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    if (!user?.id) return;
    setLoading(true);
    getProductSales(user.id)
      .then(setSales)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  // Compute stats from sales data directly
  const totalRevenue = sales.reduce((s, r) => s + r.total_amount, 0);
  const totalQty = sales.reduce((s, r) => s + r.quantity, 0);
  const uniqueBuyers = new Set(sales.map(r => r.buyer_name).filter(Boolean)).size;

  // Group by product type
  const byProduct: Record<string, { qty: number; revenue: number; count: number }> = {};
  for (const r of sales) {
    if (!byProduct[r.product_type]) byProduct[r.product_type] = { qty: 0, revenue: 0, count: 0 };
    byProduct[r.product_type].qty += r.quantity;
    byProduct[r.product_type].revenue += r.total_amount;
    byProduct[r.product_type].count += 1;
  }

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

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">{t('sales.total.revenue')}</p>
              <p className="text-2xl font-bold text-primary-700 mt-1">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{sales.length} transaksi</p>
            </div>
            <div className="bg-primary-50 p-3 rounded-xl"><TrendingUp size={22} className="text-primary-600" /></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">{t('sales.total.volume')}</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">{totalQty.toLocaleString()}</p>
              <p className="text-xs text-neutral-400 mt-0.5">total unit terjual</p>
            </div>
            <div className="bg-info-50 p-3 rounded-xl"><Package size={22} className="text-info-600" /></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">{t('sales.avg.price')}</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">
                {formatCurrency(totalQty > 0 ? Math.round(totalRevenue / totalQty) : 0)}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">rata-rata per unit</p>
            </div>
            <div className="bg-warning-50 p-3 rounded-xl"><DollarSign size={22} className="text-warning-600" /></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">Pembeli</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">{uniqueBuyers}</p>
              <p className="text-xs text-neutral-400 mt-0.5">pembeli unik</p>
            </div>
            <div className="bg-earth-50 p-3 rounded-xl"><Users size={22} className="text-earth-600" /></div>
          </div>
        </div>
      </div>

      {/* Breakdown by product */}
      {Object.keys(byProduct).length > 0 && (
        <div className="card p-5">
          <h2 className="section-header mb-4">Ringkasan per Produk</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(byProduct).map(([type, data]) => (
              <div key={type} className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <p className="font-semibold text-neutral-700 capitalize mb-2">{type}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-neutral-500">Volume</span><span className="font-medium">{data.qty.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Pendapatan</span><span className="font-medium text-primary-700">{formatCurrency(data.revenue)}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Transaksi</span><span className="font-medium">{data.count}x</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales table */}
      <div className="card">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="section-header">{t('sales.history.title')}</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
        ) : (
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
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.sale_date).toLocaleDateString(locale)}</td>
                  <td><span className="badge badge-blue">{s.product_type}</span></td>
                  <td className="font-semibold">{s.quantity.toLocaleString()} {s.unit}</td>
                  <td>{formatCurrency(s.price_per_unit)}/{s.unit}</td>
                  <td className="font-semibold text-primary-700">{formatCurrency(s.total_amount)}</td>
                  <td>{s.buyer_name || '-'}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.payment_method === 'cash' ? 'bg-primary-100 text-primary-700' : 'bg-info-100 text-info-700'}`}>
                      {s.payment_method === 'cash' ? t('sales.payment.cash') : s.payment_method === 'transfer' ? t('sales.payment.transfer') : s.payment_method || '-'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {hasRole(['owner', 'manager']) && (
                        <>
                          <button className="btn-ghost btn-sm p-1.5" onClick={() => setEditingItem(s)}><Pencil size={14} /></button>
                          <button className="btn-ghost btn-sm p-1.5 text-error-500" onClick={async () => {
                            if (!window.confirm('Hapus data ini?')) return;
                            try { await deleteProductSale(user?.id, s.id); loadData(); } catch { alert('Gagal menghapus'); }
                          }}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={8} className="text-center text-neutral-400 py-8">Belum ada data penjualan</td></tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('sales.form.title')} size="md">
        <SaleForm onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>

      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Penjualan" size="sm">
        {editingItem && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const qty = Number(fd.get('quantity'));
            const ppu = Number(fd.get('price_per_unit'));
            try {
              await updateProductSale(user?.id, editingItem.id, {
                quantity: qty,
                price_per_unit: ppu,
                total_amount: qty * ppu,
                buyer_name: fd.get('buyer_name') as string,
                sale_date: fd.get('sale_date') as string,
              });
              setEditingItem(null);
              loadData();
            } catch { alert('Gagal mengupdate'); }
          }} className="space-y-4">
            <div>
              <label className="label">Jumlah</label>
              <input name="quantity" type="number" step="0.1" className="input" defaultValue={editingItem.quantity} required />
            </div>
            <div>
              <label className="label">Harga per Unit</label>
              <input name="price_per_unit" type="number" className="input" defaultValue={editingItem.price_per_unit} required />
            </div>
            <div>
              <label className="label">Pembeli</label>
              <input name="buyer_name" className="input" defaultValue={editingItem.buyer_name || ''} />
            </div>
            <div>
              <label className="label">Tanggal</label>
              <input name="sale_date" type="date" className="input" defaultValue={editingItem.sale_date?.split('T')[0]} required />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setEditingItem(null)}>Batal</button>
              <button type="submit" className="btn-primary">Simpan</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function SaleForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({
    product_type: 'milk', sale_date: new Date().toISOString().split('T')[0], quantity: '',
    unit: 'L', price_per_unit: '', buyer_name: '', payment_method: 'cash',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const ppu = Number(form.price_per_unit);
    if (!qty || !ppu) { alert('Jumlah dan harga harus diisi'); return; }
    try {
      await createProductSale(user?.id, {
        sale_date: form.sale_date,
        product_type: form.product_type as any,
        quantity: qty,
        unit: form.unit,
        price_per_unit: ppu,
        total_amount: qty * ppu,
        buyer_name: form.buyer_name || undefined,
        payment_method: form.payment_method,
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
            <option value="meat">Daging</option>
            <option value="egg">Telur</option>
            <option value="other">Lainnya</option>
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
          <label className="label">Unit</label>
          <input name="unit" className="input" placeholder="L, kg, ekor..." value={form.unit} onChange={change} />
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
