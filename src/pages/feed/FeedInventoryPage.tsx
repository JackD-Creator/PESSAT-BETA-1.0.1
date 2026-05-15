import { useState, useEffect } from 'react';
import { AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import { getFeedInventory, getMedicineInventory, getFeeds, getMedicines, createMedicinePurchase } from '../../lib/api';
import { createFeedPurchase, createFeedConsumption } from '../../lib/api/feed';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function FeedInventoryPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    Promise.all([
      getFeedInventory(user?.id),
      getMedicineInventory(user?.id),
    ])
      .then(([feedData, medData]) => {
        setFeeds(feedData as any[]);
        setMedicines(medData as any[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const lowStockFeeds = feeds.filter((f: any) => f.quantity_on_hand < f.min_threshold);
  const lowStockMeds = medicines.filter((m: any) => m.quantity_on_hand < m.min_threshold);

  const totalFeedValue = feeds.reduce((s: number, f: any) => s + Number(f.total_cost), 0);
  const totalMedValue = medicines.reduce((s: number, m: any) => s + Number(m.total_cost), 0);

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
                {f.feeds?.name || '-'}: {f.quantity_on_hand}/{f.min_threshold} {f.unit || 'kg'}
              </span>
            ))}
            {lowStockMeds.map(m => (
              <span key={m.id} className="text-xs bg-error-100 text-error-700 px-3 py-1 rounded-full font-medium">
                {m.medicines?.name || '-'}: {m.quantity_on_hand}/{m.min_threshold} {m.unit || 'pcs'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">{t('feed.total.feed')}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{feeds.length}</p>
          <p className="text-xs text-neutral-400">{t('feed.types.feed')}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">{t('feed.total.feed.value')}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(totalFeedValue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">{t('feed.total.medicine')}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{medicines.length}</p>
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
          {t('feed.tab.feed')} ({feeds.length})
        </button>
        <button className={activeTab === 'medicine' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('medicine')}>
          {t('feed.tab.medicine')} ({medicines.length})
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : (
      <>
      {activeTab === 'feed' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {feeds.map((feed: any) => {
            const isLow = feed.quantity_on_hand < feed.min_threshold;
            const pct = Math.min(100, (feed.quantity_on_hand / Math.max(feed.min_threshold * 3, feed.quantity_on_hand)) * 100);
            return (
              <div key={feed.id} className={`card p-5 ${isLow ? 'border-error-200' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-neutral-800">{feed.feeds?.name || '-'}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{feed.feeds?.category || '-'}</p>
                  </div>
                  {isLow && (
                    <span className="badge badge-red flex-shrink-0">{t('feed.badge.low')}</span>
                  )}
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={`text-3xl font-bold ${isLow ? 'text-error-600' : 'text-neutral-800'}`}>
                    {Number(feed.quantity_on_hand).toLocaleString()}
                  </span>
                  <span className="text-sm text-neutral-500">{feed.unit || 'kg'}</span>
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
                    <span className="font-medium">{feed.min_threshold} {feed.unit || 'kg'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('feed.card.avgcost')}</span>
                    <span className="font-medium">Rp {Number(feed.avg_cost_per_unit).toLocaleString()}/{feed.unit || 'kg'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('feed.card.stockvalue')}</span>
                    <span className="font-medium text-neutral-700">{formatCurrency(Number(feed.total_cost))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('feed.card.estremaining')}</span>
                    <span className={'font-medium text-primary-600'}>
                      {t('feed.days.remaining').replace('{days}', 'N/A')}
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
          {medicines.map((med: any) => {
            const isLow = med.quantity_on_hand < med.min_threshold;
            const pct = Math.min(100, (med.quantity_on_hand / Math.max(med.min_threshold * 3, med.quantity_on_hand)) * 100);
            return (
              <div key={med.id} className={`card p-5 ${isLow ? 'border-error-200' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-neutral-800">{med.medicines?.name || '-'}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{med.medicines?.type || '-'}</p>
                  </div>
                  {isLow && <span className="badge badge-red flex-shrink-0">{t('feed.badge.low')}</span>}
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={`text-3xl font-bold ${isLow ? 'text-error-600' : 'text-neutral-800'}`}>
                    {Number(med.quantity_on_hand)}
                  </span>
                  <span className="text-sm text-neutral-500">{med.unit || 'pcs'}</span>
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
                    <span className="font-medium">{med.min_threshold} {med.unit || 'pcs'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('feed.label.stockvalue')}</span>
                    <span className="font-medium text-neutral-700">{formatCurrency(Number(med.total_cost))}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>)}

      <Modal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title={t('feed.purchase.title')} size="md">
        <PurchaseForm type={activeTab} t={t} onClose={() => { setShowPurchaseModal(false); loadData(); }} />
      </Modal>

      <Modal open={showConsumeModal} onClose={() => setShowConsumeModal(false)} title={t('feed.usage.title')} size="md">
        <ConsumeForm t={t} onClose={() => { setShowConsumeModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}

function PurchaseForm({ type, t, onClose }: { type: string; t: (key: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const [feedList, setFeedList] = useState<any[]>([]);
  const [medList, setMedList] = useState<any[]>([]);
  const [form, setForm] = useState({
    item_id: '', supplier: '', quantity: '', price_per_unit: '',
    purchase_date: '2026-05-14', invoice_number: '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    Promise.all([getFeeds(user?.id), getMedicines(user?.id)])
      .then(([f, m]) => { setFeedList(f as any[]); setMedList(m as any[]); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const ppu = Number(form.price_per_unit);
    if (!form.item_id || !qty || !ppu) { alert('Lengkapi data pembelian'); return; }
    try {
      if (type === 'feed') {
        await createFeedPurchase(user?.id, {
          feed_id: form.item_id,
          purchase_date: form.purchase_date,
          quantity: qty,
          price_per_unit: ppu,
          total_amount: qty * ppu,
          supplier: form.supplier || undefined,
          invoice_number: form.invoice_number || undefined,
          recorded_by: (user as any)?.full_name || undefined,
        });
      } else {
        await createMedicinePurchase(user?.id, {
          medicine_id: form.item_id,
          purchase_date: form.purchase_date,
          quantity: qty,
          price_per_unit: ppu,
          total_amount: qty * ppu,
          supplier: form.supplier || undefined,
          batch_number: form.invoice_number || undefined,
          recorded_by: (user as any)?.full_name || undefined,
        });
      }
      onClose();
    } catch { alert('Gagal menyimpan pembelian'); }
  };

  const items = type === 'feed' ? feedList : medList;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">{t('feed.form.type')}</label>
          <select name="item_id" className="select" value={form.item_id} onChange={change}>
            <option value="">{t('feed.form.select')}</option>
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('feed.form.supplier')}</label>
          <input name="supplier" className="input" placeholder={t('feed.form.supplier.placeholder')} value={form.supplier} onChange={change} />
        </div>
        <div>
          <label className="label">{t('feed.form.amount')}</label>
          <input name="quantity" type="number" className="input" placeholder={t('feed.form.amount.placeholder')} value={form.quantity} onChange={change} required />
        </div>
        <div>
          <label className="label">{t('feed.form.unitprice')}</label>
          <input name="price_per_unit" type="number" className="input" placeholder={t('feed.form.unitprice.placeholder')} value={form.price_per_unit} onChange={change} required />
        </div>
        <div>
          <label className="label">{t('feed.form.date')}</label>
          <input name="purchase_date" type="date" className="input" value={form.purchase_date} onChange={change} />
        </div>
        <div>
          <label className="label">{t('feed.form.invoice')}</label>
          <input name="invoice_number" className="input" placeholder={t('feed.form.invoice.placeholder')} value={form.invoice_number} onChange={change} />
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
  const { user } = useAuth();
  const [feedList, setFeedList] = useState<any[]>([]);
  const [form, setForm] = useState({
    feed_id: '', quantity: '', consumption_date: '2026-05-14',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => { getFeeds(user?.id).then(setFeedList as any).catch(() => {}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    if (!form.feed_id || !qty) { alert('Lengkapi data pemakaian'); return; }
    try {
      await createFeedConsumption(user?.id, {
        feed_id: form.feed_id,
        consumption_date: form.consumption_date,
        quantity: qty,
        cost_per_unit: 0,
        total_cost: 0,
        recorded_by: (user as any)?.full_name || undefined,
      });
      onClose();
    } catch { alert('Gagal menyimpan pemakaian'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">{t('feed.tab.feed')}</label>
          <select name="feed_id" className="select" value={form.feed_id} onChange={change}>
            <option value="">Pilih pakan...</option>
            {feedList.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('feed.usage.form.amount')}</label>
          <input name="quantity" type="number" className="input" placeholder={t('feed.usage.form.amount.placeholder')} value={form.quantity} onChange={change} required />
        </div>
        <div>
          <label className="label">{t('feed.usage.form.date')}</label>
          <input name="consumption_date" type="date" className="input" value={form.consumption_date} onChange={change} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary">{t('common.save')}</button>
      </div>
    </form>
  );
}
