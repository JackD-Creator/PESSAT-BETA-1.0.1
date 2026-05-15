import { useState, useEffect } from 'react';
import { AlertTriangle, Package, ShoppingCart, Trash2 } from 'lucide-react';
import { getFeedInventory, getMedicineInventory, getFeeds, createFeed, deleteFeed } from '../../lib/api';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { FeedPurchaseForm } from './FeedPurchaseForm';
import { FeedConsumeForm } from './FeedConsumeForm';

function formatCurrency(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function formatDate(d: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
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

  const seedFeeds = async () => {
    if (!user?.id) return;
    const existing = await getFeeds(user.id).catch(() => []);
    if (existing.length > 0) return;
    const defaults = [
      { name: 'Hijauan Segar', category: 'forage' as const, unit: 'kg' },
      { name: 'Silase', category: 'forage' as const, unit: 'kg' },
      { name: 'Konsentrat', category: 'concentrate' as const, unit: 'kg' },
      { name: 'Hijauan Kering', category: 'forage' as const, unit: 'kg' },
    ];
    await Promise.all(defaults.map(f => createFeed(user.id, f).catch(() => {})));
    const fresh = await getFeeds(user.id).catch(() => []);
    const invExisting = await getFeedInventory(user.id).catch(() => []);
    const invFeedIds = new Set(invExisting.map((i: any) => i.feed_id));
    await Promise.all(fresh.map((f: any) => {
      if (invFeedIds.has(f.id)) return;
      return supabaseAdmin.from('feed_inventory').insert({
        feed_id: f.id, user_id: user.id, quantity_on_hand: 0, avg_cost_per_unit: 0, total_cost: 0, min_threshold: 50,
      }).then(() => {}, () => {});
    }));
  };

  const loadData = () => {
    Promise.all([
      getFeedInventory(user!.id),
      getMedicineInventory(user!.id),
    ])
      .then(([feedData, medData]) => {
        setFeeds(feedData as any[]);
        setMedicines(medData as any[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    seedFeeds().then(() => loadData());
  }, [user?.id]);

  const handleDeleteFeed = async (feed: any) => {
    if (!window.confirm('Hapus data pakan ini?')) return;
    await deleteFeed(user!.id, feed.feeds?.id).catch(() => {});
    await supabaseAdmin.from('feed_inventory').delete().eq('feed_id', feed.feeds?.id).then(() => {}, () => {});
    loadData();
  };

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
              <Package size={16} /> {t('feed.use')}
            </button>
            <button className="btn-primary" onClick={() => setShowPurchaseModal(true)}>
              <ShoppingCart size={16} /> {t('feed.purchase')}
            </button>
          </div>
        )}
      </div>

      {(lowStockFeeds.length > 0 || lowStockMeds.length > 0) && (
        <div className="bg-error-50 border border-error-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-error-600" />
            <span className="font-semibold text-error-700">{t('feed.low.stock.banner')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockFeeds.map(f => (
              <span key={f.id} className="text-xs bg-error-100 text-error-700 px-3 py-1 rounded-full font-medium">
                {f.feeds?.name || '-'}: {f.quantity_on_hand}/{f.min_threshold} kg
              </span>
            ))}
            {lowStockMeds.map(m => (
              <span key={m.id} className="text-xs bg-error-100 text-error-700 px-3 py-1 rounded-full font-medium">
                {m.medicines?.name || '-'}: {m.quantity_on_hand}/{m.min_threshold} pcs
              </span>
            ))}
          </div>
        </div>
      )}

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
          {feeds.length === 0 && (
            <div className="col-span-full card p-12 text-center">
              <p className="text-neutral-500">Belum ada stok pakan</p>
              <p className="text-sm text-neutral-400 mt-1">Lakukan pembelian pakan untuk memulai</p>
            </div>
          )}
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isLow && <span className="badge badge-red">{t('feed.badge.low')}</span>}
                    {hasRole(['owner', 'manager']) && (
                      <button className="btn-ghost text-neutral-400 hover:text-error-600 p-1" title="Hapus" onClick={() => handleDeleteFeed(feed)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={`text-3xl font-bold ${isLow ? 'text-error-600' : 'text-neutral-800'}`}>
                    {Number(feed.quantity_on_hand).toLocaleString()}
                  </span>
                  <span className="text-sm text-neutral-500">kg</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${isLow ? 'bg-error-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="space-y-1 text-xs text-neutral-500">
                  <div className="flex justify-between">
                    <span>{t('feed.card.min')}</span>
                    <span className="font-medium">{feed.min_threshold} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('feed.card.avgcost')}</span>
                    <span className="font-medium">Rp {Number(feed.avg_cost_per_unit).toLocaleString()}/kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('feed.card.stockvalue')}</span>
                    <span className="font-medium text-neutral-700">{formatCurrency(Number(feed.total_cost))}</span>
                  </div>
                  {(feed.feeds?.crude_protein_pct || feed.feeds?.tdn_pct) && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-50 mt-2">
                      {feed.feeds?.dry_matter_pct != null && <span className="badge badge-gray">BK {feed.feeds.dry_matter_pct}%</span>}
                      {feed.feeds?.crude_protein_pct != null && <span className="badge badge-yellow">PK {feed.feeds.crude_protein_pct}%</span>}
                      {feed.feeds?.tdn_pct != null && <span className="badge badge-blue">TDN {feed.feeds.tdn_pct}%</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'medicine' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.length === 0 && (
            <div className="col-span-full card p-12 text-center">
              <p className="text-neutral-500">Belum ada stok obat</p>
              <p className="text-sm text-neutral-400 mt-1">Lakukan pembelian obat untuk memulai</p>
            </div>
          )}
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
                  <span className="text-sm text-neutral-500">pcs</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${isLow ? 'bg-error-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="space-y-1 text-xs text-neutral-500">
                  <div className="flex justify-between">
                    <span>{t('feed.label.minimum')}</span>
                    <span className="font-medium">{med.min_threshold} pcs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('feed.label.stockvalue')}</span>
                    <span className="font-medium text-neutral-700">{formatCurrency(Number(med.total_cost))}</span>
                  </div>
                  {med.expiry_date && (
                    <div className="flex justify-between">
                      <span>Kadaluarsa</span>
                      <span className="font-medium text-warning-600">{formatDate(med.expiry_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>)}

      <Modal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title={t('feed.purchase.title')} size="md">
        <FeedPurchaseForm type={activeTab} t={t} onClose={() => { setShowPurchaseModal(false); loadData(); }} />
      </Modal>

      <Modal open={showConsumeModal} onClose={() => setShowConsumeModal(false)} title={t('feed.usage.title')} size="md">
        <FeedConsumeForm t={t} onClose={() => { setShowConsumeModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}
