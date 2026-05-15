import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { getAlerts, resolveAlert } from '../../lib/api';
import { SeverityBadge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

const typeLabels: Record<string, string> = {
  vaccination_due: 'alert.type.vaccination',
  low_stock_feed: 'alert.type.feed.stock',
  low_stock_medicine: 'alert.type.medicine.stock',
  health_issue: 'alert.type.health',
  breeding_due: 'alert.type.reproduction',
  task_overdue: 'alert.type.task.overdue',
  weight_loss: 'alert.type.weight.loss',
};

export function AlertsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    getAlerts(user?.id)
      .then(data => setAlerts(data as any[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const filtered = alerts.filter(a => {
    if (filter === 'unread') return !a.is_read;
    if (filter === 'resolved') return a.is_resolved;
    if (filter === 'active') return !a.is_resolved;
    if (filter === 'critical') return a.severity === 'critical';
    return true;
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length;
  const resolvedCount = alerts.filter(a => a.is_resolved).length;

  const getIcon = (severity: string) => {
    if (severity === 'critical') return <XCircle size={18} className="text-error-600" />;
    if (severity === 'warning') return <AlertTriangle size={18} className="text-warning-600" />;
    return <Info size={18} className="text-info-600" />;
  };

  const getSeverityBg = (severity: string) => {
    if (severity === 'critical') return 'bg-error-50 border-error-100';
    if (severity === 'warning') return 'bg-warning-50 border-warning-100';
    return 'bg-info-50 border-info-100';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('alert.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('alert.unread').replace('{count}', String(unreadCount))}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { labelKey: 'alert.summary.unread', count: unreadCount, color: 'text-neutral-700', border: 'border-l-neutral-400' },
          { labelKey: 'alert.summary.critical', count: criticalCount, color: 'text-error-700', border: 'border-l-error-500' },
          { labelKey: 'alert.summary.active', count: alerts.filter(a => !a.is_resolved).length, color: 'text-warning-700', border: 'border-l-warning-500' },
          { labelKey: 'alert.summary.resolved', count: resolvedCount, color: 'text-primary-700', border: 'border-l-primary-500' },
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
        {/* Filter tabs */}
        <div className="p-4 border-b border-neutral-100">
          <div className="tab-bar">
            {[
              { val: 'all', labelKey: 'alert.filter.all' },
              { val: 'unread', labelKey: 'alert.filter.unread' },
              { val: 'active', labelKey: 'alert.filter.active' },
              { val: 'critical', labelKey: 'alert.filter.critical' },
              { val: 'resolved', labelKey: 'alert.filter.resolved' },
            ].map(opt => (
              <button
                key={opt.val}
                className={filter === opt.val ? 'tab-active' : 'tab-inactive'}
                onClick={() => setFilter(opt.val)}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Alert list */}
        <div className="divide-y divide-neutral-50">
          {filtered.map(alert => (
            <div
              key={alert.id}
              className={`p-4 flex items-start gap-4 transition-colors hover:bg-neutral-50/50 ${!alert.is_read ? 'bg-neutral-50/50' : ''}`}
            >
              <div className={`p-2.5 rounded-xl border flex-shrink-0 ${getSeverityBg(alert.severity)}`}>
                {getIcon(alert.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`font-semibold text-sm ${alert.is_resolved ? 'text-neutral-400' : 'text-neutral-800'}`}>
                    {alert.title}
                  </span>
                  {!alert.is_read && (
                    <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                  )}
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                    {t(typeLabels[alert.type] || alert.type)}
                  </span>
                  {alert.is_resolved && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">{t('status.resolved')}</span>
                  )}
                </div>
                <p className="text-sm text-neutral-500">{alert.message}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                  <span>{new Date(alert.created_at).toLocaleString('id-ID')}</span>
                  {(alert.animals?.tag_id) && (
                    <span className="bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded font-medium">{alert.animals.tag_id}</span>
                  )}
                </div>
              </div>
              {!alert.is_resolved && (
                <button className="btn-sm btn-secondary flex-shrink-0" onClick={async () => {
                  try {
                    await resolveAlert(user?.id, alert.id);
                    loadData();
                  } catch { alert('Gagal mengubah status'); }
                }}>
                  <CheckCircle size={13} />
                  {t('alert.mark.resolved')}
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <Bell size={40} className="text-neutral-200 mx-auto mb-3" />
              <p className="text-neutral-400 font-medium">{t('alert.empty')}</p>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-neutral-100 text-sm text-neutral-400">{t('alert.count').replace('{count}', String(filtered.length))}</div>
      </div>)}
    </div>
  );
}
