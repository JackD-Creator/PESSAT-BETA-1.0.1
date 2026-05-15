import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Syringe } from 'lucide-react';
import { getVaccinations, getAnimals, getHerdGroups } from '../../lib/api';
import { createVaccination } from '../../lib/api/health';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

export function VaccinationPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date('2026-05-14');

  const loadData = () => {
    getVaccinations(user?.id)
      .then(data => setVaccinations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const upcoming = vaccinations.filter(v => {
    if (!v.next_due_date) return false;
    const days = Math.ceil((new Date(v.next_due_date).getTime() - today.getTime()) / 86400000);
    return days <= 7 && days >= 0;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('vaccination.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('vaccination.count').replace('{count}', String(upcoming.length))}</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            {t('vaccination.add')}
          </button>
        )}
      </div>

      {upcoming.length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-warning-600" />
            <span className="font-semibold text-warning-700">{t('vaccination.upcoming')}</span>
          </div>
          <div className="space-y-2">
            {upcoming.map(v => {
              const days = Math.ceil((new Date(v.next_due_date!).getTime() - today.getTime()) / 86400000);
              return (
                <div key={v.id} className="flex items-center justify-between bg-white/80 rounded-lg px-4 py-2">
                  <div>
                    <span className="font-medium text-neutral-800">{v.vaccine_name}</span>
                    <span className="text-sm text-neutral-500 ml-2">
                      · {v.animals?.tag_id || v.herd_groups?.name || '-'}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${days <= 3 ? 'text-error-600' : 'text-warning-600'}`}>
                    {days === 0 ? t('vaccination.today') : t('vaccination.days.left').replace('{days}', String(days))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : (
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('vaccination.table.target')}</th>
                <th>{t('vaccination.table.vaccine')}</th>
                <th>{t('vaccination.table.batch')}</th>
                <th>{t('vaccination.table.date')}</th>
                <th>{t('vaccination.table.due')}</th>
                <th>{t('vaccination.table.cost')}</th>
                <th>{t('vaccination.table.officer')}</th>
                <th>{t('vaccination.table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {vaccinations.map(v => {
                const daysUntilDue = v.next_due_date
                  ? Math.ceil((new Date(v.next_due_date).getTime() - today.getTime()) / 86400000)
                  : null;
                const isOverdue = daysUntilDue !== null && daysUntilDue <= 0;
                const isDueSoon = daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 7;
                return (
                  <tr key={v.id}>
                    <td className="font-semibold text-primary-700">
                      {v.animals?.tag_id || v.herd_groups?.name || '-'}
                    </td>
                    <td>{v.vaccine_name}</td>
                    <td className="text-neutral-500">{v.batch_number || '-'}</td>
                    <td>{new Date(v.date_administered).toLocaleDateString('id-ID')}</td>
                    <td>
                      {v.next_due_date ? (
                        <span className={`font-medium ${isOverdue ? 'text-error-600' : isDueSoon ? 'text-warning-600' : 'text-neutral-700'}`}>
                          {new Date(v.next_due_date).toLocaleDateString('id-ID')}
                          {isDueSoon && <span className="ml-1 text-xs">({daysUntilDue}h)</span>}
                        </span>
                      ) : '-'}
                    </td>
                    <td>Rp {v.cost.toLocaleString('id-ID')}</td>
                    <td>{v.administered_by || '-'}</td>
                    <td>
                      {isOverdue ? (
                        <span className="badge badge-red">{t('status.overdue')}</span>
                      ) : isDueSoon ? (
                        <span className="badge badge-yellow">{t('status.due.soon')}</span>
                      ) : (
                        <span className="badge badge-green">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>)}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('vaccination.form.title')} size="lg">
        <VaccinationForm onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}

function VaccinationForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [animals, setAnimals] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [form, setForm] = useState({
    target: 'individual', animal_id: '', herd_group_id: '',
    vaccine_name: '', batch_number: '', date_administered: '2026-05-14',
    next_due_date: '', cost: '', administered_by: '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    Promise.all([getAnimals(user?.id), getHerdGroups(user?.id)])
      .then(([a, g]) => { setAnimals(a as any[]); setGroups(g as any[]); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vaccine_name) { alert('Nama vaksin harus diisi'); return; }
    try {
      const payload: any = {
        vaccine_name: form.vaccine_name,
        batch_number: form.batch_number || undefined,
        date_administered: form.date_administered,
        next_due_date: form.next_due_date || undefined,
        cost: Number(form.cost) || 0,
        administered_by: form.administered_by || (user as any)?.full_name || undefined,
      };
      if (form.target === 'individual') payload.animal_id = form.animal_id;
      else payload.herd_group_id = form.herd_group_id || undefined;
      await createVaccination(user?.id, payload);
      onClose();
    } catch { alert('Gagal menyimpan vaksinasi'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">{t('vaccination.form.target')}</label>
        <div className="flex gap-3">
          {['individual', 'group'].map(val => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="target" value={val} checked={form.target === val} onChange={change} />
              <span className="text-sm">{val === 'individual' ? t('vaccination.form.target.individual') : t('vaccination.form.target.group')}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="form-grid-2">
        {form.target === 'individual' ? (
          <div>
            <label className="label">{t('vaccination.form.tag')}</label>
            <select name="animal_id" className="select" value={form.animal_id} onChange={change}>
              <option value="">Pilih ternak...</option>
              {animals.map((a: any) => <option key={a.id} value={a.id}>{a.tag_id} - {a.breed}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="label">{t('vaccination.form.group')}</label>
            <select name="herd_group_id" className="select" value={form.herd_group_id} onChange={change}>
              <option value="">{t('vaccination.form.group.placeholder')}</option>
              {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">{t('vaccination.form.vaccine')} <span className="text-error-500">*</span></label>
          <input name="vaccine_name" className="input" placeholder="Vaksin Anthrax" value={form.vaccine_name} onChange={change} required />
        </div>
        <div>
          <label className="label">{t('vaccination.form.batch')}</label>
          <input name="batch_number" className="input" value={form.batch_number} onChange={change} />
        </div>
        <div>
          <label className="label">{t('vaccination.form.date')}</label>
          <input name="date_administered" type="date" className="input" value={form.date_administered} onChange={change} />
        </div>
        <div>
          <label className="label">{t('vaccination.form.due')}</label>
          <input name="next_due_date" type="date" className="input" value={form.next_due_date} onChange={change} />
        </div>
        <div>
          <label className="label">{t('vaccination.form.cost')}</label>
          <input name="cost" type="number" className="input" value={form.cost} onChange={change} />
        </div>
        <div>
          <label className="label">{t('vaccination.form.officer')}</label>
          <input name="administered_by" className="input" placeholder="drh. Hasan" value={form.administered_by} onChange={change} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary"><Syringe size={14} /> {t('common.save')}</button>
      </div>
    </form>
  );
}
