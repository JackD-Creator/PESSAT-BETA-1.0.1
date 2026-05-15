import { useState, useEffect } from 'react';
import { Wheat, Plus, Loader } from 'lucide-react';
import { getNutritionRequirements } from '../../lib/api';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

const speciesLabels: Record<string, string> = {
  cattle: 'Sapi', sheep: 'Domba', goat: 'Kambing',
};

const purposeLabels: Record<string, string> = {
  dairy: 'Perah', beef: 'Potong', dual: 'Dwifungsi', wool: 'Wol', breeding: 'Bibit',
};

const defaultRequirements: Record<string, { species: string; purpose: string; phase: string; dm: number; cp: number; tdn: number; ca: number; p: number }[]> = {
  cattle: [
    { species: 'cattle', purpose: 'dairy', phase: 'Laktasi Awal', dm: 16.5, cp: 17, tdn: 70, ca: 0.7, p: 0.45 },
    { species: 'cattle', purpose: 'dairy', phase: 'Laktasi Tengah', dm: 14.5, cp: 15, tdn: 66.5, ca: 0.6, p: 0.4 },
    { species: 'cattle', purpose: 'dairy', phase: 'Kering', dm: 9, cp: 12.5, tdn: 57.5, ca: 0.45, p: 0.325 },
    { species: 'cattle', purpose: 'beef', phase: 'Penggemukan', dm: 12, cp: 13, tdn: 68.5, ca: 0.5, p: 0.35 },
    { species: 'cattle', purpose: 'beef', phase: 'Induk Bunting', dm: 9, cp: 11, tdn: 57.5, ca: 0.45, p: 0.325 },
  ],
  sheep: [
    { species: 'sheep', purpose: 'beef', phase: 'Penggemukan', dm: 1.5, cp: 15, tdn: 67.5, ca: 0.5, p: 0.35 },
    { species: 'sheep', purpose: 'breeding', phase: 'Induk Bunting', dm: 1.25, cp: 13, tdn: 60, ca: 0.6, p: 0.4 },
  ],
  goat: [
    { species: 'goat', purpose: 'beef', phase: 'Penggemukan', dm: 1.25, cp: 15, tdn: 67.5, ca: 0.5, p: 0.35 },
    { species: 'goat', purpose: 'dairy', phase: 'Laktasi', dm: 1.75, cp: 17, tdn: 66.5, ca: 0.7, p: 0.45 },
  ],
};

export function NutritionRequirementsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [seeding, setSeeding] = useState(false);

  const loadData = () => {
    getNutritionRequirements(user?.id)
      .then(data => setRequirements(data as any[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const seedDefaults = async () => {
    if (!user?.id) return;
    setSeeding(true);
    const existing = await getNutritionRequirements(user.id);
    if (existing.length === 0) {
      for (const group of Object.values(defaultRequirements).flat()) {
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
        }).catch(() => {});
      }
    }
    setSeeding(false);
    loadData();
  };

  const filtered = requirements.filter(r => speciesFilter === 'all' || r.species === speciesFilter);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Standar Kebutuhan Nutrisi</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{requirements.length} standar tersedia</p>
        </div>
        <button className="btn-secondary" onClick={seedDefaults} disabled={seeding}>
          {seeding ? <Loader size={14} className="animate-spin" /> : <Wheat size={16} />}
          Inisialisasi Data Default
        </button>
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
          <p className="text-sm text-neutral-400 mt-1">Klik "Inisialisasi Data Default" untuk memuat standar nutrisi dari PRD</p>
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
    </div>
  );
}
