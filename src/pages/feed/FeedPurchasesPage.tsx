import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ShoppingCart } from 'lucide-react';
import { getFeedPurchases, deleteFeedPurchase } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { FeedPurchaseForm } from './FeedPurchaseForm';

function formatCurrency(n: number) { return `Rp. ${n.toLocaleString('id-ID')},-`; }
function formatDate(d: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

export function FeedPurchasesPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const loadData = () => {
    if (!user?.id) return;
    getFeedPurchases(user.id)
      .then(data => setPurchases(data as any[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data pembelian ini?')) return;
    await deleteFeedPurchase(user!.id, id).catch(() => {});
    loadData();
  };

  const totalValue = purchases.reduce((s: number, p: any) => s + Number(p.total_amount), 0);
  const totalQty = purchases.reduce((s: number, p: any) => s + Number(p.quantity), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pembelian Pakan</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{purchases.length} transaksi &middot; {formatCurrency(totalValue)}</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Catat Pembelian
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Transaksi</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{purchases.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Qty</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{totalQty.toLocaleString()} kg</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Nilai</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : (
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
                  <tr><td colSpan={8} className="text-center text-neutral-400 py-8">Belum ada data pembelian</td></tr>
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
                        <div className="flex items-center gap-1">
                          <button className="btn-ghost btn-sm p-1.5" onClick={() => setEditingItem(p)}><Pencil size={14} /></button>
                          <button className="btn-ghost btn-sm p-1.5 text-error-500" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Catat Pembelian Pakan" size="md">
        <FeedPurchaseForm type="feed" t={t} onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Pembelian" size="md">
        {editingItem && <FeedPurchaseForm type="feed" t={t} initialData={editingItem} onClose={() => { setEditingItem(null); loadData(); }} />}
      </Modal>
    </div>
  );
}
