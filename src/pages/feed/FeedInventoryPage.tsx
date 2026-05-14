import { useState } from 'react';
import { AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import { mockFeedInventory, mockMedicineInventory } from '../../lib/mockData';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function FeedInventoryPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);

  const lowStockFeeds = mockFeedInventory.filter(f => f.quantity_on_hand < f.min_threshold);
  const lowStockMeds = mockMedicineInventory.filter(m => m.quantity_on_hand < m.min_threshold);

  const totalFeedValue = mockFeedInventory.reduce((s, f) => s + f.total_cost, 0);
  const totalMedValue = mockMedicineInventory.reduce((s, m) => s + m.total_cost, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('feed.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {t('feed.total.value').replace('{value}', formatCurrency(totalFeedValue + totalMedValue))}
          </p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowConsumeModal(true)}>
              <Package size={16} />
              {t('feed.use')}
            </button>
            <button className="btn-primary" onClick={() => setShowPurchaseModal(true)}>
              <ShoppingCart size={16} />
              {t('feed.purchase')}
            </button>
          </div>
        )}
      </div>

      {/* Alert banners */}
      {(lowStockFeeds.length > 0 || lowStockMeds.length > 0) && (
        <div className="bg-error-50 border border-error-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-error-600" />
            <span className="font-semibold text-error-700">{t('feed.low.stock.banner')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockFeeds.map(f => (
              <span key={f.id} className="text-xs bg-error-100 text-error-700 px-3 py-1 rounded-full font-medium">
                {f.feed_name}: {f.quantity_on_hand}/{f.min_threshold} {f.unit}
              </span>
            ))}
            {lowStockMeds.map(m => (
              <span key={m.id} className="text-xs bg-error-100 text-error-700 px-3 py-1 rounded-full font-medium">
                {m.medicine_name}: {m.quantity_on_hand}/{m.min_threshold} {m.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">{t('feed.total.feed')}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{mockFeedInventory.length}</p>
          <p className="text-xs text-neutral-400">{t('feed.types.feed')}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">{t('feed.total.feed.value')}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(totalFeedValue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">{t('feed.total.medicine')}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{mockMedicineInventory.length}</p>
          <p className="text-xs text-neutral-400">{t('feed.types.medicine')}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">{t('feed.total.medicine.value')}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(totalMedValue)}</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="tab-bar w-fit">
        <button className={activeTab === 'feed' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('feed')}>
          {t('feed.tab.feed')} ({mockFeedInventory.length})
        </button>
        <button className={activeTab === 'medicine' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('medicine')}>
          {t('feed.tab.medicine')} ({mockMedicineInventory.length})
        </button>
      </div>

      {activeTab === 'feed' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockFeedInventory.map(feed => {
            const isLow = feed.quantity_on_hand < feed.min_threshold;
            const pct = Math.min(100, (feed.quantity_on_hand / Math.max(feed.min_threshold * 3, feed.quantity_on_hand)) * 100);
            return (
              <div key={feed.id} className={`card p-5 ${isLow ? 'border-error-200' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-neutral-800">{feed.feed_name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{feed.feed_category}</p>
                  </div>
                  {isLow && (
                    <span className="badge badge-red flex-shrink-0">{t('feed.badge.low')}</span>
                  )}
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={`text-3xl font-bold ${isLow ? 'text-error-600' : 'text-neutral-800'}`}>
                    {feed.quantity_on_hand.toLocaleString()}
                  </span>
                  <span className="text-sm text-neutral-500">{feed.unit}</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full ${isLow ? 'bg-error-500' : 'bg-primary-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="space-y-1 text-xs text-neutral-500">
                  <div className="flex justify-between">
                    <span>{t('feed.card.min')}</span>
                    <span className="font-medium">{feed.min_threshold} {feed.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('feed.card.avgcost')}</span>
                    <span className="font-medium">Rp {feed.avg_cost_per_unit.toLocaleString()}/{feed.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('feed.card.stockvalue')}</span>
                    <span className="font-medium text-neutral-700">{formatCurrency(feed.total_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('feed.card.estremaining')}</span>
                    <span className={`font-medium ${feed.days_remaining <= 7 ? 'text-warning-600' : 'text-primary-600'}`}>
                      {t('feed.days.remaining').replace('{days}', String(feed.days_remaining))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'medicine' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockMedicineInventory.map(med => {
            const isLow = med.quantity_on_hand < med.min_threshold;
            const pct = Math.min(100, (med.quantity_on_hand / Math.max(med.min_threshold * 3, med.quantity_on_hand)) * 100);
            return (
              <div key={med.id} className={`card p-5 ${isLow ? 'border-error-200' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-neutral-800">{med.medicine_name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{med.medicine_type}</p>
                  </div>
                  {isLow && <span className="badge badge-red flex-shrink-0">{t('feed.badge.low')}</span>}
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={`text-3xl font-bold ${isLow ? 'text-error-600' : 'text-neutral-800'}`}>
                    {med.quantity_on_hand}
                  </span>
                  <span className="text-sm text-neutral-500">{med.unit}</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full ${isLow ? 'bg-error-500' : 'bg-primary-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="space-y-1 text-xs text-neutral-500">
                  <div className="flex justify-between">
                    <span>{t('feed.label.minimum')}</span>
                    <span className="font-medium">{med.min_threshold} {med.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('feed.label.stockvalue')}</span>
                    <span className="font-medium text-neutral-700">{formatCurrency(med.total_cost)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title={t('feed.purchase.title')} size="md">
        <PurchaseForm type={activeTab} t={t} onClose={() => setShowPurchaseModal(false)} />
      </Modal>

      <Modal open={showConsumeModal} onClose={() => setShowConsumeModal(false)} title={t('feed.usage.title')} size="md">
        <ConsumeForm t={t} onClose={() => setShowConsumeModal(false)} />
      </Modal>
    </div>
  );
}

function PurchaseForm({ type, t, onClose }: { type: string; t: (key: string) => string; onClose: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); alert('Pembelian tersimpan (demo)'); onClose(); }} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">{t('feed.form.type')} {type === 'feed' ? t('feed.tab.feed') : t('feed.tab.medicine')}</label>
          <select className="select">
            <option>{t('feed.form.select')}</option>
            {type === 'feed'
              ? mockFeedInventory.map(f => <option key={f.id}>{f.feed_name}</option>)
              : mockMedicineInventory.map(m => <option key={m.id}>{m.medicine_name}</option>)
            }
          </select>
        </div>
        <div>
          <label className="label">{t('feed.form.supplier')}</label>
          <input className="input" placeholder={t('feed.form.supplier.placeholder')} />
        </div>
        <div>
          <label className="label">{t('feed.form.amount')}</label>
          <input type="number" className="input" placeholder={t('feed.form.amount.placeholder')} />
        </div>
        <div>
          <label className="label">{t('feed.form.unitprice')}</label>
          <input type="number" className="input" placeholder={t('feed.form.unitprice.placeholder')} />
        </div>
        <div>
          <label className="label">{t('feed.form.date')}</label>
          <input type="date" className="input" defaultValue="2026-05-14" />
        </div>
        <div>
          <label className="label">{t('feed.form.invoice')}</label>
          <input className="input" placeholder={t('feed.form.invoice.placeholder')} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary">{t('common.save')}</button>
      </div>
    </form>
  );
}

function ConsumeForm({ t, onClose }: { t: (key: string) => string; onClose: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); alert('Pemakaian tersimpan (demo)'); onClose(); }} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">{t('feed.tab.feed')}</label>
          <select className="select">
            {mockFeedInventory.map(f => <option key={f.id}>{f.feed_name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('feed.usage.form.target')}</label>
          <select className="select">
            <option>Kandang A - Sapi Perah Laktasi</option>
            <option>Paddock 1 - Sapi Potong</option>
            <option>Kandang C - Domba & Kambing</option>
          </select>
        </div>
        <div>
          <label className="label">{t('feed.usage.form.amount')}</label>
          <input type="number" className="input" placeholder={t('feed.usage.form.amount.placeholder')} />
        </div>
        <div>
          <label className="label">{t('feed.usage.form.date')}</label>
          <input type="date" className="input" defaultValue="2026-05-14" />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary">{t('common.save')}</button>
      </div>
    </form>
  );
}
