import { useState, useEffect } from 'react';
import { ClipboardList, Plus, ShoppingCart, Package, Trash2, Pencil } from 'lucide-react';
import { getFeeds } from '../../lib/api';
import { getFeedFormulas, getFeedFormulaItems, createFeedFormula, createFeedFormulaItem, deleteFeedFormula, updateFeedFormula } from '../../lib/api/feed';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { FeedPurchaseForm } from './FeedPurchaseForm';
import { FeedConsumeForm } from './FeedConsumeForm';

export function FeedFormulasPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [formulas, setFormulas] = useState<any[]>([]);
  const [formulaItems, setFormulaItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [editingFormula, setEditingFormula] = useState<any | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDeleteFormula = async (id: string) => {
    if (!window.confirm('Hapus formula ransum ini?')) return;
    await deleteFeedFormula(user!.id, id).catch(() => {});
    loadData();
  };

  const loadData = () => {
    if (!user?.id) return;
    getFeedFormulas(user.id)
      .then(async (data) => {
        setFormulas(data as any[]);
        const itemsMap: Record<string, any[]> = {};
        await Promise.all(data.map(async (f: any) => {
          const items = await getFeedFormulaItems(user.id, f.id).catch(() => []);
          itemsMap[f.id] = items as any[];
        }));
        setFormulaItems(itemsMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('page.feed.formulas')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {formulas.length} formula ransum tersedia
          </p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowFormulaModal(true)}>
              <Plus size={16} /> Buat Formula
            </button>
            <button className="btn-secondary" onClick={() => setShowConsumeModal(true)}>
              <Package size={16} /> {t('feed.use')}
            </button>
            <button className="btn-primary" onClick={() => setShowPurchaseModal(true)}>
              <ShoppingCart size={16} /> {t('feed.purchase')}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : formulas.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList size={48} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">Belum ada formula ransum</p>
          <p className="text-sm text-neutral-400 mt-1">Buat formula ransum untuk membantu perencanaan pakan ternak</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {formulas.map((f: any) => {
            const items = formulaItems[f.id] || [];
            const isExpanded = expandedId === f.id;
            return (
              <div key={f.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-neutral-800 text-lg">{f.name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {f.target_species} &middot; {f.target_phase || '-'}
                      {f.target_purpose ? ` &middot; ${f.target_purpose}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`badge ${f.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {f.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    {hasRole(['owner', 'manager']) && (
                      <>
                        <button className="btn-ghost text-neutral-400 hover:text-primary-600 p-1" title="Edit" onClick={() => setEditingFormula(f)}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn-ghost text-neutral-400 hover:text-error-600 p-1" title="Hapus" onClick={() => handleDeleteFormula(f.id)}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-3">
                  <div><span className="text-neutral-400">Total:</span> <span className="font-medium">{Number(f.total_quantity_kg || f.total_weight_kg).toLocaleString()} kg</span></div>
                  {f.calculated_cost_per_kg != null && (
                    <div><span className="text-neutral-400">Biaya/kg:</span> <span className="font-medium">Rp {Number(f.calculated_cost_per_kg).toLocaleString()}</span></div>
                  )}
                  {f.calculated_protein_pct != null && (
                    <div><span className="text-neutral-400">Protein:</span> <span className="font-medium">{f.calculated_protein_pct}%</span></div>
                  )}
                  {f.calculated_tdn_pct != null && (
                    <div><span className="text-neutral-400">TDN:</span> <span className="font-medium">{f.calculated_tdn_pct}%</span></div>
                  )}
                </div>
                <button
                  className="text-xs text-primary-600 font-medium hover:text-primary-700"
                  onClick={() => setExpandedId(isExpanded ? null : f.id)}
                >
                  {isExpanded ? 'Sembunyikan komposisi' : `Lihat komposisi (${items.length} item)`}
                </button>
                {isExpanded && items.length > 0 && (
                  <div className="mt-3 border-t border-neutral-100 pt-3 space-y-2">
                    {items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-neutral-700">{item.feeds?.name || '-'}</span>
                        <span className="font-medium text-neutral-800">
                          {Number(item.quantity_kg).toLocaleString()} kg
                          {item.percentage != null ? ` (${item.percentage}%)` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {f.notes && (
                  <p className="text-xs text-neutral-400 mt-3 italic">{f.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title={t('feed.purchase.title')} size="md">
        <FeedPurchaseForm type="feed" t={t} onClose={() => { setShowPurchaseModal(false); }} />
      </Modal>

      <Modal open={showConsumeModal} onClose={() => setShowConsumeModal(false)} title={t('feed.usage.title')} size="md">
        <FeedConsumeForm t={t} onClose={() => { setShowConsumeModal(false); }} />
      </Modal>

      <Modal open={showFormulaModal} onClose={() => setShowFormulaModal(false)} title="Buat Formula Ransum Baru" size="lg">
        <FormulaForm t={t} onClose={() => { setShowFormulaModal(false); loadData(); }} />
      </Modal>

      <Modal open={!!editingFormula} onClose={() => setEditingFormula(null)} title="Edit Formula Ransum" size="md">
        {editingFormula && (
          <FormulaEditForm
            formula={editingFormula}
            onClose={() => { setEditingFormula(null); loadData(); }}
          />
        )}
      </Modal>
    </div>
  );
}

function FormulaEditForm({ formula, onClose }: { formula: any; onClose: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: formula.name || '',
    target_species: formula.target_species || 'cattle',
    target_purpose: formula.target_purpose || 'dairy',
    target_phase: formula.target_phase || '',
    notes: formula.notes || '',
    is_active: formula.is_active ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const change = (e: React.ChangeEvent<any>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { alert('Nama formula harus diisi'); return; }
    setSubmitting(true);
    try {
      await updateFeedFormula(user!.id, formula.id, {
        name: form.name,
        target_species: form.target_species as any,
        target_purpose: form.target_purpose as any,
        target_phase: form.target_phase,
        notes: form.notes || undefined,
        is_active: form.is_active,
      });
      onClose();
    } catch (err: any) { alert('Gagal: ' + (err?.message || err)); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div className="col-span-2">
          <label className="label">Nama Formula <span className="text-error-500">*</span></label>
          <input name="name" className="input" value={form.name} onChange={change} required />
        </div>
        <div>
          <label className="label">Spesies Target</label>
          <select name="target_species" className="select" value={form.target_species} onChange={change}>
            <option value="cattle">Sapi</option>
            <option value="sheep">Domba</option>
            <option value="goat">Kambing</option>
          </select>
        </div>
        <div>
          <label className="label">Tujuan</label>
          <select name="target_purpose" className="select" value={form.target_purpose} onChange={change}>
            <option value="dairy">Perah</option>
            <option value="beef">Potong</option>
            <option value="dual">Dwifungsi</option>
            <option value="wool">Wol</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Fase Target</label>
          <input name="target_phase" className="input" placeholder="Laktasi, Penggemukan..." value={form.target_phase} onChange={change} />
        </div>
        <div className="col-span-2">
          <label className="label">Catatan</label>
          <input name="notes" className="input" value={form.notes} onChange={change} />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="is_active" name="is_active" checked={form.is_active} onChange={change} className="w-4 h-4" />
          <label htmlFor="is_active" className="text-sm font-medium text-neutral-700">Formula Aktif</label>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Batal</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Pencil size={14} />}
          Simpan Perubahan
        </button>
      </div>
    </form>
  );
}

function FormulaForm({ t: _t, onClose }: { t: (key: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const [feedList, setFeedList] = useState<any[]>([]);
  const [items, setItems] = useState<{ feed_id: string; quantity_kg: string }[]>([]);
  const [form, setForm] = useState({
    name: '', target_species: 'cattle', target_purpose: 'dairy', target_phase: '', total_quantity_kg: '100',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => { getFeeds(user!.id).then(setFeedList).catch(() => {}); }, []);

  const addItem = () => setItems(i => [...i, { feed_id: '', quantity_kg: '' }]);
  const removeItem = (idx: number) => setItems(i => i.filter((_, k) => k !== idx));
  const updateItem = (idx: number, field: string, value: string) => {
    setItems(i => i.map((item, k) => k === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.target_phase) { alert('Nama dan fase target harus diisi'); return; }
    if (items.length === 0 || !items.some(i => i.feed_id && Number(i.quantity_kg) > 0)) { alert('Tambahkan minimal 1 item pakan'); return; }
    setSubmitting(true);
    try {
      const totalQty = items.reduce((s, i) => s + (Number(i.quantity_kg) || 0), 0);
      const formula = await createFeedFormula(user!.id, {
        name: form.name,
        target_species: form.target_species as any,
        target_purpose: form.target_purpose as any,
        target_phase: form.target_phase,
        total_quantity_kg: totalQty,
        is_active: true,
        notes: form.notes || undefined,
        created_by: user?.id,
      });
      for (const item of items) {
        if (!item.feed_id || !Number(item.quantity_kg)) continue;
        const pct = totalQty > 0 ? Math.round((Number(item.quantity_kg) / totalQty) * 100 * 100) / 100 : 0;
        await createFeedFormulaItem(user!.id, {
          formula_id: formula.id,
          feed_id: item.feed_id,
          quantity_kg: Number(item.quantity_kg),
          percentage: pct,
        });
      }
      onClose();
    } catch (err: any) { alert('Gagal: ' + (err?.message || err)); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div className="col-span-2">
          <label className="label">Nama Formula <span className="text-error-500">*</span></label>
          <input name="name" className="input" placeholder="Ransum Sapi Perah Laktasi" value={form.name} onChange={change} required />
        </div>
        <div>
          <label className="label">Spesies Target</label>
          <select name="target_species" className="select" value={form.target_species} onChange={change}>
            <option value="cattle">Sapi</option>
            <option value="sheep">Domba</option>
            <option value="goat">Kambing</option>
          </select>
        </div>
        <div>
          <label className="label">Tujuan</label>
          <select name="target_purpose" className="select" value={form.target_purpose} onChange={change}>
            <option value="dairy">Perah</option>
            <option value="beef">Potong</option>
            <option value="dual">Dwifungsi</option>
            <option value="wool">Wol</option>
          </select>
        </div>
        <div>
          <label className="label">Fase <span className="text-error-500">*</span></label>
          <input name="target_phase" className="input" placeholder="Laktasi, Penggemukan..." value={form.target_phase} onChange={change} required />
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-neutral-700">Komposisi Pakan</h3>
          <button type="button" className="btn-secondary btn-sm" onClick={addItem}>+ Tambah Item</button>
        </div>
        {items.length === 0 && <p className="text-sm text-neutral-400 text-center py-4">Belum ada item. Klik "Tambah Item" untuk mulai.</p>}
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select className="select flex-1" value={item.feed_id} onChange={e => updateItem(idx, 'feed_id', e.target.value)}>
                <option value="">Pilih pakan...</option>
                {feedList.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <input type="number" className="input w-28" placeholder="kg" value={item.quantity_kg} onChange={e => updateItem(idx, 'quantity_kg', e.target.value)} />
              <button type="button" className="btn-ghost text-error-500 p-1" onClick={() => removeItem(idx)}>&times;</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Batal</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Plus size={14} />}
          Simpan Formula
        </button>
      </div>
    </form>
  );
}
