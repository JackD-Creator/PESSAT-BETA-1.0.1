import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getMedicineUsages, deleteMedicineUsage, createMedicineUsage, updateMedicineUsage, getMedicines } from '../../lib/api/medicine';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number) { return `Rp ${n.toLocaleString('id-ID')}`; }
function formatDate(d: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

export function MedicineUsagePage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [usages, setUsages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const loadData = () => {
    if (!user?.id) return;
    getMedicineUsages(user.id)
      .then(data => setUsages(data as any[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data pemberian ini?')) return;
    await deleteMedicineUsage(user!.id, id).catch(() => {});
    loadData();
  };

  const totalQty = usages.reduce((s: number, u: any) => s + Number(u.quantity), 0);
  const totalValue = usages.reduce((s: number, u: any) => s + Number(u.total_cost), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pemberian Obat, Vitamin & Suplemen</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{usages.length} catatan &middot; {formatCurrency(totalValue)}</p>
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
          <p className="text-2xl font-bold text-neutral-800 mt-1">{usages.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Qty</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{totalQty.toLocaleString()} pcs</p>
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
                  <th>Item</th>
                  <th>Jumlah</th>
                  <th>Biaya/Unit</th>
                  <th>Total Biaya</th>
                  <th>Catatan Dosis</th>
                  <th>Diberikan Oleh</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {usages.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-neutral-400 py-8">Belum ada data pemberian</td></tr>
                ) : usages.map((u: any) => (
                  <tr key={u.id}>
                    <td className="text-sm">{formatDate(u.usage_date)}</td>
                    <td className="font-medium">{u.medicines?.name || '-'}</td>
                    <td>{Number(u.quantity)} pcs</td>
                    <td>Rp {Number(u.cost_per_unit || 0).toLocaleString()}</td>
                    <td className="font-medium">{formatCurrency(Number(u.total_cost || 0))}</td>
                    <td className="text-sm text-neutral-500">{u.dosage_notes || '-'}</td>
                    <td className="text-sm">{u.administered_by || '-'}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="btn-ghost btn-sm p-1.5" onClick={() => setEditingItem(u)}><Pencil size={14} /></button>
                        {hasRole(['owner', 'manager']) && (
                          <button className="btn-ghost btn-sm p-1.5 text-error-500" onClick={() => handleDelete(u.id)}><Trash2 size={14} /></button>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Catat Pemberian" size="md">
        <UsageForm onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Pemberian" size="md">
        {editingItem && <UsageForm initialData={editingItem} onClose={() => { setEditingItem(null); loadData(); }} />}
      </Modal>
    </div>
  );
}

function UsageForm({ initialData, onClose }: { initialData?: any; onClose: () => void }) {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [form, setForm] = useState({
    medicine_id: initialData?.medicine_id || '',
    usage_date: initialData?.usage_date || new Date().toISOString().split('T')[0],
    quantity: initialData?.quantity || '',
    dosage_notes: initialData?.dosage_notes || '',
    administered_by: initialData?.administered_by || '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    getMedicines(user!.id).then(setMedicines).catch(() => {});
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    if (!form.medicine_id || !qty) { alert('Pilih item dan isi jumlah'); return; }
    try {
      if (initialData) {
        await updateMedicineUsage(user!.id, initialData.id, {
          usage_date: form.usage_date,
          quantity: qty,
          dosage_notes: form.dosage_notes || undefined,
          administered_by: form.administered_by || undefined,
        });
      } else {
        await createMedicineUsage(user!.id, {
          medicine_id: form.medicine_id,
          usage_date: form.usage_date,
          quantity: qty,
          dosage_notes: form.dosage_notes || undefined,
          administered_by: form.administered_by || undefined,
          recorded_by: user?.id,
        });
      }
      onClose();
    } catch (err: any) { alert('Gagal menyimpan: ' + (err?.message || err)); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div className="col-span-2">
          <label className="label">Item <span className="text-error-500">*</span></label>
          <select name="medicine_id" className="select" value={form.medicine_id} onChange={change} required disabled={!!initialData}>
            <option value="">Pilih obat/vitamin/suplemen...</option>
            {medicines.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tanggal</label>
          <input name="usage_date" type="date" className="input" value={form.usage_date} onChange={change} />
        </div>
        <div>
          <label className="label">Jumlah (pcs) <span className="text-error-500">*</span></label>
          <input name="quantity" type="number" min="0" className="input" value={form.quantity} onChange={change} required />
        </div>
        <div>
          <label className="label">Diberikan Oleh</label>
          <input name="administered_by" className="input" value={form.administered_by} onChange={change} placeholder="Nama petugas" />
        </div>
        <div>
          <label className="label">Catatan Dosis</label>
          <input name="dosage_notes" className="input" value={form.dosage_notes} onChange={change} placeholder="Contoh: 2x sehari" />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="submit" className="btn-primary">{initialData ? 'Simpan Perubahan' : 'Simpan'}</button>
      </div>
    </form>
  );
}
