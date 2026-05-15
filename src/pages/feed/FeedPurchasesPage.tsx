import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getFeedPurchases, getFeedConsumption, deleteFeedPurchase, deleteFeedConsumption } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { FeedPurchaseForm } from './FeedPurchaseForm';

function formatCurrency(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function formatDate(d: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

export function FeedPurchasesPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [consumptions, setConsumptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'purchase' | 'usage'>('purchase');

  const handleDeletePurchase = async (id: string) => {
    if (!window.confirm('Hapus data pembelian ini?')) return;
    await deleteFeedPurchase(user!.id, id).catch(() => {});
    loadData();
  };

  const handleDeleteConsumption = async (id: string) => {
    if (!window.confirm('Hapus data pemakaian ini?')) return;
    await deleteFeedConsumption(user!.id, id).catch(() => {});
    loadData();
  };

  const loadData = () => {
    if (!user?.id) return;
    Promise.all([
      getFeedPurchases(user.id),
      getFeedConsumption(user.id),
    ])
      .then(([p, c]) => {
        setPurchases(p as any[]);
        setConsumptions(c as any[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const totalPurchases = purchases.reduce((s: number, p: any) => s + Number(p.total_amount), 0);
  const totalUsage = consumptions.reduce((s: number, c: any) => s + Number(c.total_cost), 0);
  const sumQty = (items: any[], key: string) => items.reduce((s: number, i: any) => s + Number(i[key] || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('page.feed.purchases')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Total pembelian: {formatCurrency(totalPurchases)} &middot; Total pemakaian: {formatCurrency(totalUsage)}
          </p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowPurchaseModal(true)}>
            <Plus size={16} /> {t('feed.purchase')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Pembelian</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(totalPurchases)}</p>
          <p className="text-xs text-neutral-400">{purchases.length} transaksi</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Pemakaian</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(totalUsage)}</p>
          <p className="text-xs text-neutral-400">{consumptions.length} transaksi</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Qty Pembelian</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{sumQty(purchases, 'quantity').toLocaleString()}</p>
          <p className="text-xs text-neutral-400">kg</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Qty Pemakaian</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{sumQty(consumptions, 'quantity').toLocaleString()}</p>
          <p className="text-xs text-neutral-400">kg</p>
        </div>
      </div>

      <div className="tab-bar w-fit">
        <button className={activeTab === 'purchase' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('purchase')}>
          Pembelian ({purchases.length})
        </button>
        <button className={activeTab === 'usage' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('usage')}>
          Pemakaian ({consumptions.length})
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : activeTab === 'purchase' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Pakan</th>
                    <th>Jumlah</th>
                    <th>Harga/Unit</th>
                    <th>Total</th>
                    <th>Supplier</th>
                    <th>Invoice</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-neutral-400 py-8">{t('common.no.data')}</td></tr>
                ) : purchases.map((p: any) => (
                  <tr key={p.id}>
                    <td className="text-sm">{formatDate(p.purchase_date)}</td>
                    <td className="font-medium">{p.feeds?.name || '-'}</td>
                    <td>{Number(p.quantity).toLocaleString()} {p.unit || 'kg'}</td>
                    <td>Rp {Number(p.price_per_unit).toLocaleString()}</td>
                    <td className="font-medium">{formatCurrency(Number(p.total_amount))}</td>
                    <td className="text-sm">{p.supplier || '-'}</td>
                    <td className="text-sm text-neutral-500">{p.invoice_number || '-'}</td>
                    <td>
                      {hasRole(['owner', 'manager']) && (
                        <button className="btn-ghost text-neutral-400 hover:text-error-600 p-1" title="Hapus" onClick={() => handleDeletePurchase(p.id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-neutral-100 text-sm text-neutral-500">
            Total: {purchases.length} transaksi &middot; {sumQty(purchases, 'quantity').toLocaleString()} kg &middot; {formatCurrency(totalPurchases)}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Pakan</th>
                    <th>Jumlah</th>
                    <th>Biaya/Unit</th>
                    <th>Total Biaya</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {consumptions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-neutral-400 py-8">{t('common.no.data')}</td></tr>
                ) : consumptions.map((c: any) => (
                  <tr key={c.id}>
                    <td className="text-sm">{formatDate(c.consumption_date)}</td>
                    <td className="font-medium">{c.feeds?.name || '-'}</td>
                    <td>{Number(c.quantity).toLocaleString()} {c.unit || 'kg'}</td>
                    <td>Rp {Number(c.cost_per_unit).toLocaleString()}</td>
                    <td className="font-medium">{formatCurrency(Number(c.total_cost))}</td>
                    <td>
                      {hasRole(['owner', 'manager']) && (
                        <button className="btn-ghost text-neutral-400 hover:text-error-600 p-1" title="Hapus" onClick={() => handleDeleteConsumption(c.id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-neutral-100 text-sm text-neutral-500">
            Total: {consumptions.length} transaksi &middot; {sumQty(consumptions, 'quantity').toLocaleString()} kg &middot; {formatCurrency(totalUsage)}
          </div>
        </div>
      )}

      <Modal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title={t('feed.purchase.title')} size="md">
        <FeedPurchaseForm type="feed" t={t} onClose={() => { setShowPurchaseModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}
