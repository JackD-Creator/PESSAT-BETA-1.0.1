import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Wrench, ShoppingCart, TrendingDown, Package } from 'lucide-react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';

function formatCurrency(n: number) { return `Rp. ${n.toLocaleString('id-ID')},-`; }
function formatDate(d: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

const SQL_SETUP = `-- Jalankan di Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS equipment_purchases (
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
CREATE TABLE IF NOT EXISTS equipment_usages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  item_name text NOT NULL,
  quantity integer DEFAULT 1,
  unit text DEFAULT 'unit',
  usage_date date DEFAULT CURRENT_DATE,
  used_by text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE equipment_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_usages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ep_own" ON equipment_purchases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "eu_own" ON equipment_usages FOR ALL USING (auth.uid() = user_id);`;

export function EquipmentPage() {
  const { hasRole, user } = useAuth();
  const [tab, setTab] = useState<'inventory' | 'purchases' | 'usages'>('inventory');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [usages, setUsages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [editingUsage, setEditingUsage] = useState<any>(null);
  const [dbReady, setDbReady] = useState<'checking' | 'ready' | 'missing'>('checking');

  const isMissingTable = (err: any) =>
    err?.code === '42P01' ||
    err?.message?.toLowerCase().includes('does not exist') ||
    err?.message?.toLowerCase().includes('relation');

  const loadData = async () => {
    if (!user?.id) return;
    const [pRes, uRes] = await Promise.all([
      supabaseAdmin.from('equipment_purchases').select('*').eq('user_id', user.id).order('purchase_date', { ascending: false }),
      supabaseAdmin.from('equipment_usages').select('*').eq('user_id', user.id).order('usage_date', { ascending: false }),
    ]);
    if (isMissingTable(pRes.error) || isMissingTable(uRes.error)) {
      setDbReady('missing');
    } else {
      setPurchases(pRes.data || []);
      setUsages(uRes.data || []);
      setDbReady('ready');
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user?.id]);

  // Compute inventory: group purchases by name, subtract usages
  const inventoryMap: Record<string, { qty: number; value: number; unit: string; avgPrice: number }> = {};
  for (const p of purchases) {
    const key = p.name;
    if (!inventoryMap[key]) inventoryMap[key] = { qty: 0, value: 0, unit: p.unit || 'unit', avgPrice: 0 };
    inventoryMap[key].qty += Number(p.quantity);
    inventoryMap[key].value += Number(p.total_amount);
  }
  for (const u of usages) {
    const key = u.item_name;
    if (inventoryMap[key]) {
      inventoryMap[key].qty = Math.max(0, inventoryMap[key].qty - Number(u.quantity));
    }
  }
  const inventory = Object.entries(inventoryMap).map(([name, v]) => ({
    name,
    qty_on_hand: v.qty,
    total_value: v.qty > 0 ? (v.value / Math.max(1, purchases.filter(p => p.name === name).reduce((s, p) => s + Number(p.quantity), 0))) * v.qty : 0,
    unit: v.unit,
  }));

  const totalPurchaseValue = purchases.reduce((s, p) => s + Number(p.total_amount || 0), 0);
  const totalStockValue = inventory.reduce((s, i) => s + i.total_value, 0);

  if (dbReady === 'checking') {
    return (
      <div className="page-container">
        <div className="page-header"><h1 className="page-title">Peralatan & Perlengkapan</h1></div>
        <div className="card p-12 text-center"><p className="text-neutral-400">Memeriksa database...</p></div>
      </div>
    );
  }

  if (dbReady === 'missing') {
    return (
      <div className="page-container">
        <div className="page-header"><h1 className="page-title">Peralatan & Perlengkapan</h1></div>
        <div className="card p-8 text-center space-y-4">
          <Wrench size={40} className="mx-auto text-neutral-300" />
          <p className="text-neutral-600 font-medium">Tabel database belum dibuat</p>
          <p className="text-sm text-neutral-400">Salin dan jalankan SQL berikut di Supabase SQL Editor, lalu refresh halaman:</p>
          <pre className="bg-neutral-50 text-left text-xs p-4 rounded-lg border overflow-x-auto whitespace-pre-wrap text-neutral-700">{SQL_SETUP}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Peralatan & Perlengkapan</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{inventory.length} jenis &middot; {formatCurrency(totalStockValue)}</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowUsageModal(true)}>
              <TrendingDown size={16} /> Catat Pemakaian
            </button>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Catat Pembelian
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Jenis Item</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{inventory.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Nilai Beli</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(totalPurchaseValue)}</p>
          <p className="text-xs text-neutral-400">{purchases.length} transaksi</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Nilai Stok Saat Ini</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(totalStockValue)}</p>
          <p className="text-xs text-neutral-400">{usages.length} catatan pemakaian</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="border-b border-neutral-100 px-4 pt-3">
          <div className="tab-bar">
            <button className={tab === 'inventory' ? 'tab-active' : 'tab-inactive'} onClick={() => setTab('inventory')}>
              Stok Inventaris
            </button>
            <button className={tab === 'purchases' ? 'tab-active' : 'tab-inactive'} onClick={() => setTab('purchases')}>
              Pembelian ({purchases.length})
            </button>
            <button className={tab === 'usages' ? 'tab-active' : 'tab-inactive'} onClick={() => setTab('usages')}>
              Pemakaian ({usages.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center"><p className="text-neutral-400">Memuat...</p></div>
        ) : tab === 'inventory' ? (
          inventory.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={32} className="mx-auto text-neutral-200 mb-3" />
              <p className="text-neutral-400">Belum ada data stok. Mulai dengan mencatat pembelian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {inventory.map((item) => (
                <div key={item.name} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-neutral-800">{item.name}</p>
                    </div>
                    <div className="bg-primary-50 p-2 rounded-lg flex-shrink-0">
                      <Wrench size={14} className="text-primary-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-neutral-800">{item.qty_on_hand.toLocaleString()}</p>
                  <p className="text-sm text-neutral-500 mt-0.5">{item.unit}</p>
                  <div className="mt-3 pt-3 border-t border-neutral-100">
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>Nilai Stok</span>
                      <span className="font-medium text-neutral-700">{formatCurrency(item.total_value)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === 'purchases' ? (
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
                  <tr><td colSpan={8} className="text-center text-neutral-400 py-8">Belum ada data pembelian</td></tr>
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
                          <button className="btn-ghost btn-sm p-1.5" onClick={() => setEditingPurchase(p)}><Pencil size={14} /></button>
                          <button className="btn-ghost btn-sm p-1.5 text-error-500" onClick={async () => {
                            if (!window.confirm('Hapus data ini?')) return;
                            await supabaseAdmin.from('equipment_purchases').delete().eq('id', p.id).eq('user_id', user!.id);
                            loadData();
                          }}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Item</th>
                  <th>Jumlah</th>
                  <th>Digunakan Oleh</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {usages.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-neutral-400 py-8">Belum ada catatan pemakaian</td></tr>
                ) : usages.map((u: any) => (
                  <tr key={u.id}>
                    <td className="text-sm">{formatDate(u.usage_date)}</td>
                    <td className="font-medium">{u.item_name}</td>
                    <td>{Number(u.quantity)} {u.unit || 'unit'}</td>
                    <td className="text-sm">{u.used_by || '-'}</td>
                    <td className="text-sm text-neutral-500">{u.notes || '-'}</td>
                    <td>
                      {hasRole(['owner', 'manager']) && (
                        <div className="flex items-center gap-1">
                          <button className="btn-ghost btn-sm p-1.5" onClick={() => setEditingUsage(u)}><Pencil size={14} /></button>
                          <button className="btn-ghost btn-sm p-1.5 text-error-500" onClick={async () => {
                            if (!window.confirm('Hapus data ini?')) return;
                            await supabaseAdmin.from('equipment_usages').delete().eq('id', u.id).eq('user_id', user!.id);
                            loadData();
                          }}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Catat Pembelian Peralatan" size="md">
        <PurchaseForm onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
      <Modal open={!!editingPurchase} onClose={() => setEditingPurchase(null)} title="Edit Pembelian" size="md">
        {editingPurchase && <PurchaseForm initialData={editingPurchase} onClose={() => { setEditingPurchase(null); loadData(); }} />}
      </Modal>
      <Modal open={showUsageModal} onClose={() => setShowUsageModal(false)} title="Catat Pemakaian" size="md">
        <UsageForm purchaseItems={[...new Set(purchases.map(p => p.name))]} onClose={() => { setShowUsageModal(false); loadData(); }} />
      </Modal>
      <Modal open={!!editingUsage} onClose={() => setEditingUsage(null)} title="Edit Pemakaian" size="md">
        {editingUsage && <UsageForm purchaseItems={[...new Set(purchases.map(p => p.name))]} initialData={editingUsage} onClose={() => { setEditingUsage(null); loadData(); }} />}
      </Modal>
    </div>
  );
}

function PurchaseForm({ initialData, onClose }: { initialData?: any; onClose: () => void }) {
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
      name: form.name.trim(), category: form.category, quantity: qty, unit: form.unit,
      price_per_unit: ppu, total_amount: qty * ppu,
      supplier: form.supplier || null, purchase_date: form.purchase_date,
      notes: form.notes || null, user_id: user!.id,
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

function UsageForm({ initialData, purchaseItems, onClose }: { initialData?: any; purchaseItems: string[]; onClose: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    item_name: initialData?.item_name || '',
    quantity: initialData?.quantity || '',
    unit: initialData?.unit || 'unit',
    usage_date: initialData?.usage_date || new Date().toISOString().split('T')[0],
    used_by: initialData?.used_by || '',
    notes: initialData?.notes || '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    if (!form.item_name.trim() || !qty) { alert('Nama item dan jumlah harus diisi'); return; }
    const payload = {
      item_name: form.item_name.trim(), quantity: qty, unit: form.unit,
      usage_date: form.usage_date,
      used_by: form.used_by || null, notes: form.notes || null, user_id: user!.id,
    };
    try {
      if (initialData) {
        const { error } = await supabaseAdmin.from('equipment_usages').update(payload).eq('id', initialData.id).eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from('equipment_usages').insert(payload);
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
          <input
            name="item_name"
            className="input"
            list="equipment-items"
            value={form.item_name}
            onChange={change}
            required
            placeholder="Pilih atau ketik nama item"
          />
          <datalist id="equipment-items">
            {purchaseItems.map(name => <option key={name} value={name} />)}
          </datalist>
        </div>
        <div>
          <label className="label">Tanggal</label>
          <input name="usage_date" type="date" className="input" value={form.usage_date} onChange={change} />
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
          <label className="label">Digunakan Oleh</label>
          <input name="used_by" className="input" value={form.used_by} onChange={change} placeholder="Nama petugas" />
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
