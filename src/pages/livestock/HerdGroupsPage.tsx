import { useState, useEffect } from 'react';
import { Plus, Users, MapPin, MapPinned, Loader, UserPlus, UserX } from 'lucide-react';
import { getHerdGroups, getAnimals, getLocations, createHerdGroup, getHerdGroupMembers } from '../../lib/api';
import { createLocation } from '../../lib/api';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

export function HerdGroupsPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [herdGroups, setHerdGroups] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [membersGroup, setMembersGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [groupMemberMap, setGroupMemberMap] = useState<Record<string, any[]>>({});

  const loadData = () => {
    getHerdGroups(user?.id).then(setHerdGroups);
    getAnimals(user?.id).then(setAnimals);
    getLocations(user?.id).then(setLocations);
    if (user?.id) {
      getHerdGroups(user?.id).then(async (groups) => {
        const map: Record<string, any[]> = {};
        for (const g of groups) {
          const { data } = await supabaseAdmin.from('herd_group_members')
            .select('*, animals(tag_id, species, breed, gender, status)')
            .eq('herd_group_id', g.id);
          map[g.id] = (data || []).map((m: any) => m.animals).filter(Boolean);
        }
        setGroupMemberMap(map);
      });
    }
  };

  useEffect(() => { loadData(); }, [user?.id]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('herd.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('herd.count').replace('{count}', String(herdGroups.length))}</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            {t('herd.create')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
        {herdGroups.map((group: any) => {
          const groupAnimals = groupMemberMap[group.id] || [];
          const healthyCount = groupAnimals.filter((a: any) => a.status === 'healthy').length;
          const sickCount = groupAnimals.filter((a: any) => a.status === 'sick').length;
          const pregnantCount = groupAnimals.filter((a: any) => a.status === 'pregnant').length;
          return (
            <div key={group.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-neutral-800">{group.name}</h3>
                  {(group.locations?.name) && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
                      <MapPin size={12} />
                      <span>{group.locations.name}</span>
                    </div>
                  )}
                </div>
                <div className="bg-primary-50 p-2.5 rounded-xl">
                  <Users size={18} className="text-primary-600" />
                </div>
              </div>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-4xl font-bold text-neutral-800">{group.member_count}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t('herd.members')}</p>
                </div>
                {group.supervisor_name && (
                  <div className="text-right">
                    <p className="text-xs text-neutral-400">{t('herd.supervisor')}</p>
                    <p className="text-sm font-medium text-neutral-700">{group.supervisor_name}</p>
                  </div>
                )}
              </div>

              {group.notes && (
                <p className="text-xs text-neutral-400 mb-4 italic">{group.notes}</p>
              )}

              <div className="border-t border-neutral-100 pt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm font-semibold text-primary-600">{healthyCount}</p>
                  <p className="text-xs text-neutral-400">{t('status.healthy')}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-error-600">{sickCount}</p>
                  <p className="text-xs text-neutral-400">{t('status.sick')}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-earth-600">{pregnantCount}</p>
                  <p className="text-xs text-neutral-400">{t('status.pregnant')}</p>
                </div>
              </div>
              <button className="btn-ghost btn-sm text-primary-600 w-full mt-3 text-xs font-medium" onClick={() => {
                getHerdGroupMembers(user?.id, group.id).then(setMembers).catch(() => {});
                setMembersGroup(group);
              }}>Kelola Anggota ({group.member_count})</button>
            </div>
          );
        })}
      </div>

      {/* Locations overview */}
      <div className="card">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="section-header">{t('herd.capacity.title')}</h2>
          {hasRole(['owner', 'manager']) && (
            <button className="btn-secondary text-sm" onClick={() => setShowLocationModal(true)}>
              <MapPinned size={16} />
              {t('herd.location.add')}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('herd.table.location')}</th>
                <th>{t('herd.table.type')}</th>
                <th>{t('herd.table.capacity')}</th>
                <th>{t('herd.table.occupied')}</th>
                <th>{t('herd.table.available')}</th>
                <th>{t('herd.table.utilization')}</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc: any) => {
                const pct = loc.capacity > 0 ? Math.round((loc.current_occupancy / loc.capacity) * 100) : 0;
                return (
                  <tr key={loc.id}>
                    <td className="font-medium text-neutral-800">{loc.name}</td>
                    <td>
                      <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full capitalize">
                        {loc.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{loc.capacity > 0 ? t('herd.table.capacity.unit').replace('{count}', String(loc.capacity)) : '-'}</td>
                    <td>{loc.current_occupancy > 0 ? t('herd.table.capacity.unit').replace('{count}', String(loc.current_occupancy)) : '-'}</td>
                    <td className={loc.capacity > 0 ? (loc.capacity - loc.current_occupancy < 5 ? 'text-warning-600 font-medium' : 'text-primary-600 font-medium') : 'text-neutral-400'}>
                      {loc.capacity > 0 ? t('herd.table.capacity.unit').replace('{count}', String(loc.capacity - loc.current_occupancy)) : '-'}
                    </td>
                    <td>
                      {loc.capacity > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden w-20">
                            <div
                              className={`h-full rounded-full ${pct >= 90 ? 'bg-error-500' : pct >= 70 ? 'bg-warning-500' : 'bg-primary-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-neutral-600 w-8">{pct}%</span>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('herd.form.title')} size="md">
        <HerdGroupForm user={user} locations={locations} onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>

      <Modal open={showLocationModal} onClose={() => setShowLocationModal(false)} title={t('herd.location.add')} size="md">
        <LocationForm user={user} onClose={() => { setShowLocationModal(false); loadData(); }} />
      </Modal>

      <Modal open={!!membersGroup} onClose={() => setMembersGroup(null)} title={`Anggota: ${membersGroup?.name}`} size="lg">
        {membersGroup && (
          <MembersManager user={user} group={membersGroup} members={members} animals={animals} onClose={() => {
            setMembersGroup(null);
            loadData();
          }} />
        )}
      </Modal>
    </div>
  );
}

function MembersManager({ user, group, members, animals, onClose }: { user: any; group: any; members: any[]; animals: any[]; onClose: () => void }) {
  const { t } = useTranslation();
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [adding, setAdding] = useState(false);
  const unassigned = animals.filter((a: any) => !members.some((m: any) => m.animal_id === a.id));

  const addMember = async () => {
    if (!selectedAnimalId) return;
    setAdding(true);
    try {
      await supabaseAdmin.from('herd_group_members').insert({
        herd_group_id: group.id,
        animal_id: selectedAnimalId,
        joined_date: new Date().toISOString().split('T')[0],
        user_id: user?.id,
      });
      const { data: cnt } = await supabaseAdmin.from('herd_group_members').select('id', { count: 'exact', head: true }).eq('herd_group_id', group.id);
      await supabaseAdmin.from('herd_groups').update({ member_count: cnt?.count || 0 }).eq('id', group.id);
      setSelectedAnimalId('');
      // Reload
      getHerdGroupMembers(user?.id, group.id).then(setMembers).catch(() => {});
    } catch { alert('Gagal menambah anggota'); }
    finally { setAdding(false); }
  };

  const removeMember = async (animalId: string) => {
    try {
      await supabaseAdmin.from('herd_group_members').delete().eq('herd_group_id', group.id).eq('animal_id', animalId);
      const { data: cnt } = await supabaseAdmin.from('herd_group_members').select('id', { count: 'exact', head: true }).eq('herd_group_id', group.id);
      await supabaseAdmin.from('herd_groups').update({ member_count: cnt?.count || 0 }).eq('id', group.id);
      getHerdGroupMembers(user?.id, group.id).then(setMembers).catch(() => {});
    } catch { alert('Gagal menghapus anggota'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select className="select flex-1" value={selectedAnimalId} onChange={e => setSelectedAnimalId(e.target.value)}>
          <option value="">Pilih ternak untuk ditambahkan...</option>
          {unassigned.map((a: any) => (
            <option key={a.id} value={a.id}>{a.tag_id} - {a.breed} ({a.species})</option>
          ))}
        </select>
        <button className="btn-primary btn-sm" onClick={addMember} disabled={!selectedAnimalId || adding}>
          <UserPlus size={14} /> Tambah
        </button>
      </div>

      <div className="divide-y divide-neutral-50 max-h-80 overflow-y-auto">
        {members.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8">Belum ada anggota</p>
        ) : members.map((m: any) => (
          <div key={m.id} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
                {m.animals?.tag_id?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">{m.animals?.tag_id || '-'}</p>
                <p className="text-xs text-neutral-400">{m.animals?.species} · {m.animals?.breed} · {m.animals?.status}</p>
              </div>
            </div>
            <button className="btn-ghost text-error-500 p-1" onClick={() => removeMember(m.animal_id)} title="Hapus">
              <UserX size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationForm({ user, onClose }: { user: any; onClose: () => void }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', type: 'shed', capacity: 0, area_sqm: 0, notes: '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { alert('Nama lokasi harus diisi'); return; }
    setError('');
    setSubmitting(true);
    try {
      await createLocation(user?.id, {
        name: form.name,
        type: form.type,
        capacity: Number(form.capacity) || 0,
        area_sqm: Number(form.area_sqm) || undefined,
        notes: form.notes || undefined,
        current_occupancy: 0,
        is_active: true,
      } as any);
      onClose();
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
      <div className="form-grid-2">
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
        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
          {t('common.save')}
        </button>
      </div>
    </form>
  );
}

function HerdGroupForm({ user, locations, onClose }: { user: any; locations: any[]; onClose: () => void }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', location_id: '', supervisor_name: '', notes: '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { alert('Nama kelompok harus diisi'); return; }
    setError('');
    setSubmitting(true);
    try {
      await createHerdGroup(user?.id, {
        name: form.name,
        location_id: form.location_id || undefined,
        supervisor_name: form.supervisor_name || undefined,
        notes: form.notes || undefined,
        member_count: 0,
      } as any);
      onClose();
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
        <input name="name" className="input" placeholder="e.g. Kandang D - Sapi Perah Muda" value={form.name} onChange={change} required />
      </div>
      <div className="form-grid-2">
        <div>
          <label className="label">{t('herd.form.location')}</label>
          <select name="location_id" className="select" value={form.location_id} onChange={change}>
            <option value="">{t('herd.form.location.placeholder')}</option>
            {locations.filter((l: any) => l.type !== 'storage' && l.type !== 'office').map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('herd.form.supervisor')}</label>
          <input name="supervisor_name" className="input" placeholder={t('herd.form.supervisor.placeholder')} value={form.supervisor_name} onChange={change} />
        </div>
      </div>
      <div>
        <label className="label">{t('herd.form.notes')}</label>
        <textarea name="notes" className="input h-20 resize-none" placeholder={t('herd.form.notes.placeholder')} value={form.notes} onChange={change} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
          {t('common.save')}
        </button>
      </div>
    </form>
  );
}
