import { useState, useEffect, useCallback } from 'react';
import { Plus, Shield, User as UserIcon, UserCheck, Loader, Pencil, Trash2 } from 'lucide-react';
import { getUsers, createUser, updateUser, deactivateUser, activateUser, deleteUser } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { useTranslation } from '../../contexts/LanguageContext';
import type { User } from '../../types';

const roleConfig = {
  owner: { labelKey: 'user.role.owner', color: 'bg-earth-100 text-earth-700', icon: Shield },
  manager: { labelKey: 'user.role.manager', color: 'bg-primary-100 text-primary-700', icon: UserCheck },
  worker: { labelKey: 'user.role.worker', color: 'bg-neutral-100 text-neutral-600',   icon: UserIcon },
};

export function UsersPage() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getUsers()
      .then(data => setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreated = () => { setShowModal(false); setEditingUser(null); load(); };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('user.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('user.count').replace('{count}', String(users.filter(u => u.is_active).length))}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          {t('user.add')}
        </button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(roleConfig).map(([role, cfg]) => {
          const count = users.filter(u => u.role === role).length;
          const Icon = cfg.icon;
          return (
            <div key={role} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500 font-medium">{t(cfg.labelKey)}</p>
                  <p className="text-3xl font-bold text-neutral-800 mt-1">{count}</p>
                </div>
                <div className={`p-3 rounded-xl ${cfg.color.split(' ')[0].replace('text', 'bg').replace('700', '100').replace('600', '100')}`}>
                  <Icon size={22} className={cfg.color.split(' ')[1]} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Users table */}
      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : (
      <div className="card">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="section-header">{t('user.list.title')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('user.table.name')}</th>
                <th>{t('user.table.email')}</th>
                <th>{t('user.table.role')}</th>
                <th>{t('user.table.phone')}</th>
                <th>{t('user.table.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const cfg = roleConfig[u.role];
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                          {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-neutral-800">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="text-neutral-500">{u.email}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                        {t(cfg.labelKey)}
                      </span>
                    </td>
                    <td className="text-neutral-500">{u.phone || '-'}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {u.is_active ? t('user.status.active') : t('user.status.inactive')}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          onClick={() => setEditingUser(u)}
                          title={t('common.edit')}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="text-xs text-error-500 hover:text-error-600 font-medium"
                          onClick={() => setDeletingUser(u)}
                          title={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                        {u.is_active ? (
                          <button
                            className="text-xs text-warning-600 hover:text-warning-700 font-medium"
                            onClick={async () => { await deactivateUser(u.id); load(); }}
                          >
                            {t('user.action.deactivate')}
                          </button>
                        ) : (
                          <button
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            onClick={async () => { await activateUser(u.id); load(); }}
                          >
                            {t('user.action.activate')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>)}

      {/* Role permissions info */}
      <div className="card p-5">
        <h2 className="section-header mb-4">{t('user.roles.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { roleKey: 'user.role.owner', permKeys: ['user.perm.owner.0', 'user.perm.owner.1', 'user.perm.owner.2', 'user.perm.owner.3', 'user.perm.owner.4'], color: 'border-earth-200 bg-earth-50' },
            { roleKey: 'user.role.manager', permKeys: ['user.perm.manager.0', 'user.perm.manager.1', 'user.perm.manager.2', 'user.perm.manager.3', 'user.perm.manager.4'], color: 'border-primary-200 bg-primary-50' },
            { roleKey: 'user.role.worker', permKeys: ['user.perm.worker.0', 'user.perm.worker.1', 'user.perm.worker.2', 'user.perm.worker.3', 'user.perm.worker.4'], color: 'border-neutral-200 bg-neutral-50' },
          ].map(r => (
            <div key={r.roleKey} className={`border rounded-xl p-4 ${r.color}`}>
              <p className="font-semibold text-neutral-800 mb-3">{t(r.roleKey)}</p>
              <ul className="space-y-1.5">
                {r.permKeys.map(pk => (
                  <li key={pk} className="flex items-center gap-2 text-xs text-neutral-600">
                    <span className="w-1 h-1 rounded-full bg-neutral-400 flex-shrink-0" />
                    {t(pk)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('user.form.title')} size="md">
        <UserForm t={t} onCreated={handleCreated} onClose={() => setShowModal(false)} />
      </Modal>

      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title={t('user.form.edit')} size="md">
        {editingUser && (
          <UserForm t={t} user={editingUser} onCreated={handleCreated} onClose={() => setEditingUser(null)} />
        )}
      </Modal>

      <Modal open={!!deletingUser} onClose={() => { setDeletingUser(null); setDeleteError(''); }} title={t('common.delete')} size="sm">
        {deletingUser && (
          <div className="space-y-4">
            <p className="text-neutral-600 text-sm">{t('user.delete.confirm').replace('{name}', deletingUser.full_name)}</p>
            {deleteError && <div className="text-sm text-error-600 bg-error-50 p-3 rounded-lg">{deleteError}</div>}
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => { setDeletingUser(null); setDeleteError(''); }}>{t('common.cancel')}</button>
              <button className="btn-danger" onClick={async () => {
                try {
                  setDeleteError('');
                  await deleteUser(deletingUser.id);
                  setDeletingUser(null);
                  load();
                } catch (err: any) {
                  setDeleteError(err?.message || t('common.error'));
                }
              }}>{t('common.delete')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function UserForm({ t, user, onCreated, onClose }: { t: (key: string) => string; user?: User; onCreated: () => void; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '', role: user?.role || 'worker', password: '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (user) {
        await updateUser(user.id, {
          full_name: form.full_name,
          role: form.role as User['role'],
          phone: form.phone || undefined,
        });
      } else {
        await createUser({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role as User['role'],
          phone: form.phone || undefined,
        });
      }
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="text-sm text-error-600 bg-error-50 p-3 rounded-lg">{error}</div>}
      <div className="form-grid-2">
        <div className="col-span-2">
          <label className="label">{t('user.form.fullname')} <span className="text-error-500">*</span></label>
          <input name="full_name" className="input" placeholder={t('user.form.fullname.placeholder')} value={form.full_name} onChange={change} required />
        </div>
        {!user && (
          <div>
            <label className="label">{t('user.form.email')} <span className="text-error-500">*</span></label>
            <input name="email" type="email" className="input" placeholder={t('user.form.email.placeholder')} value={form.email} onChange={change} required />
          </div>
        )}
        <div>
          <label className="label">{t('user.form.phone')}</label>
          <input name="phone" className="input" placeholder={t('user.form.phone.placeholder')} value={form.phone} onChange={change} />
        </div>
        <div>
          <label className="label">{t('user.form.role')}</label>
          <select name="role" className="select" value={form.role} onChange={change}>
            <option value="worker">{t('user.form.role.worker')}</option>
            <option value="manager">{t('user.form.role.manager')}</option>
            <option value="owner">{t('user.form.role.owner')}</option>
          </select>
        </div>
        {!user && (
          <div>
            <label className="label">{t('user.form.password')} <span className="text-error-500">*</span></label>
            <input name="password" type="password" className="input" placeholder={t('user.form.password.placeholder')} value={form.password} onChange={change} required />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
          {user ? t('common.save') : t('user.add')}
        </button>
      </div>
    </form>
  );
}
