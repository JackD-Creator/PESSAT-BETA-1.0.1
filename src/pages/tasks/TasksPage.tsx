import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { getTasks } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { PriorityBadge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

const statusConfig = {
  pending: { labelKey: 'task.status.pending', icon: Clock, color: 'text-neutral-500', bg: 'bg-neutral-100' },
  in_progress: { labelKey: 'task.status.in_progress', icon: AlertCircle, color: 'text-warning-600', bg: 'bg-warning-100' },
  completed: { labelKey: 'task.status.completed', icon: CheckCircle, color: 'text-primary-600', bg: 'bg-primary-100' },
  cancelled: { labelKey: 'task.status.cancelled', icon: XCircle, color: 'text-neutral-400', bg: 'bg-neutral-50' },
};

export function TasksPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const today = '2026-05-14';

  useEffect(() => {
    getTasks()
      .then(data => setTasks(data as any[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter(task => {
    const matchStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchStatus && matchPriority;
  });

  const counts = {
    pending: tasks.filter(task => task.status === 'pending').length,
    in_progress: tasks.filter(task => task.status === 'in_progress').length,
    completed: tasks.filter(task => task.status === 'completed').length,
    overdue: tasks.filter(task => task.due_date && task.due_date < today && task.status !== 'completed' && task.status !== 'cancelled').length,
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('task.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('task.count').replace('{count}', String(counts.pending + counts.in_progress))}</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            {t('task.create')}
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { labelKey: 'task.summary.pending', count: counts.pending, color: 'text-neutral-700', bg: 'bg-neutral-50', border: 'border-l-neutral-400' },
          { labelKey: 'task.summary.inprogress', count: counts.in_progress, color: 'text-warning-700', bg: 'bg-warning-50', border: 'border-l-warning-500' },
          { labelKey: 'task.summary.completed', count: counts.completed, color: 'text-primary-700', bg: 'bg-primary-50', border: 'border-l-primary-500' },
          { labelKey: 'task.summary.overdue', count: counts.overdue, color: 'text-error-700', bg: 'bg-error-50', border: 'border-l-error-500' },
        ].map(s => (
          <div key={s.labelKey} className={`card p-4 border-l-4 ${s.border}`}>
            <p className="text-xs text-neutral-500 font-medium">{t(s.labelKey)}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : (
      <div className="card">
        {/* Filters */}
        <div className="p-4 border-b border-neutral-100 flex flex-wrap gap-3 items-center">
          <div className="tab-bar">
            {[
              { val: 'all', labelKey: 'task.filter.all' },
              { val: 'pending', labelKey: 'task.filter.pending' },
              { val: 'in_progress', labelKey: 'task.filter.inprogress' },
              { val: 'completed', labelKey: 'task.filter.completed' },
            ].map(opt => (
              <button
                key={opt.val}
                className={statusFilter === opt.val ? 'tab-active' : 'tab-inactive'}
                onClick={() => setStatusFilter(opt.val)}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
          <select className="select w-36 ml-auto" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="all">{t('task.filter.allpriority')}</option>
            <option value="urgent">{t('task.filter.urgent')}</option>
            <option value="high">{t('task.filter.high')}</option>
            <option value="medium">{t('task.filter.medium')}</option>
            <option value="low">{t('task.filter.low')}</option>
          </select>
        </div>

        {/* Task list */}
        <div className="divide-y divide-neutral-50">
          {filtered.map(task => {
            const isOverdue = task.due_date && task.due_date < today && task.status !== 'completed' && task.status !== 'cancelled';
            const cfg = statusConfig[task.status];
            const Icon = cfg.icon;
            return (
              <div key={task.id} className={`p-4 flex items-start gap-4 hover:bg-neutral-50/50 transition-colors ${isOverdue ? 'bg-error-50/30' : ''}`}>
                <div className={`p-2 rounded-lg ${cfg.bg} flex-shrink-0`}>
                  <Icon size={16} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${task.status === 'completed' ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                      {task.title}
                    </span>
                    <PriorityBadge priority={task.priority} />
                    {isOverdue && (
                      <span className="text-xs bg-error-100 text-error-700 px-2 py-0.5 rounded-full font-medium">{t('task.overdue')}</span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-neutral-500 mt-0.5">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-400">
                    <span>{t('task.assigned.to')} <span className="font-medium text-neutral-600">{task.assigned?.full_name || '-'}</span></span>
                    {task.due_date && (
                      <span className={isOverdue ? 'text-error-500 font-medium' : ''}>
                        {t('task.due.date')} {new Date(task.due_date).toLocaleDateString('id-ID')}
                      </span>
                    )}
                    {(task.animals?.tag_id) && (
                      <span className="bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded font-medium">
                        {task.animals.tag_id}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                  {t(cfg.labelKey)}
                </span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <CheckCircle size={40} className="text-neutral-200 mx-auto mb-3" />
              <p className="text-neutral-400 font-medium">{t('task.empty')}</p>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-neutral-100 text-sm text-neutral-400">{t('task.count.label').replace('{count}', String(filtered.length))}</div>
      </div>)}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('task.form.title')} size="md">
        <TaskForm t={t} onClose={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}

function TaskForm({ t, onClose }: { t: (key: string) => string; onClose: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); alert('Tugas tersimpan (demo)'); onClose(); }} className="space-y-4">
      <div>
        <label className="label">{t('task.form.title.label')} <span className="text-error-500">*</span></label>
        <input className="input" placeholder={t('task.form.title.placeholder')} required />
      </div>
      <div className="form-grid-2">
        <div>
          <label className="label">{t('task.form.assignee')}</label>
          <select className="select">
            {[<option key="1">Budi Santoso</option>, <option key="2">Dewi Lestari</option>, <option key="3">Andi Firmansyah</option>, <option key="4">Siti Rahmawati</option>]}
          </select>
        </div>
        <div>
          <label className="label">{t('task.form.priority')}</label>
          <select className="select">
            <option value="low">{t('task.form.priority.low')}</option>
            <option value="medium">{t('task.form.priority.medium')}</option>
            <option value="high">{t('task.form.priority.high')}</option>
            <option value="urgent">{t('task.form.priority.urgent')}</option>
          </select>
        </div>
        <div>
          <label className="label">{t('task.form.duedate')}</label>
          <input type="date" className="input" defaultValue="2026-05-14" />
        </div>
        <div>
          <label className="label">{t('task.form.animal')}</label>
          <input className="input" placeholder={t('task.form.animal.placeholder')} />
        </div>
      </div>
      <div>
        <label className="label">{t('task.form.description')}</label>
        <textarea className="input h-20 resize-none" placeholder={t('task.form.description.placeholder')} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary">{t('common.save')}</button>
      </div>
    </form>
  );
}
