import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Package, Wrench, TrendingDown } from 'lucide-react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';

function formatCurrency(n: number) { return `Rp ${n.toLocaleString('id-ID')}`; }
function formatDate(d: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

export function EquipmentPage() {
  const { hasRole, user } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [dbReady, setDbReady] = useState(true);

  const loadData = async () => {
    if (!user?.id) return;
    const { data, error } = await supabaseAdmin
      .from('equipment_purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false });
    if (error) {
      if (error.code === '42P01') setDbReady(false);
    } else {
      setPurchases(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data ini?')) return;
    await supabaseAdmin.from('equipment_purchases').delete().eq('id', id).eq('user_id', user!.id);
    loadData();
  };

  const totalValue = purchases.reduce((s, p) => s + Number(p.total_amount || 0), 0);

  if (!dbReady) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Peralatan & Perlengkapan</h1>
        </div>
        <div className="card p-8 text-center space-y-4">
          <Wrench size={40} className="mx-auto text-neutral-300" />
          <p className="text-neutral-600 font-medium">Tabel database belum dibuat</p>
          <p className="text-sm text-neutral-400">Jalankan SQL berikut di Supabase SQL Editor untuk mengaktifkan fitur ini:</p>
          <pre className="bg-neutral-50 text-left text-xs p-4 rounded-lg border overflow-x-auto whitespace-pre-wrap text-neutral-700">
{`CREATE TABLE IF NOT EXISTS equipment_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  category text DEFAULT 'equipment',
  quantity integer DEFAULT 1,
  unit text DEFAULT 'unit',
  price_per_unit numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  supplier text,
  purchase_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE equipment_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own equipment" ON equipment_purchases
  FOR ALL USING (auth.uid() = user_id);`}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Peralatan & Perlengkapan</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{purchases.length} item &middot; {formatCurrency(totalValue)}</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Catat Pembelian
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Item</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{purchases.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Qty</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{purchases.reduce((s, p) => s + Number(p.quantity || 0), 0).toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Nilai</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">Memuat...</p></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Item</th>
                  <th>Kategori</th>
                  <th>Jumlah</th>
                  <th>Harga/Unit</th>
                  <th>Total</th>
                  <th>Supplier</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-neutral-400 py-8">Belum ada data peralatan</td></tr>
                ) : purchases.map((p: any) => (
                  <tr key={p.id}>
                    <td className="text-sm">{formatDate(p.purchase_date)}</td>
                    <td className="font-medium">{p.name}</td>
                    <td className="text-sm capitalize">{p.category || '-'}</td>
                    <td>{Number(p.quantity)} {p.unit || 'unit'}</td>
                    <td>Rp {Number(p.price_per_unit).toLocaleString()}</td>
                    <td className="font-medium">{formatCurrency(Number(p.total_amount))}</td>
                    <td className="text-sm">{p.supplier || '-'}</td>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Catat Pembelian Peralatan" size="md">
        <EquipmentForm onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Data Peralatan" size="md">
        {editingItem && <EquipmentForm initialData={editingItem} onClose={() => { setEditingItem(null); loadData(); }} />}
      </Modal>
    </div>
  );
}

function EquipmentForm({ initialData, onClose }: { initialData?: any; onClose: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: initialData?.name || '',
    category: initialData?.category || 'equipment',
    quantity: initialData?.quantity || '',
    unit: initialData?.unit || 'unit',
    price_per_unit: initialData?.price_per_unit || '',
    supplier: initialData?.supplier || '',
    purchase_date: initialData?.purchase_date || new Date().toISOString().split('T')[0],
    notes: initialData?.notes || '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const ppu = Number(form.price_per_unit);
    if (!form.name.trim() || !qty) { alert('Nama dan jumlah harus diisi'); return; }
    const payload = {
      name: form.name.trim(),
      category: form.category,
      quantity: qty,
      unit: form.unit,
      price_per_unit: ppu,
      total_amount: qty * ppu,
      supplier: form.supplier || null,
      purchase_date: form.purchase_date,
      notes: form.notes || null,
      user_id: user!.id,
    };
    try {
      if (initialData) {
        const { error } = await supabaseAdmin.from('equipment_purchases').update(payload).eq('id', initialData.id).eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from('equipment_purchases').insert(payload);
        if (error) throw error;
      }
      onClose();
    } catch (err: any) { alert('Gagal menyimpan: ' + (err?.message || err)); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div className="col-span-2">
          <label className="label">Nama Item <span className="text-error-500">*</span></label>
          <input name="name" className="input" value={form.name} onChange={change} required placeholder="Contoh: Sekop, Ember, Selang" />
        </div>
        <div>
          <label className="label">Kategori</label>
          <select name="category" className="select" value={form.category} onChange={change}>
            <option value="equipment">Peralatan</option>
            <option value="supply">Perlengkapan</option>
            <option value="tool">Alat Pertanian</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
        <div>
          <label className="label">Tanggal</label>
          <input name="purchase_date" type="date" className="input" value={form.purchase_date} onChange={change} />
        </div>
        <div>
          <label className="label">Jumlah <span className="text-error-500">*</span></label>
          <input name="quantity" type="number" min="1" className="input" value={form.quantity} onChange={change} required />
        </div>
        <div>
          <label className="label">Satuan</label>
          <select name="unit" className="select" value={form.unit} onChange={change}>
            <option value="unit">unit</option>
            <option value="pcs">pcs</option>
            <option value="set">set</option>
            <option value="buah">buah</option>
            <option value="kg">kg</option>
          </select>
        </div>
        <div>
          <label className="label">Harga/Unit (Rp)</label>
          <input name="price_per_unit" type="number" min="0" className="input" value={form.price_per_unit} onChange={change} />
        </div>
        <div>
          <label className="label">Supplier</label>
          <input name="supplier" className="input" value={form.supplier} onChange={change} />
        </div>
        <div className="col-span-2">
          <label className="label">Catatan</label>
          <textarea name="notes" className="input h-16 resize-none" value={form.notes} onChange={change} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="submit" className="btn-primary">{initialData ? 'Simpan Perubahan' : 'Simpan'}</button>
      </div>
    </form>
  );
}
