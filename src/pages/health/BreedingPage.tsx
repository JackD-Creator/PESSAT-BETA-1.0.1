import { useState, useEffect } from 'react';
import { Plus, Baby, Calendar } from 'lucide-react';
import { getBreedingEvents, getAnimals } from '../../lib/api';
import { createBreedingEvent } from '../../lib/api/health';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

const eventLabels: Record<string, string> = {
  heat: 'breeding.form.type.heat', insemination: 'breeding.form.type.insemination', pregnancy_check: 'breeding.form.type.pregcheck',
  birth: 'breeding.form.type.birth', abortion: 'breeding.form.type.abortion', dry_off: 'breeding.form.type.dryoff',
};

const eventColors: Record<string, string> = {
  heat: 'bg-pink-100 text-pink-700',
  insemination: 'bg-blue-100 text-blue-700',
  pregnancy_check: 'bg-earth-100 text-earth-700',
  birth: 'bg-primary-100 text-primary-700',
  abortion: 'bg-error-100 text-error-700',
  dry_off: 'bg-neutral-100 text-neutral-600',
};

export function BreedingPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [breedingEvents, setBreedingEvents] = useState<any[]>([]);
  const [allAnimals, setAllAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date('2026-05-14');

  const loadData = () => {
    Promise.all([
      getBreedingEvents(user?.id),
      getAnimals(user?.id),
    ])
      .then(([events, animals]) => {
        setBreedingEvents(events as any[]);
        setAllAnimals(animals as any[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const pregnantAnimals = allAnimals.filter((a: any) => a.status === 'pregnant');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('breeding.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('breeding.count').replace('{count}', String(pregnantAnimals.length))}</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            {t('breeding.add')}
          </button>
        )}
      </div>

      {/* Pregnant animals summary */}
      {pregnantAnimals.length > 0 && (
        <div className="card p-5">
          <h2 className="section-header mb-4 flex items-center gap-2">
            <Baby size={18} className="text-earth-600" />
            {t('breeding.pregnant.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pregnantAnimals.map(a => {
              const lastInsem = breedingEvents
                .filter((e: any) => e.animal_id === a.id && e.event_type === 'insemination')
                .sort((x, y) => new Date(y.event_date).getTime() - new Date(x.event_date).getTime())[0];
              const daysLeft = lastInsem?.expected_due_date
                ? Math.ceil((new Date(lastInsem.expected_due_date).getTime() - today.getTime()) / 86400000)
                : null;
              return (
                <div key={a.id} className="bg-earth-50 border border-earth-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-neutral-800">{a.tag_id}</span>
                    <span className="text-xs text-earth-600 font-medium bg-earth-100 px-2 py-0.5 rounded-full">{t('breeding.pregnant.status')}</span>
                  </div>
                  <p className="text-sm text-neutral-500">{a.breed}</p>
                  {lastInsem?.expected_due_date && (
                    <div className="mt-2 flex items-center gap-1">
                      <Calendar size={12} className="text-earth-500" />
                      <span className="text-xs text-earth-600">
                        {t('breeding.due')} {new Date(lastInsem.expected_due_date).toLocaleDateString('id-ID')}
                        {daysLeft !== null && <span className="ml-1 font-medium">({daysLeft} {t('breeding.days')})</span>}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All events */}
      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : (
      <div className="card">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="section-header">{t('breeding.history.title')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('breeding.table.tag')}</th>
                <th>{t('breeding.table.type')}</th>
                <th>{t('breeding.table.date')}</th>
                <th>{t('breeding.table.due')}</th>
                <th>{t('breeding.table.offspring')}</th>
                <th>{t('breeding.table.cost')}</th>
                <th>{t('breeding.table.notes')}</th>
              </tr>
            </thead>
            <tbody>
              {breedingEvents.map(e => (
                <tr key={e.id}>
                  <td className="font-semibold text-primary-700">{e.animals?.tag_id || '-'}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eventColors[e.event_type]}`}>
                      {t(eventLabels[e.event_type])}
                    </span>
                  </td>
                  <td>{new Date(e.event_date).toLocaleDateString('id-ID')}</td>
                  <td>
                    {e.expected_due_date ? (
                      <span className="text-earth-600">{new Date(e.expected_due_date).toLocaleDateString('id-ID')}</span>
                    ) : '-'}
                  </td>
                  <td>{e.offspring_count || '-'}</td>
                  <td>Rp {e.cost.toLocaleString('id-ID')}</td>
                  <td className="max-w-[200px] truncate text-neutral-500">{e.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>)}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('breeding.form.title')} size="md">
        <BreedingForm onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}

function BreedingForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [animals, setAnimals] = useState<any[]>([]);
  const [form, setForm] = useState({
    animal_id: '', event_type: 'insemination', event_date: '2026-05-14',
    expected_due_date: '', offspring_count: '', cost: '', notes: '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => { getAnimals(user?.id).then(setAnimals as any).catch(() => {}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animal_id) { alert('Pilih ternak'); return; }
    try {
      await createBreedingEvent(user?.id, {
        animal_id: form.animal_id,
        event_type: form.event_type as any,
        event_date: form.event_date,
        expected_due_date: form.expected_due_date || undefined,
        offspring_count: form.offspring_count ? Number(form.offspring_count) : undefined,
        cost: Number(form.cost) || 0,
        notes: form.notes || undefined,
        recorded_by: (user as any)?.full_name || undefined,
      });
      onClose();
    } catch { alert('Gagal menyimpan event reproduksi'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">{t('breeding.form.tag')} <span className="text-error-500">*</span></label>
          <select name="animal_id" className="select" value={form.animal_id} onChange={change} required>
            <option value="">Pilih ternak...</option>
            {animals.map((a: any) => <option key={a.id} value={a.id}>{a.tag_id} - {a.breed}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('breeding.form.type')}</label>
          <select name="event_type" className="select" value={form.event_type} onChange={change}>
            {Object.entries(eventLabels).map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('breeding.form.date')}</label>
          <input name="event_date" type="date" className="input" value={form.event_date} onChange={change} />
        </div>
        {(form.event_type === 'insemination') && (
          <div>
            <label className="label">{t('breeding.form.due')}</label>
            <input name="expected_due_date" type="date" className="input" value={form.expected_due_date} onChange={change} />
          </div>
        )}
        {form.event_type === 'birth' && (
          <div>
            <label className="label">{t('breeding.form.offspring')}</label>
            <input name="offspring_count" type="number" className="input" value={form.offspring_count} onChange={change} />
          </div>
        )}
        <div>
          <label className="label">{t('breeding.form.cost')}</label>
          <input name="cost" type="number" className="input" value={form.cost} onChange={change} />
        </div>
      </div>
      <div>
        <label className="label">{t('breeding.form.notes')}</label>
        <textarea name="notes" className="input h-20 resize-none" value={form.notes} onChange={change} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary">{t('common.save')}</button>
      </div>
    </form>
  );
}
