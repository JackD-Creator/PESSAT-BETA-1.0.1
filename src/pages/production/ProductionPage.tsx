import { useState, useEffect } from 'react';
import { Plus, Milk } from 'lucide-react';
import { getDailyProduction } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function MiniSparkline({ data, color = '#3b82f6' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 120;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-24 h-8" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProductionPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [period, setPeriod] = useState(7);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDailyProduction()
      .then(data => setRecords(data as any[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const recentData = records.slice(0, period).reverse();
  const totalMilk = recentData.reduce((s, d) => s + d.quantity, 0);
  const avgMilk = totalMilk / recentData.length;
  const lastMilk = recentData[recentData.length - 1]?.quantity || 0;
  const prevMilk = recentData[recentData.length - 2]?.quantity || lastMilk;
  const trend = ((lastMilk - prevMilk) / prevMilk * 100).toFixed(1);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('production.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('production.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="tab-bar">
            {[7, 14, 30].map(d => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={period === d ? 'tab-active' : 'tab-inactive'}
              >
                {t('production.period.days').replace('{d}', String(d))}
              </button>
            ))}
          </div>
          {hasRole(['owner', 'manager', 'worker']) && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} />
              {t('production.add')}
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">{t('production.today')}</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{lastMilk} L</p>
              <p className={`text-xs font-medium mt-1 ${Number(trend) >= 0 ? 'text-primary-600' : 'text-error-600'}`}>
                {Number(trend) >= 0 ? '+' : ''}{trend}% {t('production.trend').replace('+/-{trend}%', '').trim()}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <Milk size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs text-neutral-500 font-medium">{t('production.avg').replace('{period}', String(period))}</p>
          <p className="text-3xl font-bold text-neutral-800 mt-1">{avgMilk.toFixed(0)} L/hari</p>
          <MiniSparkline data={recentData.map(d => d.quantity)} />
        </div>
        <div className="card p-5">
          <p className="text-xs text-neutral-500 font-medium">{t('production.total').replace('{period}', String(period))}</p>
          <p className="text-3xl font-bold text-neutral-800 mt-1">{totalMilk} L</p>
          <p className="text-xs text-neutral-400 mt-1">
            {t('production.value').replace('{value}', 'Rp ' + (totalMilk * 20000).toLocaleString('id-ID'))}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : (
      <>
      {/* Production chart */}
      <div className="card p-5">
        <h2 className="section-header mb-4">{t('production.chart')}</h2>
        <div className="flex items-end gap-2 h-40 pb-2">
          {recentData.map((d, i) => {
            const max = Math.max(...recentData.map(x => x.quantity));
            const pct = (d.quantity / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative flex flex-col justify-end w-full" style={{ height: '100px' }}>
                  <div
                    className="w-full bg-blue-400 group-hover:bg-blue-500 rounded-t transition-all duration-200"
                    style={{ height: `${pct}%` }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-neutral-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 py-0.5 rounded shadow-sm">
                    {d.quantity}L
                  </div>
                </div>
                <span className="text-xs text-neutral-400 whitespace-nowrap">
                  {new Date(d.production_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="section-header">{t('production.history.title')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('production.table.date')}</th>
                <th>{t('production.table.target')}</th>
                <th>{t('production.table.product')}</th>
                <th>{t('production.table.amount')}</th>
                <th>{t('production.table.shift')}</th>
                <th>{t('production.table.officer')}</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, period).map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.production_date).toLocaleDateString('id-ID')}</td>
                  <td>{p.herd_groups?.name || p.animals?.tag_id || '-'}</td>
                  <td>
                    <span className="badge badge-blue capitalize">
                      {p.product_type === 'milk' ? t('production.product.milk') : t('production.product.wool')}
                    </span>
                  </td>
                  <td className="font-semibold">{p.quantity} {p.unit}</td>
                  <td className="capitalize text-neutral-500">
                    {{ morning: t('production.shift.morning'), evening: t('production.shift.evening'), all_day: t('production.shift.allday') }[p.shift as string]}
                  </td>
                  <td>{p.recorded_by || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>)}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('production.form.title')} size="md">
        <ProductionForm onClose={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}

function ProductionForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <form onSubmit={(e) => { e.preventDefault(); alert('Produksi tersimpan (demo)'); onClose(); }} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">{t('production.form.target')}</label>
          <select className="select">
            <option>Kandang A - Sapi Perah Laktasi</option>
            <option>Individu - SP-001</option>
          </select>
        </div>
        <div>
          <label className="label">{t('production.form.product')}</label>
          <select className="select">
            <option value="milk">{t('production.form.product.milk')}</option>
            <option value="wool">{t('production.form.product.wool')}</option>
          </select>
        </div>
        <div>
          <label className="label">{t('production.form.amount')}</label>
          <input type="number" step="0.1" className="input" placeholder={t('production.form.amount.placeholder')} />
        </div>
        <div>
          <label className="label">{t('production.form.shift')}</label>
          <select className="select">
            <option value="morning">{t('production.form.shift.morning')}</option>
            <option value="evening">{t('production.form.shift.evening')}</option>
            <option value="all_day">{t('production.form.shift.allday')}</option>
          </select>
        </div>
        <div>
          <label className="label">{t('production.form.date')}</label>
          <input type="date" className="input" defaultValue="2026-05-14" />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary"><Milk size={14} /> {t('common.save')}</button>
      </div>
    </form>
  );
}
