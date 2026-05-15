import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getFeedConsumption, deleteFeedConsumption, getFeeds, getFeedInventory } from '../../lib/api';
import { createFeedConsumption, updateFeedConsumption } from '../../lib/api/feed';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number) { return `Rp ${n.toLocaleString('id-ID')}`; }
function formatDate(d: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

export function FeedConsumptionPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const loadData = () => {
    if (!user?.id) return;
    getFeedConsumption(user.id)
      .then(data => setRecords(data as any[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data pemberian pakan ini?')) return;
    await deleteFeedConsumption(user!.id, id).catch(() => {});
    loadData();
  };

  const totalQty = records.reduce((s: number, r: any) => s + Number(r.quantity), 0);
  const totalValue = records.reduce((s: number, r: any) => s + Number(r.total_cost), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pemberian Pakan</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{records.length} catatan &middot; {formatCurrency(totalValue)}</p>
        </div>
        {hasRole(['owner', 'manager', 'worker']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Catat Pemberian
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Catatan</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{records.length}</p>
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
                  <th>Biaya/Unit</th>
                  <th>Total Biaya</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-neutral-400 py-8">Belum ada data pemberian pakan</td></tr>
                ) : records.map((r: any) => (
                  <tr key={r.id}>
                    <td className="text-sm">{formatDate(r.consumption_date)}</td>
                    <td className="font-medium">{r.feeds?.name || '-'}</td>
                    <td>{Number(r.quantity).toLocaleString()} {r.unit || 'kg'}</td>
                    <td>Rp {Number(r.cost_per_unit).toLocaleString()}</td>
                    <td className="font-medium">{formatCurrency(Number(r.total_cost))}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="btn-ghost btn-sm p-1.5" onClick={() => setEditingItem(r)}><Pencil size={14} /></button>
                        {hasRole(['owner', 'manager']) && (
                          <button className="btn-ghost btn-sm p-1.5 text-error-500" onClick={() => handleDelete(r.id)}><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Catat Pemberian Pakan" size="md">
        <ConsumptionForm onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Pemberian Pakan" size="md">
        {editingItem && <ConsumptionForm initialData={editingItem} onClose={() => { setEditingItem(null); loadData(); }} />}
      </Modal>
    </div>
  );
}

function ConsumptionForm({ initialData, onClose }: { initialData?: any; onClose: () => void }) {
  const { user } = useAuth();
  const [feedList, setFeedList] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [form, setForm] = useState({
    feed_id: initialData?.feed_id || '',
    quantity: initialData?.quantity || '',
    consumption_date: initialData?.consumption_date || new Date().toISOString().split('T')[0],
    unit: initialData?.unit || 'kg',
    notes: initialData?.notes || '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    Promise.all([getFeeds(user!.id), getFeedInventory(user!.id)])
      .then(([f, inv]) => { setFeedList(f as any[]); setInventoryList(inv as any[]); })
      .catch(() => {});
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    if (!form.feed_id || !qty) { alert('Pilih pakan dan isi jumlah'); return; }
    const invRecord = inventoryList.find((i: any) => i.feed_id === form.feed_id);
    const ppu = Number(invRecord?.avg_cost_per_unit) || 0;
    try {
      if (initialData) {
        await updateFeedConsumption(user!.id, initialData.id, {
          feed_id: form.feed_id,
          consumption_date: form.consumption_date,
          quantity: qty,
          unit: form.unit,
          notes: form.notes || undefined,
        });
      } else {
        await createFeedConsumption(user!.id, {
          feed_id: form.feed_id,
          consumption_date: form.consumption_date,
          quantity: qty,
          unit: form.unit,
          cost_per_unit: ppu,
          total_cost: qty * ppu,
          recorded_by: user?.id,
          notes: form.notes || undefined,
        });
      }
      onClose();
    } catch (err: any) { alert('Gagal menyimpan: ' + (err?.message || err)); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">Pakan <span className="text-error-500">*</span></label>
          <select name="feed_id" className="select" value={form.feed_id} onChange={change} required>
            <option value="">Pilih pakan...</option>
            {feedList.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tanggal</label>
          <input name="consumption_date" type="date" className="input" value={form.consumption_date} onChange={change} />
        </div>
        <div>
          <label className="label">Jumlah <span className="text-error-500">*</span></label>
          <input name="quantity" type="number" step="0.1" min="0" className="input" value={form.quantity} onChange={change} required />
        </div>
        <div>
          <label className="label">Satuan</label>
          <select name="unit" className="select" value={form.unit} onChange={change}>
            <option value="kg">kg</option>
            <option value="gram">gram</option>
            <option value="liter">liter</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Catatan</label>
        <textarea name="notes" className="input h-16 resize-none" value={form.notes} onChange={change} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="submit" className="btn-primary">{initialData ? 'Simpan Perubahan' : 'Simpan'}</button>
      </div>
    </form>
  );
}
