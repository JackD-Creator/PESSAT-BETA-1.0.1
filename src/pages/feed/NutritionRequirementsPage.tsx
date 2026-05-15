import { useState, useEffect } from 'react';
import { Wheat, Loader, Plus, Pencil, Trash2 } from 'lucide-react';
import { getNutritionRequirements, createNutritionRequirement, updateNutritionRequirement, deleteNutritionRequirement } from '../../lib/api';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

const speciesLabels: Record<string, string> = {
  cattle: 'Sapi', sheep: 'Domba', goat: 'Kambing',
};

const purposeLabels: Record<string, string> = {
  dairy: 'Perah', beef: 'Potong', dual: 'Dwifungsi', wool: 'Wol', breeding: 'Bibit',
};

const defaultRequirements = [
  { species: 'cattle', purpose: 'dairy', phase: 'Laktasi Awal', dm: 16.5, cp: 17, tdn: 70, ca: 0.7, p: 0.45 },
  { species: 'cattle', purpose: 'dairy', phase: 'Laktasi Tengah', dm: 14.5, cp: 15, tdn: 66.5, ca: 0.6, p: 0.4 },
  { species: 'cattle', purpose: 'dairy', phase: 'Kering', dm: 9, cp: 12.5, tdn: 57.5, ca: 0.45, p: 0.325 },
  { species: 'cattle', purpose: 'beef', phase: 'Penggemukan', dm: 12, cp: 13, tdn: 68.5, ca: 0.5, p: 0.35 },
  { species: 'cattle', purpose: 'beef', phase: 'Induk Bunting', dm: 9, cp: 11, tdn: 57.5, ca: 0.45, p: 0.325 },
  { species: 'sheep', purpose: 'beef', phase: 'Penggemukan', dm: 1.5, cp: 15, tdn: 67.5, ca: 0.5, p: 0.35 },
  { species: 'sheep', purpose: 'breeding', phase: 'Induk Bunting', dm: 1.25, cp: 13, tdn: 60, ca: 0.6, p: 0.4 },
  { species: 'goat', purpose: 'beef', phase: 'Penggemukan', dm: 1.25, cp: 15, tdn: 67.5, ca: 0.5, p: 0.35 },
  { species: 'goat', purpose: 'dairy', phase: 'Laktasi', dm: 1.75, cp: 17, tdn: 66.5, ca: 0.7, p: 0.45 },
];

const emptyForm = {
  species: 'cattle', purpose: 'dairy', physiological_phase: '',
  daily_dm_intake_kg: '', cp_requirement_pct: '', tdn_requirement_pct: '',
  ca_requirement_pct: '', p_requirement_pct: '', me_requirement_mcal: '',
  weight_range_kg: '', reference: '',
};

export function NutritionRequirementsPage() {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [seeding, setSeeding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    getNutritionRequirements(user!.id)
      .then(data => setRequirements(data as any[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditingItem(null);
    setShowModal(true);
  };

  const openEdit = (r: any) => {
    setForm({
      species: r.species || 'cattle',
      purpose: r.purpose || 'dairy',
      physiological_phase: r.physiological_phase || '',
      daily_dm_intake_kg: r.daily_dm_intake_kg ?? '',
      cp_requirement_pct: r.cp_requirement_pct ?? '',
      tdn_requirement_pct: r.tdn_requirement_pct ?? '',
      ca_requirement_pct: r.ca_requirement_pct ?? '',
      p_requirement_pct: r.p_requirement_pct ?? '',
      me_requirement_mcal: r.me_requirement_mcal ?? '',
      weight_range_kg: r.weight_range_kg || '',
      reference: r.reference || '',
    });
    setEditingItem(r);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus standar nutrisi ini?')) return;
    try {
      await deleteNutritionRequirement(user!.id, id);
      loadData();
    } catch { alert('Gagal menghapus'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.physiological_phase.trim()) { alert('Fase fisiologis harus diisi'); return; }
    setSaving(true);
    const payload: any = {
      species: form.species,
      purpose: form.purpose,
      physiological_phase: form.physiological_phase.trim(),
      daily_dm_intake_kg: form.daily_dm_intake_kg !== '' ? Number(form.daily_dm_intake_kg) : null,
      cp_requirement_pct: form.cp_requirement_pct !== '' ? Number(form.cp_requirement_pct) : null,
      tdn_requirement_pct: form.tdn_requirement_pct !== '' ? Number(form.tdn_requirement_pct) : null,
      ca_requirement_pct: form.ca_requirement_pct !== '' ? Number(form.ca_requirement_pct) : null,
      p_requirement_pct: form.p_requirement_pct !== '' ? Number(form.p_requirement_pct) : null,
      me_requirement_mcal: form.me_requirement_mcal !== '' ? Number(form.me_requirement_mcal) : null,
      weight_range_kg: form.weight_range_kg || null,
      reference: form.reference || null,
    };
    try {
      if (editingItem) {
        await updateNutritionRequirement(user!.id, editingItem.id, payload);
      } else {
        await createNutritionRequirement(user!.id, payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const seedDefaults = async () => {
    if (!user?.id) return;
    setSeeding(true);
    const existing = await getNutritionRequirements(user.id);
    if (existing.length === 0) {
      for (const group of defaultRequirements) {
        await supabaseAdmin.from('nutrition_requirements').insert({
          species: group.species,
          purpose: group.purpose,
          physiological_phase: group.phase,
          daily_dm_intake_kg: group.dm,
          cp_requirement_pct: group.cp,
          tdn_requirement_pct: group.tdn,
          ca_requirement_pct: group.ca,
          p_requirement_pct: group.p,
          user_id: user.id,
        }).then(() => {}, () => {});
      }
    }
    setSeeding(false);
    loadData();
  };

  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const filtered = requirements.filter(r => speciesFilter === 'all' || r.species === speciesFilter);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Standar Kebutuhan Nutrisi</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{requirements.length} standar tersedia</p>
        </div>
        <div className="flex gap-2">
          {requirements.length === 0 && (
            <button className="btn-secondary" onClick={seedDefaults} disabled={seeding}>
              {seeding ? <Loader size={14} className="animate-spin" /> : <Wheat size={16} />}
              Inisialisasi Data Default
            </button>
          )}
          {hasRole(['owner', 'manager']) && (
            <button className="btn-primary" onClick={openAdd}>
              <Plus size={16} /> Tambah Standar
            </button>
          )}
        </div>
      </div>

      <div className="tab-bar w-fit mb-4">
        {[{ val: 'all', label: 'Semua' }, { val: 'cattle', label: 'Sapi' }, { val: 'sheep', label: 'Domba' }, { val: 'goat', label: 'Kambing' }].map(o => (
          <button key={o.val} className={speciesFilter === o.val ? 'tab-active' : 'tab-inactive'} onClick={() => setSpeciesFilter(o.val)}>
            {o.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Wheat size={48} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">Belum ada data kebutuhan nutrisi</p>
          <p className="text-sm text-neutral-400 mt-1">Klik "Inisialisasi Data Default" atau "Tambah Standar"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(r => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-green">{speciesLabels[r.species] || r.species}</span>
                    <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                      {purposeLabels[r.purpose] || r.purpose}
                    </span>
                  </div>
                  <p className="font-semibold text-neutral-800 text-lg">{r.physiological_phase}</p>
                </div>
                {hasRole(['owner', 'manager']) && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button className="btn-ghost btn-sm p-1 text-neutral-400 hover:text-neutral-700" onClick={() => openEdit(r)}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn-ghost btn-sm p-1 text-neutral-400 hover:text-error-500" onClick={() => handleDelete(r.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {r.daily_dm_intake_kg != null && (
                  <div className="bg-neutral-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-400">BK (kg/hari)</p>
                    <p className="text-lg font-bold text-neutral-800">{r.daily_dm_intake_kg}</p>
                  </div>
                )}
                {r.cp_requirement_pct != null && (
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-500">Protein (%)</p>
                    <p className="text-lg font-bold text-blue-700">{r.cp_requirement_pct}%</p>
                  </div>
                )}
                {r.tdn_requirement_pct != null && (
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-500">TDN (%)</p>
                    <p className="text-lg font-bold text-amber-700">{r.tdn_requirement_pct}%</p>
                  </div>
                )}
                {r.ca_requirement_pct != null && (
                  <div className="bg-stone-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-400">Ca (%)</p>
                    <p className="text-lg font-bold text-neutral-700">{r.ca_requirement_pct}%</p>
                  </div>
                )}
                {r.p_requirement_pct != null && (
                  <div className="bg-stone-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-400">P (%)</p>
                    <p className="text-lg font-bold text-neutral-700">{r.p_requirement_pct}%</p>
                  </div>
                )}
                {r.me_requirement_mcal != null && (
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-purple-500">ME (MKal)</p>
                    <p className="text-lg font-bold text-purple-700">{r.me_requirement_mcal}</p>
                  </div>
                )}
                {r.weight_range_kg && (
                  <div className="bg-neutral-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-400">Bobot</p>
                    <p className="text-lg font-bold text-neutral-700">{r.weight_range_kg} kg</p>
                  </div>
                )}
              </div>
              {r.reference && <p className="text-xs text-neutral-400 mt-3 italic">Ref: {r.reference}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Standar Nutrisi' : 'Tambah Standar Nutrisi'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-grid-2">
            <div>
              <label className="label">Jenis Ternak <span className="text-error-500">*</span></label>
              <select name="species" className="select" value={form.species} onChange={change}>
                <option value="cattle">Sapi</option>
                <option value="sheep">Domba</option>
                <option value="goat">Kambing</option>
              </select>
            </div>
            <div>
              <label className="label">Tujuan <span className="text-error-500">*</span></label>
              <select name="purpose" className="select" value={form.purpose} onChange={change}>
                <option value="dairy">Perah</option>
                <option value="beef">Potong</option>
                <option value="dual">Dwifungsi</option>
                <option value="wool">Wol</option>
                <option value="breeding">Bibit</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Fase Fisiologis <span className="text-error-500">*</span></label>
              <input name="physiological_phase" className="input" placeholder="cth: Laktasi Awal, Penggemukan..." value={form.physiological_phase} onChange={change} required />
            </div>
            <div>
              <label className="label">BK (kg/hari)</label>
              <input name="daily_dm_intake_kg" type="number" step="0.01" className="input" placeholder="16.5" value={form.daily_dm_intake_kg} onChange={change} />
            </div>
            <div>
              <label className="label">Protein Kasar (%)</label>
              <input name="cp_requirement_pct" type="number" step="0.01" className="input" placeholder="17" value={form.cp_requirement_pct} onChange={change} />
            </div>
            <div>
              <label className="label">TDN (%)</label>
              <input name="tdn_requirement_pct" type="number" step="0.01" className="input" placeholder="70" value={form.tdn_requirement_pct} onChange={change} />
            </div>
            <div>
              <label className="label">ME (Mkal/kg)</label>
              <input name="me_requirement_mcal" type="number" step="0.01" className="input" placeholder="2.5" value={form.me_requirement_mcal} onChange={change} />
            </div>
            <div>
              <label className="label">Ca (%)</label>
              <input name="ca_requirement_pct" type="number" step="0.001" className="input" placeholder="0.7" value={form.ca_requirement_pct} onChange={change} />
            </div>
            <div>
              <label className="label">P (%)</label>
              <input name="p_requirement_pct" type="number" step="0.001" className="input" placeholder="0.45" value={form.p_requirement_pct} onChange={change} />
            </div>
            <div>
              <label className="label">Rentang Bobot (kg)</label>
              <input name="weight_range_kg" className="input" placeholder="cth: 200-350" value={form.weight_range_kg} onChange={change} />
            </div>
            <div>
              <label className="label">Referensi</label>
              <input name="reference" className="input" placeholder="cth: NRC 2001" value={form.reference} onChange={change} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader size={14} className="animate-spin" /> : null}
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
