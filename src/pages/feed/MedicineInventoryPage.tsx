import { useState, useEffect } from 'react';
import { AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import { getMedicineInventory, getMedicinePurchases } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { MedicinePurchaseForm } from './MedicinePurchaseForm';
import { MedicineUsageForm } from './MedicineUsageForm';

function formatCurrency(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function formatDate(d: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

export function MedicineInventoryPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

  const loadData = () => {
    if (!user?.id) return;
    Promise.all([
      getMedicineInventory(user.id),
      getMedicinePurchases(user.id),
    ])
      .then(([inv, pur]) => {
        setMedicines(inv as any[]);
        setPurchases(pur as any[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const lowStock = medicines.filter((m: any) => m.quantity_on_hand < m.min_threshold);
  const totalValue = medicines.reduce((s: number, m: any) => s + Number(m.total_cost), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('page.medicine.inventory')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {medicines.length} jenis obat &middot; Total nilai: {formatCurrency(totalValue)}
          </p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowUsageModal(true)}>
              <Package size={16} /> Pakai Obat
            </button>
            <button className="btn-primary" onClick={() => setShowPurchaseModal(true)}>
              <ShoppingCart size={16} /> {t('feed.purchase')}
            </button>
          </div>
        )}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-error-50 border border-error-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-error-600" />
            <span className="font-semibold text-error-700">Stok Obat Menipis</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {lowStock.map(m => (
              <span key={m.id} className="text-xs bg-error-100 text-error-700 px-3 py-1 rounded-full font-medium">
                {m.medicines?.name || '-'}: {m.quantity_on_hand}/{m.min_threshold} pcs
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="tab-bar w-fit">
        <button className={activeTab === 'stock' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('stock')}>
          Stok ({medicines.length})
        </button>
        <button className={activeTab === 'history' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('history')}>
          Riwayat Pembelian ({purchases.length})
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : activeTab === 'stock' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.length === 0 ? (
            <div className="col-span-full card p-12 text-center">
              <p className="text-neutral-500">Belum ada stok obat</p>
              <p className="text-sm text-neutral-400 mt-1">Lakukan pembelian obat untuk memulai</p>
            </div>
          ) : medicines.map((med: any) => {
            const isLow = med.quantity_on_hand < med.min_threshold;
            const pct = Math.min(100, (med.quantity_on_hand / Math.max(med.min_threshold * 3, med.quantity_on_hand)) * 100);
            return (
              <div key={med.id} className={`card p-5 ${isLow ? 'border-error-200' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-neutral-800">{med.medicines?.name || '-'}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{med.medicines?.type || '-'}</p>
                  </div>
                  {isLow && <span className="badge badge-red flex-shrink-0">Stok Menipis</span>}
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={`text-3xl font-bold ${isLow ? 'text-error-600' : 'text-neutral-800'}`}>
                    {Number(med.quantity_on_hand)}
                  </span>
                  <span className="text-sm text-neutral-500">pcs</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${isLow ? 'bg-error-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="space-y-1 text-xs text-neutral-500">
                  <div className="flex justify-between">
                    <span>Min. Stok</span>
                    <span className="font-medium">{med.min_threshold} pcs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nilai Stok</span>
                    <span className="font-medium text-neutral-700">{formatCurrency(Number(med.total_cost))}</span>
                  </div>
                  {med.expiry_date && (
                    <div className="flex justify-between">
                      <span>Kadaluarsa</span>
                      <span className="font-medium text-warning-600">{formatDate(med.expiry_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-default">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Obat</th>
                  <th>Jumlah</th>
                  <th>Harga/Unit</th>
                  <th>Total</th>
                  <th>Supplier</th>
                  <th>Batch</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-neutral-400 py-8">{t('common.no.data')}</td></tr>
                ) : purchases.map((p: any) => (
                  <tr key={p.id}>
                    <td className="text-sm">{formatDate(p.purchase_date)}</td>
                    <td className="font-medium">{p.medicines?.name || '-'}</td>
                    <td>{Number(p.quantity)} pcs</td>
                    <td>Rp {Number(p.price_per_unit).toLocaleString()}</td>
                    <td className="font-medium">{formatCurrency(Number(p.total_amount))}</td>
                    <td className="text-sm">{p.supplier || '-'}</td>
                    <td className="text-sm text-neutral-500">{p.batch_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title="Catat Pembelian Obat" size="md">
        <MedicinePurchaseForm t={t} onClose={() => { setShowPurchaseModal(false); loadData(); }} />
      </Modal>

      <Modal open={showUsageModal} onClose={() => setShowUsageModal(false)} title="Catat Pemakaian Obat" size="md">
        <MedicineUsageForm t={t} onClose={() => { setShowUsageModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}
