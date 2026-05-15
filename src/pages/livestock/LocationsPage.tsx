import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader, Pencil, Trash2, Building2 } from 'lucide-react';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Location } from '../../types';

const typeLabels: Record<string, string> = {
  shed: 'Kandang',
  paddock: 'Padang Rumput',
  quarantine: 'Karantina',
  storage: 'Gudang',
  office: 'Kantor',
  milking_parlor: 'Ruang Perah',
};

export function LocationsPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);

  const load = useCallback(() => {
    if (!user?.id) return;
    getLocations(user.id)
      .then(data => setLocations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('page.locations')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{locations.length} lokasi</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            {t('common.add')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : (
        <div className="card">
          {locations.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Building2 size={24} />}
                title="Belum ada lokasi kandang"
                description="Tambahkan lokasi kandang untuk memantau kapasitas dan okupansi."
                action={hasRole(['owner', 'manager']) ? (
                  <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Tambah Lokasi
                  </button>
                ) : undefined}
              />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('herd.table.location')}</th>
                  <th>{t('herd.table.type')}</th>
                  <th>{t('herd.table.capacity')}</th>
                  <th>{t('herd.table.occupied')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {locations.map(loc => (
                  <tr key={loc.id}>
                    <td className="font-medium text-neutral-800">{loc.name}</td>
                    <td>
                      <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                        {(loc.type && typeLabels[loc.type]) || loc.type || '-'}
                      </span>
                    </td>
                    <td>{loc.capacity || '-'}</td>
                    <td>{loc.current_occupancy || 0}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {hasRole(['owner', 'manager']) && (
                        <>
                        <button
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          onClick={() => setEditingLocation(loc)}
                          title={t('common.edit')}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="text-xs text-error-500 hover:text-error-600 font-medium"
                          onClick={() => setDeletingLocation(loc)}
                          title={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                        </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('common.add')} size="md">
        <LocationForm t={t} user={user} onDone={() => { setShowModal(false); load(); }} />
      </Modal>

      <Modal open={!!editingLocation} onClose={() => setEditingLocation(null)} title={t('common.edit')} size="md">
        {editingLocation && (
          <LocationForm t={t} user={user} location={editingLocation} onDone={() => { setEditingLocation(null); load(); }} />
        )}
      </Modal>

      <Modal open={!!deletingLocation} onClose={() => setDeletingLocation(null)} title={t('common.delete')} size="sm">
        {deletingLocation && (
          <div className="space-y-4">
            <p className="text-neutral-600 text-sm">Hapus lokasi <strong>{deletingLocation.name}</strong>?</p>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setDeletingLocation(null)}>{t('common.cancel')}</button>
              <button className="btn-danger" onClick={async () => {
    if (!hasRole(['owner', 'manager'])) return;
    await deleteLocation(user!.id, deletingLocation.id);
                setDeletingLocation(null);
                load();
              }}>{t('common.delete')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function LocationForm({ t, user, location, onDone }: { t: (key: string) => string; user: any; location?: Location; onDone: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: location?.name || '',
    type: location?.type || 'shed',
    capacity: location?.capacity || 0,
    area_sqm: location?.area_sqm || 0,
    notes: location?.notes || '',
  });

  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { alert('Nama lokasi harus diisi'); return; }
    setError('');
    setSubmitting(true);
    try {
      if (location) {
        await updateLocation(user!.id, location.id, {
          name: form.name,
          type: form.type as Location['type'],
          capacity: Number(form.capacity) || 0,
          area_sqm: Number(form.area_sqm) || undefined,
          notes: form.notes || undefined,
        });
      } else {
        await createLocation(user!.id, {
          name: form.name,
          type: form.type as Location['type'],
          capacity: Number(form.capacity) || 0,
          area_sqm: Number(form.area_sqm) || undefined,
          notes: form.notes || undefined,
          current_occupancy: 0,
          is_active: true,
        });
      }
      onDone();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-sm text-error-600 bg-error-50 p-3 rounded-lg">{error}</div>}
      <div>
        <label className="label">{t('herd.form.name')} <span className="text-error-500">*</span></label>
        <input name="name" className="input" placeholder="e.g. Kandang A" value={form.name} onChange={change} required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">{t('herd.table.type')}</label>
          <select name="type" className="select" value={form.type} onChange={change}>
            <option value="shed">Shed</option>
            <option value="paddock">Paddock</option>
            <option value="quarantine">Quarantine</option>
            <option value="storage">Storage</option>
            <option value="office">Office</option>
            <option value="milking_parlor">Milking Parlor</option>
          </select>
        </div>
        <div>
          <label className="label">{t('herd.table.capacity')}</label>
          <input name="capacity" type="number" min="0" className="input" value={form.capacity} onChange={change} />
        </div>
        <div>
          <label className="label">Area (m²)</label>
          <input name="area_sqm" type="number" min="0" className="input" value={form.area_sqm} onChange={change} />
        </div>
      </div>
      <div>
        <label className="label">{t('herd.form.notes')}</label>
        <textarea name="notes" className="input h-20 resize-none" placeholder={t('herd.form.notes.placeholder')} value={form.notes} onChange={change} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onDone} disabled={submitting}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
          {t('common.save')}
        </button>
      </div>
    </form>
  );
}
