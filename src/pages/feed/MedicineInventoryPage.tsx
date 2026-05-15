import { useState, useEffect } from 'react';
import { AlertTriangle, Pill, Leaf, Sparkles, Plus } from 'lucide-react';
import { getMedicineInventory, createMedicine } from '../../lib/api';
import { getMedicinePurchases, getMedicineUsages } from '../../lib/api/medicine';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';

function formatCurrency(n: number) { return `Rp. ${n.toLocaleString('id-ID')},-`; }

const OBAT_TYPES = ['antibiotic', 'antiparasitic', 'hormone', 'anti_inflammatory', 'vaccine'];
const VITAMIN_TYPES = ['vitamin'];
const SUPLEMEN_TYPES = ['other'];

const TYPE_LABELS: Record<string, string> = {
  antibiotic: 'Antibiotik', vitamin: 'Vitamin', vaccine: 'Vaksin',
  antiparasitic: 'Antiparasit', hormone: 'Hormon', anti_inflammatory: 'Anti Inflamasi', other: 'Suplemen',
};

export function MedicineInventoryPage() {
  const { hasRole, user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [usages, setUsages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('antibiotic');

  const loadData = () => {
    if (!user?.id) return;
    Promise.all([
      getMedicineInventory(user.id),
      getMedicinePurchases(user.id),
      getMedicineUsages(user.id),
    ])
      .then(([inv, pur, use]) => {
        setInventory(inv as any[]);
        setPurchases(pur as any[]);
        setUsages(use as any[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const obatItems = inventory.filter((m: any) => OBAT_TYPES.includes(m.medicines?.type));
  const vitaminItems = inventory.filter((m: any) => VITAMIN_TYPES.includes(m.medicines?.type));
  const suplemenItems = inventory.filter((m: any) => SUPLEMEN_TYPES.includes(m.medicines?.type));
  const lowStock = inventory.filter((m: any) => m.quantity_on_hand < m.min_threshold);

  const calcValue = (items: any[]) => items.reduce((s: number, m: any) => s + Number(m.total_cost), 0);
  const calcQty = (items: any[]) => items.reduce((s: number, m: any) => s + Number(m.quantity_on_hand), 0);
  const totalPurchaseValue = purchases.reduce((s: number, p: any) => s + Number(p.total_amount), 0);
  const totalUsageValue = usages.reduce((s: number, u: any) => s + Number(u.total_cost), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Obat, Vitamin & Suplemen</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{inventory.length} jenis terdaftar</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Tambah Item
          </button>
        )}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-error-50 border border-error-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-error-600" />
            <span className="font-semibold text-error-700">Stok Menipis</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((m: any) => (
              <span key={m.id} className="text-xs bg-error-100 text-error-700 px-3 py-1 rounded-full font-medium">
                {m.medicines?.name || '-'}: {m.quantity_on_hand}/{m.min_threshold} pcs
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Pembelian</p>
          <p className="text-xl font-bold text-neutral-800 mt-1">{formatCurrency(totalPurchaseValue)}</p>
          <p className="text-xs text-neutral-400">{purchases.length} transaksi</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Pemberian</p>
          <p className="text-xl font-bold text-neutral-800 mt-1">{formatCurrency(totalUsageValue)}</p>
          <p className="text-xs text-neutral-400">{usages.length} catatan</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Nilai Stok Total</p>
          <p className="text-xl font-bold text-neutral-800 mt-1">{formatCurrency(calcValue(inventory))}</p>
          <p className="text-xs text-neutral-400">{inventory.length} jenis</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Stok Menipis</p>
          <p className="text-xl font-bold text-error-600 mt-1">{lowStock.length}</p>
          <p className="text-xs text-neutral-400">jenis perlu restok</p>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">Memuat...</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Obat */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="bg-red-100 p-1.5 rounded-lg"><Pill size={14} className="text-red-600" /></div>
              <div>
                <p className="font-semibold text-neutral-800 text-sm">Obat</p>
                <p className="text-xs text-neutral-400">{obatItems.length} jenis &middot; {calcQty(obatItems)} pcs &middot; {formatCurrency(calcValue(obatItems))}</p>
              </div>
            </div>
            {obatItems.length === 0 ? (
              <div className="card p-6 text-center text-sm text-neutral-400">Belum ada stok obat</div>
            ) : obatItems.map((m: any) => <StockCard key={m.id} item={m} />)}
          </div>

          {/* Vitamin */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="bg-yellow-100 p-1.5 rounded-lg"><Leaf size={14} className="text-yellow-600" /></div>
              <div>
                <p className="font-semibold text-neutral-800 text-sm">Vitamin</p>
                <p className="text-xs text-neutral-400">{vitaminItems.length} jenis &middot; {calcQty(vitaminItems)} pcs &middot; {formatCurrency(calcValue(vitaminItems))}</p>
              </div>
            </div>
            {vitaminItems.length === 0 ? (
              <div className="card p-6 text-center text-sm text-neutral-400">Belum ada stok vitamin</div>
            ) : vitaminItems.map((m: any) => <StockCard key={m.id} item={m} />)}
          </div>

          {/* Suplemen */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="bg-green-100 p-1.5 rounded-lg"><Sparkles size={14} className="text-green-600" /></div>
              <div>
                <p className="font-semibold text-neutral-800 text-sm">Suplemen</p>
                <p className="text-xs text-neutral-400">{suplemenItems.length} jenis &middot; {calcQty(suplemenItems)} pcs &middot; {formatCurrency(calcValue(suplemenItems))}</p>
              </div>
            </div>
            {suplemenItems.length === 0 ? (
              <div className="card p-6 text-center text-sm text-neutral-400">Belum ada stok suplemen</div>
            ) : suplemenItems.map((m: any) => <StockCard key={m.id} item={m} />)}
          </div>
        </div>
      )}

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Item Baru" size="sm">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!newName.trim()) { alert('Nama harus diisi'); return; }
          try {
            await createMedicine(user!.id, { name: newName.trim(), type: newType as any, unit: 'pcs', is_active: true });
            setShowAddModal(false);
            setNewName('');
            setNewType('antibiotic');
            loadData();
          } catch { alert('Gagal menambah item'); }
        }} className="space-y-4">
          <div>
            <label className="label">Nama <span className="text-error-500">*</span></label>
            <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Contoh: Amoxicillin 500mg" required />
          </div>
          <div>
            <label className="label">Kategori</label>
            <select className="select" value={newType} onChange={e => setNewType(e.target.value)}>
              <option value="antibiotic">Antibiotik (Obat)</option>
              <option value="antiparasitic">Antiparasit (Obat)</option>
              <option value="vaccine">Vaksin (Obat)</option>
              <option value="hormone">Hormon (Obat)</option>
              <option value="anti_inflammatory">Anti Inflamasi (Obat)</option>
              <option value="vitamin">Vitamin</option>
              <option value="other">Suplemen</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Batal</button>
            <button type="submit" className="btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StockCard({ item }: { item: any }) {
  const isLow = item.quantity_on_hand < item.min_threshold;
  const pct = Math.min(100, (item.quantity_on_hand / Math.max(item.min_threshold * 3, item.quantity_on_hand, 1)) * 100);
  return (
    <div className={`card p-4 ${isLow ? 'border-error-200' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-neutral-800 text-sm">{item.medicines?.name || '-'}</p>
          <p className="text-xs text-neutral-400 capitalize">{TYPE_LABELS[item.medicines?.type] || item.medicines?.type || '-'}</p>
        </div>
        {isLow && <span className="badge badge-red text-xs flex-shrink-0">Menipis</span>}
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className={`text-2xl font-bold ${isLow ? 'text-error-600' : 'text-neutral-800'}`}>{Number(item.quantity_on_hand)}</span>
        <span className="text-xs text-neutral-500">{item.medicines?.unit || 'pcs'}</span>
      </div>
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full ${isLow ? 'bg-error-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-neutral-400">
        <span>Min: {item.min_threshold}</span>
        <span>{formatCurrency(Number(item.total_cost))}</span>
      </div>
      {item.expiry_date && (
        <p className="text-xs text-warning-600 mt-1">Exp: {new Date(item.expiry_date).toLocaleDateString('id-ID')}</p>
      )}
    </div>
  );
}
