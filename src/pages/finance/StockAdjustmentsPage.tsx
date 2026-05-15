import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Loader } from 'lucide-react';
import { getStockAdjustments, createStockAdjustment } from '../../lib/api/finance';
import { getFeedInventory, getMedicineInventory, getFeeds, getMedicines } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatDate(d: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

export function StockAdjustmentsPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadData = () => {
    getStockAdjustments(user?.id)
      .then(data => setAdjustments(data as any[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const totalLoss = adjustments
    .filter(a => Number(a.quantity_change) < 0)
    .reduce((s, a) => s + Math.abs(Number(a.quantity_change)), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Penyesuaian Stok</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {adjustments.length} transaksi &middot; Total koreksi: {totalLoss.toLocaleString()} unit
          </p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Catat Penyesuaian
          </button>
        )}
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : adjustments.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={48} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">Belum ada penyesuaian stok</p>
          <p className="text-sm text-neutral-400 mt-1">Catat stok rusak, kadaluwarsa, atau koreksi stok di sini</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Tipe Item</th>
                  <th>ID Item</th>
                  <th>Perubahan</th>
                  <th>Alasan</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map(a => (
                  <tr key={a.id}>
                    <td className="text-sm">{formatDate(a.adjustment_date)}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.item_type === 'feed' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {a.item_type === 'feed' ? 'Pakan' : 'Obat'}
                      </span>
                    </td>
                    <td className="text-neutral-500">{a.item_id}</td>
                    <td>
                      <span className={`font-semibold ${Number(a.quantity_change) < 0 ? 'text-error-600' : 'text-primary-600'}`}>
                        {Number(a.quantity_change) > 0 ? '+' : ''}{Number(a.quantity_change)}
                      </span>
                    </td>
                    <td className="max-w-[240px] truncate">{a.reason}</td>
                    <td className="text-neutral-500 max-w-[200px] truncate">{a.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Catat Penyesuaian Stok" size="md">
        <AdjustmentForm onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}

function AdjustmentForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [feedList, setFeedList] = useState<any[]>([]);
  const [medList, setMedList] = useState<any[]>([]);
  const [feedInv, setFeedInv] = useState<any[]>([]);
  const [medInv, setMedInv] = useState<any[]>([]);
  const [form, setForm] = useState({
    item_type: 'feed', item_id: '', quantity: '', reason: '', notes: '',
    adjustment_date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    Promise.all([
      getFeeds(user?.id), getMedicines(user?.id),
      getFeedInventory(user?.id), getMedicineInventory(user?.id),
    ]).then(([f, m, fi, mi]) => {
      setFeedList(f as any[]);
      setMedList(m as any[]);
      setFeedInv(fi as any[]);
      setMedInv(mi as any[]);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    if (!form.item_id || !qty) { alert('Lengkapi data'); return; }
    if (!form.reason) { alert('Alasan harus diisi'); return; }
    setError('');
    setSubmitting(true);
    try {
      const inv = form.item_type === 'feed'
        ? feedInv.find((i: any) => i.feed_id === form.item_id)
        : medInv.find((i: any) => i.medicine_id === form.item_id);
      const ppu = Number(inv?.avg_cost_per_unit) || 0;
      await createStockAdjustment(user?.id, {
        item_type: form.item_type as any,
        item_id: form.item_id,
        adjustment_date: form.adjustment_date,
        quantity_change: qty > 0 ? -qty : qty,
        reason: form.reason,
        notes: form.notes || undefined,
        cost_per_unit_at_time: ppu,
        total_cost_change: Math.abs(qty) * ppu,
        recorded_by: user?.id,
      } as any);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const items = form.item_type === 'feed' ? feedList : medList;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-sm text-error-600 bg-error-50 p-3 rounded-lg">{error}</div>}
      <div>
        <label className="label">Tipe Item</label>
        <div className="flex gap-3">
          {[{ v: 'feed', l: 'Pakan' }, { v: 'medicine', l: 'Obat' }].map(o => (
            <label key={o.v} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="item_type" value={o.v} checked={form.item_type === o.v} onChange={change} />
              <span className="text-sm">{o.l}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="form-grid-2">
        <div>
          <label className="label">{form.item_type === 'feed' ? 'Pakan' : 'Obat'}</label>
          <select name="item_id" className="select" value={form.item_id} onChange={change} required>
            <option value="">Pilih...</option>
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Jumlah Koreksi</label>
          <input name="quantity" type="number" className="input" placeholder="Masukkan jumlah pengurangan" value={form.quantity} onChange={change} required />
          <p className="text-xs text-neutral-400 mt-1">Nilai positif akan mengurangi stok</p>
        </div>
        <div>
          <label className="label">Tanggal</label>
          <input name="adjustment_date" type="date" className="input" value={form.adjustment_date} onChange={change} />
        </div>
        <div>
          <label className="label">Alasan <span className="text-error-500">*</span></label>
          <select name="reason" className="select" value={form.reason} onChange={change} required>
            <option value="">Pilih alasan...</option>
            <option value="rusak">Stok Rusak</option>
            <option value="kadaluwarsa">Kadaluwarsa</option>
            <option value="hilang">Hilang</option>
            <option value="koreksi">Koreksi Stok</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Keterangan</label>
          <input name="notes" className="input" placeholder="Keterangan tambahan..." value={form.notes} onChange={change} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Batal</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <Loader size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
          Simpan
        </button>
      </div>
    </form>
  );
}
