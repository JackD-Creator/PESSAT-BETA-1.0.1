import { useState } from 'react';
import { Plus, Search, CheckCircle, Clock } from 'lucide-react';
import { mockHealthRecords } from '../../lib/mockData';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

const typeLabels: Record<string, string> = {
  checkup: 'health.form.type.checkup', illness: 'health.form.type.illness', injury: 'health.form.type.injury',
  treatment: 'health.form.type.treatment', surgery: 'health.form.type.surgery', preventive: 'health.form.type.preventive',
};

export function HealthPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const filtered = mockHealthRecords.filter(r => {
    const matchSearch = r.animal_tag.toLowerCase().includes(search.toLowerCase()) ||
      (r.diagnosis || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ? true : filter === 'unresolved' ? !r.is_resolved : r.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('health.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('health.count').replace('{count}', String(mockHealthRecords.filter(r => !r.is_resolved).length))}</p>
        </div>
        {hasRole(['owner', 'manager', 'worker']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            {t('health.add')}
          </button>
        )}
      </div>

      <div className="card">
        <div className="p-4 border-b border-neutral-100 flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input className="input pl-9" placeholder={t('health.search')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select w-44" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">{t('health.filter.all')}</option>
            <option value="unresolved">{t('health.filter.unresolved')}</option>
            <option value="checkup">{t('health.filter.checkup')}</option>
            <option value="illness">{t('health.filter.illness')}</option>
            <option value="injury">{t('health.filter.injury')}</option>
            <option value="treatment">{t('health.filter.treatment')}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <EmptyState title={t('health.empty')} />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('health.table.tag')}</th>
                  <th>{t('health.table.date')}</th>
                  <th>{t('health.table.type')}</th>
                  <th>{t('health.table.diagnosis')}</th>
                  <th>{t('health.table.vet')}</th>
                  <th>{t('health.table.cost')}</th>
                  <th>{t('health.table.followup')}</th>
                  <th>{t('health.table.status')}</th>
                  <th>{t('health.table.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="font-semibold text-primary-700">{r.animal_tag}</td>
                    <td>{new Date(r.record_date).toLocaleDateString('id-ID')}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.type === 'illness' ? 'bg-error-100 text-error-700' :
                        r.type === 'injury' ? 'bg-warning-100 text-warning-700' :
                        'bg-neutral-100 text-neutral-600'
                      }`}>                      {t(typeLabels[r.type])}</span>
                    </td>
                    <td className="max-w-[200px] truncate">{r.diagnosis}</td>
                    <td>{r.vet_name || '-'}</td>
                    <td>Rp {r.cost.toLocaleString('id-ID')}</td>
                    <td>
                      {r.follow_up_date ? (
                        <span className={new Date(r.follow_up_date) <= new Date('2026-05-17') ? 'text-error-600 font-medium' : ''}>
                          {new Date(r.follow_up_date).toLocaleDateString('id-ID')}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {r.is_resolved ? (
                        <span className="flex items-center gap-1 text-primary-600 text-xs font-medium">
                          <CheckCircle size={12} /> {t('status.resolved')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-error-600 text-xs font-medium">
                          <Clock size={12} /> {t('status.active')}
                        </span>
                      )}
                    </td>
                    <td>
                      {!r.is_resolved && hasRole(['owner', 'manager', 'worker']) && (
                        <button className="btn-ghost btn-sm text-primary-600 px-2 py-1 rounded text-xs font-medium">
                          {t('health.action.complete')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('health.form.title')} size="lg">
        <AddHealthForm onClose={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}

function AddHealthForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    animal_tag: '', record_date: '2026-05-14', type: 'checkup',
    diagnosis: '', treatment: '', vet_name: '', cost: '', follow_up_date: '', notes: '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); alert('Rekam medis tersimpan (demo)'); onClose(); }} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">{t('health.form.tag')} <span className="text-error-500">*</span></label>
          <input name="animal_tag" className="input" placeholder="SP-001" value={form.animal_tag} onChange={change} required />
        </div>
        <div>
          <label className="label">{t('health.form.date')}</label>
          <input name="record_date" type="date" className="input" value={form.record_date} onChange={change} />
        </div>
        <div>
          <label className="label">{t('health.form.type')}</label>
          <select name="type" className="select" value={form.type} onChange={change}>
            {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('health.form.vet')}</label>
          <input name="vet_name" className="input" placeholder="drh. Nama" value={form.vet_name} onChange={change} />
        </div>
      </div>
      <div>
        <label className="label">{t('health.form.diagnosis')}</label>
        <textarea name="diagnosis" className="input h-20 resize-none" value={form.diagnosis} onChange={change} />
      </div>
      <div>
        <label className="label">{t('health.form.treatment')}</label>
        <textarea name="treatment" className="input h-20 resize-none" value={form.treatment} onChange={change} />
      </div>
      <div className="form-grid-2">
        <div>
          <label className="label">{t('health.form.cost')}</label>
          <input name="cost" type="number" className="input" value={form.cost} onChange={change} />
        </div>
        <div>
          <label className="label">{t('health.form.followup')}</label>
          <input name="follow_up_date" type="date" className="input" value={form.follow_up_date} onChange={change} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary">{t('common.save')}</button>
      </div>
    </form>
  );
}
