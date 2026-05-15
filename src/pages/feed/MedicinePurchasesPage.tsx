import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getMedicinePurchases, deleteMedicinePurchase } from '../../lib/api';
import { createMedicinePurchase, updateMedicinePurchase } from '../../lib/api/medicine';
import { getMedicines } from '../../lib/api/medicine';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number) { return `Rp ${n.toLocaleString('id-ID')}`; }
function formatDate(d: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

export function MedicinePurchasesPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const loadData = () => {
    if (!user?.id) return;
    getMedicinePurchases(user.id)
      .then(data => setPurchases(data as any[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data pembelian ini?')) return;
    await deleteMedicinePurchase(user!.id, id).catch(() => {});
    loadData();
  };

  const totalValue = purchases.reduce((s: number, p: any) => s + Number(p.total_amount), 0);
  const totalQty = purchases.reduce((s: number, p: any) => s + Number(p.quantity), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pembelian Obat, Vitamin & Suplemen</h1>
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
                  <th>Harga/Unit</th>
                  <th>Total</th>
                  <th>Supplier</th>
                  <th>Batch</th>
                  <th>Kadaluarsa</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-neutral-400 py-8">Belum ada data pembelian</td></tr>
                ) : purchases.map((p: any) => (
                  <tr key={p.id}>
                    <td className="text-sm">{formatDate(p.purchase_date)}</td>
                    <td className="font-medium">{p.medicines?.name || '-'}</td>
                    <td>{Number(p.quantity)} pcs</td>
                    <td>Rp {Number(p.price_per_unit).toLocaleString()}</td>
                    <td className="font-medium">{formatCurrency(Number(p.total_amount))}</td>
                    <td className="text-sm">{p.supplier || '-'}</td>
                    <td className="text-sm text-neutral-500">{p.batch_number || '-'}</td>
                    <td className="text-sm text-neutral-500">{p.expiry_date ? formatDate(p.expiry_date) : '-'}</td>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Catat Pembelian" size="md">
        <PurchaseForm onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Pembelian" size="md">
        {editingItem && <PurchaseForm initialData={editingItem} onClose={() => { setEditingItem(null); loadData(); }} />}
      </Modal>
    </div>
  );
}

function PurchaseForm({ initialData, onClose }: { initialData?: any; onClose: () => void }) {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [form, setForm] = useState({
    medicine_id: initialData?.medicine_id || '',
    purchase_date: initialData?.purchase_date || new Date().toISOString().split('T')[0],
    quantity: initialData?.quantity || '',
    price_per_unit: initialData?.price_per_unit || '',
    supplier: initialData?.supplier || '',
    batch_number: initialData?.batch_number || '',
    expiry_date: initialData?.expiry_date || '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    getMedicines(user!.id).then(setMedicines).catch(() => {});
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const ppu = Number(form.price_per_unit);
    if (!form.medicine_id || !qty || !ppu) { alert('Lengkapi data pembelian'); return; }
    try {
      if (initialData) {
        await updateMedicinePurchase(user!.id, initialData.id, {
          purchase_date: form.purchase_date,
          quantity: qty,
          price_per_unit: ppu,
          total_amount: qty * ppu,
          supplier: form.supplier || undefined,
          batch_number: form.batch_number || undefined,
          expiry_date: form.expiry_date || undefined,
        });
      } else {
        await createMedicinePurchase(user!.id, {
          medicine_id: form.medicine_id,
          purchase_date: form.purchase_date,
          quantity: qty,
          price_per_unit: ppu,
          total_amount: qty * ppu,
          supplier: form.supplier || undefined,
          batch_number: form.batch_number || undefined,
          expiry_date: form.expiry_date || undefined,
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
          <input name="purchase_date" type="date" className="input" value={form.purchase_date} onChange={change} />
        </div>
        <div>
          <label className="label">Jumlah (pcs) <span className="text-error-500">*</span></label>
          <input name="quantity" type="number" min="0" className="input" value={form.quantity} onChange={change} required />
        </div>
        <div>
          <label className="label">Harga/Unit (Rp) <span className="text-error-500">*</span></label>
          <input name="price_per_unit" type="number" min="0" className="input" value={form.price_per_unit} onChange={change} required />
        </div>
        <div>
          <label className="label">Supplier</label>
          <input name="supplier" className="input" value={form.supplier} onChange={change} />
        </div>
        <div>
          <label className="label">No. Batch</label>
          <input name="batch_number" className="input" value={form.batch_number} onChange={change} />
        </div>
        <div>
          <label className="label">Tanggal Kadaluarsa</label>
          <input name="expiry_date" type="date" className="input" value={form.expiry_date} onChange={change} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="submit" className="btn-primary">{initialData ? 'Simpan Perubahan' : 'Simpan'}</button>
      </div>
    </form>
  );
}
