import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, Package, ShoppingCart, ClipboardList, Plus } from 'lucide-react';
import { getFeedInventory, getMedicineInventory, getFeeds, getMedicines, createFeed, getFeedPurchases, getFeedConsumption } from '../../lib/api';
import { createFeedPurchase, createFeedConsumption, getFeedFormulas, getFeedFormulaItems } from '../../lib/api/feed';
import { getMedicinePurchases, createMedicinePurchase, createMedicineUsage } from '../../lib/api/medicine';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function formatDate(d: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function FeedInventoryPage() {
  const location = useLocation();
  const path = location.pathname;
  if (path === '/feed-purchases') return <FeedPurchasesView />;
  if (path === '/feed-formulas') return <FeedFormulasView />;
  if (path === '/medicine-inventory') return <MedicineStockView />;
  return <FeedStockView />;
}

/* ===================== STOCK VIEW (/feed-inventory) ===================== */
function FeedStockView() {
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
      }).catch(() => {});
    }));
  };

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

  useEffect(() => {
    seedFeeds().then(() => loadData());
  }, [user?.id]);

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
                  {isLow && <span className="badge badge-red flex-shrink-0">{t('feed.badge.low')}</span>}
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={`text-3xl font-bold ${isLow ? 'text-error-600' : 'text-neutral-800'}`}>
                    {Number(feed.quantity_on_hand).toLocaleString()}
                  </span>
                  <span className="text-sm text-neutral-500">{feed.unit || 'kg'}</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${isLow ? 'bg-error-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
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
                    <span className="font-medium text-primary-600">
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
                  <span className="text-sm text-neutral-500">{med.unit || 'pcs'}</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${isLow ? 'bg-error-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
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
        <PurchaseForm type={activeTab} t={t} onClose={() => { setShowPurchaseModal(false); loadData(); }} />
      </Modal>

      <Modal open={showConsumeModal} onClose={() => setShowConsumeModal(false)} title={t('feed.usage.title')} size="md">
        <ConsumeForm t={t} onClose={() => { setShowConsumeModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}

/* ===================== PURCHASES VIEW (/feed-purchases) ===================== */
function FeedPurchasesView() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [consumptions, setConsumptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'purchase' | 'usage'>('purchase');

  const loadData = () => {
    if (!user?.id) return;
    Promise.all([
      getFeedPurchases(user.id),
      getFeedConsumption(user.id),
    ])
      .then(([p, c]) => {
        setPurchases(p as any[]);
        setConsumptions(c as any[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const totalPurchases = purchases.reduce((s: number, p: any) => s + Number(p.total_amount), 0);
  const totalUsage = consumptions.reduce((s: number, c: any) => s + Number(c.total_cost), 0);
  const sumQty = (items: any[], key: string) => items.reduce((s: number, i: any) => s + Number(i[key] || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('page.feed.purchases')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Total pembelian: {formatCurrency(totalPurchases)} &middot; Total pemakaian: {formatCurrency(totalUsage)}
          </p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowPurchaseModal(true)}>
            <Plus size={16} /> {t('feed.purchase')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Pembelian</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(totalPurchases)}</p>
          <p className="text-xs text-neutral-400">{purchases.length} transaksi</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Pemakaian</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(totalUsage)}</p>
          <p className="text-xs text-neutral-400">{consumptions.length} transaksi</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Qty Pembelian</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{sumQty(purchases, 'quantity').toLocaleString()}</p>
          <p className="text-xs text-neutral-400">kg</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-neutral-500 font-medium">Total Qty Pemakaian</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{sumQty(consumptions, 'quantity').toLocaleString()}</p>
          <p className="text-xs text-neutral-400">kg</p>
        </div>
      </div>

      <div className="tab-bar w-fit">
        <button className={activeTab === 'purchase' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('purchase')}>
          Pembelian ({purchases.length})
        </button>
        <button className={activeTab === 'usage' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('usage')}>
          Pemakaian ({consumptions.length})
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : activeTab === 'purchase' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-default">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Pakan</th>
                  <th>Jumlah</th>
                  <th>Harga/Unit</th>
                  <th>Total</th>
                  <th>Supplier</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-neutral-400 py-8">{t('common.no.data')}</td></tr>
                ) : purchases.map((p: any) => (
                  <tr key={p.id}>
                    <td className="text-sm">{formatDate(p.purchase_date)}</td>
                    <td className="font-medium">{p.feeds?.name || '-'}</td>
                    <td>{Number(p.quantity).toLocaleString()} {p.unit || 'kg'}</td>
                    <td>Rp {Number(p.price_per_unit).toLocaleString()}</td>
                    <td className="font-medium">{formatCurrency(Number(p.total_amount))}</td>
                    <td className="text-sm">{p.supplier || '-'}</td>
                    <td className="text-sm text-neutral-500">{p.invoice_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-neutral-100 text-sm text-neutral-500">
            Total: {purchases.length} transaksi &middot; {sumQty(purchases, 'quantity').toLocaleString()} kg &middot; {formatCurrency(totalPurchases)}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-default">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Pakan</th>
                  <th>Jumlah</th>
                  <th>Biaya/Unit</th>
                  <th>Total Biaya</th>
                </tr>
              </thead>
              <tbody>
                {consumptions.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-neutral-400 py-8">{t('common.no.data')}</td></tr>
                ) : consumptions.map((c: any) => (
                  <tr key={c.id}>
                    <td className="text-sm">{formatDate(c.consumption_date)}</td>
                    <td className="font-medium">{c.feeds?.name || '-'}</td>
                    <td>{Number(c.quantity).toLocaleString()} {c.unit || 'kg'}</td>
                    <td>Rp {Number(c.cost_per_unit).toLocaleString()}</td>
                    <td className="font-medium">{formatCurrency(Number(c.total_cost))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-neutral-100 text-sm text-neutral-500">
            Total: {consumptions.length} transaksi &middot; {sumQty(consumptions, 'quantity').toLocaleString()} kg &middot; {formatCurrency(totalUsage)}
          </div>
        </div>
      )}

      <Modal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title={t('feed.purchase.title')} size="md">
        <PurchaseForm type="feed" t={t} onClose={() => { setShowPurchaseModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}

/* ===================== FORMULAS VIEW (/feed-formulas) ===================== */
function FeedFormulasView() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [formulas, setFormulas] = useState<any[]>([]);
  const [formulaItems, setFormulaItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = () => {
    if (!user?.id) return;
    getFeedFormulas(user.id)
      .then(async (data) => {
        setFormulas(data as any[]);
        const itemsMap: Record<string, any[]> = {};
        await Promise.all(data.map(async (f: any) => {
          const items = await getFeedFormulaItems(user.id, f.id).catch(() => []);
          itemsMap[f.id] = items as any[];
        }));
        setFormulaItems(itemsMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('page.feed.formulas')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {formulas.length} formula ransum tersedia
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

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : formulas.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList size={48} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">Belum ada formula ransum</p>
          <p className="text-sm text-neutral-400 mt-1">Buat formula ransum untuk membantu perencanaan pakan ternak</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {formulas.map((f: any) => {
            const items = formulaItems[f.id] || [];
            const isExpanded = expandedId === f.id;
            return (
              <div key={f.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-neutral-800 text-lg">{f.name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {f.target_species} &middot; {f.target_phase || '-'}
                      {f.target_purpose ? ` &middot; ${f.target_purpose}` : ''}
                    </p>
                  </div>
                  <span className={`badge ${f.is_active ? 'badge-green' : 'badge-gray'}`}>
                    {f.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-3">
                  <div><span className="text-neutral-400">Total:</span> <span className="font-medium">{Number(f.total_quantity_kg).toLocaleString()} kg</span></div>
                  {f.calculated_cost_per_kg != null && (
                    <div><span className="text-neutral-400">Biaya/kg:</span> <span className="font-medium">Rp {Number(f.calculated_cost_per_kg).toLocaleString()}</span></div>
                  )}
                  {f.calculated_protein_pct != null && (
                    <div><span className="text-neutral-400">Protein:</span> <span className="font-medium">{f.calculated_protein_pct}%</span></div>
                  )}
                  {f.calculated_tdn_pct != null && (
                    <div><span className="text-neutral-400">TDN:</span> <span className="font-medium">{f.calculated_tdn_pct}%</span></div>
                  )}
                </div>
                <button
                  className="text-xs text-primary-600 font-medium hover:text-primary-700"
                  onClick={() => setExpandedId(isExpanded ? null : f.id)}
                >
                  {isExpanded ? 'Sembunyikan komposisi' : `Lihat komposisi (${items.length} item)`}
                </button>
                {isExpanded && items.length > 0 && (
                  <div className="mt-3 border-t border-neutral-100 pt-3 space-y-2">
                    {items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-neutral-700">{item.feeds?.name || '-'}</span>
                        <span className="font-medium text-neutral-800">
                          {Number(item.quantity_kg).toLocaleString()} kg
                          {item.percentage != null ? ` (${item.percentage}%)` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {f.notes && (
                  <p className="text-xs text-neutral-400 mt-3 italic">{f.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title={t('feed.purchase.title')} size="md">
        <PurchaseForm type="feed" t={t} onClose={() => { setShowPurchaseModal(false); }} />
      </Modal>

      <Modal open={showConsumeModal} onClose={() => setShowConsumeModal(false)} title={t('feed.usage.title')} size="md">
        <ConsumeForm t={t} onClose={() => { setShowConsumeModal(false); }} />
      </Modal>
    </div>
  );
}

/* ===================== MEDICINE STOCK VIEW (/medicine-inventory) ===================== */
function MedicineStockView() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

  const loadData = () => {
    if (!user?.id) return;
    Promise.all([
      getMedicineInventory(user.id),
      getMedicinePurchases(user.id),
    ])
      .then(([inv, pur]) => {
        setMedicines(inv as any[]);
        setPurchases(pur as any[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const lowStock = medicines.filter((m: any) => m.quantity_on_hand < m.min_threshold);
  const totalValue = medicines.reduce((s: number, m: any) => s + Number(m.total_cost), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('page.medicine.inventory')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {medicines.length} jenis obat &middot; Total nilai: {formatCurrency(totalValue)}
          </p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowUsageModal(true)}>
              <Package size={16} /> Catat Pemakaian
            </button>
            <button className="btn-primary" onClick={() => setShowPurchaseModal(true)}>
              <ShoppingCart size={16} /> Catat Pembelian
            </button>
          </div>
        )}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-error-50 border border-error-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-error-600" />
            <span className="font-semibold text-error-700">Stok Obat Menipis</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {lowStock.map(m => (
              <span key={m.id} className="text-xs bg-error-100 text-error-700 px-3 py-1 rounded-full font-medium">
                {m.medicines?.name || '-'}: {m.quantity_on_hand}/{m.min_threshold} {m.unit || 'pcs'}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="tab-bar w-fit">
        <button className={activeTab === 'stock' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('stock')}>
          Stok ({medicines.length})
        </button>
        <button className={activeTab === 'history' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('history')}>
          Riwayat Pembelian ({purchases.length})
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><p className="text-neutral-400">{t('common.loading')}</p></div>
      ) : activeTab === 'stock' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.length === 0 ? (
            <div className="col-span-full card p-12 text-center">
              <p className="text-neutral-500">Belum ada stok obat</p>
              <p className="text-sm text-neutral-400 mt-1">Lakukan pembelian obat untuk memulai</p>
            </div>
          ) : medicines.map((med: any) => {
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
                  <div className={`h-full rounded-full ${isLow ? 'bg-error-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="space-y-1 text-xs text-neutral-500">
                  <div className="flex justify-between">
                    <span>Min. Stok</span>
                    <span className="font-medium">{med.min_threshold} {med.unit || 'pcs'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nilai Stok</span>
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
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-default">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Obat</th>
                  <th>Jumlah</th>
                  <th>Harga/Unit</th>
                  <th>Total</th>
                  <th>Supplier</th>
                  <th>Batch</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-neutral-400 py-8">{t('common.no.data')}</td></tr>
                ) : purchases.map((p: any) => (
                  <tr key={p.id}>
                    <td className="text-sm">{formatDate(p.purchase_date)}</td>
                    <td className="font-medium">{p.medicines?.name || '-'}</td>
                    <td>{Number(p.quantity)} {p.unit || 'pcs'}</td>
                    <td>Rp {Number(p.price_per_unit).toLocaleString()}</td>
                    <td className="font-medium">{formatCurrency(Number(p.total_amount))}</td>
                    <td className="text-sm">{p.supplier || '-'}</td>
                    <td className="text-sm text-neutral-500">{p.batch_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title="Catat Pembelian Obat" size="md">
        <PurchaseForm type="medicine" t={t} onClose={() => { setShowPurchaseModal(false); loadData(); }} />
      </Modal>

      <Modal open={showUsageModal} onClose={() => setShowUsageModal(false)} title="Catat Pemakaian Obat" size="md">
        <MedicineUsageForm t={t} onClose={() => { setShowUsageModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}

/* ===================== PURCHASE FORM (shared) ===================== */
function PurchaseForm({ type, t, onClose }: { type: string; t: (key: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const [feedList, setFeedList] = useState<any[]>([]);
  const [medList, setMedList] = useState<any[]>([]);
  const [form, setForm] = useState({
    item_id: '', supplier: '', quantity: '', price_per_unit: '',
    purchase_date: todayStr(), invoice_number: '', unit: 'kg',
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
          unit: form.unit,
          price_per_unit: ppu,
          total_amount: qty * ppu,
          supplier: form.supplier || undefined,
          invoice_number: form.invoice_number || undefined,
          recorded_by: user?.id,
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
          recorded_by: user?.id,
        });
      }
      onClose();
    } catch (err: any) { alert('Gagal: ' + (err?.message || err)); }
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
          <label className="label">Satuan/Unit</label>
          <select name="unit" className="select" value={form.unit} onChange={change}>
            <option value="kg">kg</option>
            <option value="gram">gram</option>
            <option value="liter">liter</option>
            <option value="pcs">pcs</option>
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

/* ===================== CONSUME FORM (feed usage) ===================== */
function ConsumeForm({ t, onClose }: { t: (key: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const [feedList, setFeedList] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [form, setForm] = useState({
    feed_id: '', quantity: '', consumption_date: todayStr(), unit: 'kg',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    Promise.all([
      getFeeds(user?.id),
      getFeedInventory(user?.id),
    ]).then(([f, inv]) => {
      setFeedList(f as any[]);
      setInventoryList(inv as any[]);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    if (!form.feed_id || !qty) { alert('Lengkapi data pemakaian'); return; }
    const invRecord = inventoryList.find((i: any) => i.feed_id === form.feed_id);
    const ppu = Number(invRecord?.avg_cost_per_unit) || 0;
    try {
      await createFeedConsumption(user?.id, {
        feed_id: form.feed_id,
        consumption_date: form.consumption_date,
        quantity: qty,
        unit: form.unit,
        cost_per_unit: ppu,
        total_cost: qty * ppu,
        recorded_by: user?.id,
      });
      onClose();
    } catch (err: any) { alert('Gagal: ' + (err?.message || err)); }
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
          <label className="label">Satuan/Unit</label>
          <select name="unit" className="select" value={form.unit} onChange={change}>
            <option value="kg">kg</option>
            <option value="gram">gram</option>
            <option value="liter">liter</option>
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

/* ===================== MEDICINE USAGE FORM ===================== */
function MedicineUsageForm({ t, onClose }: { t: (key: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const [medList, setMedList] = useState<any[]>([]);
  const [form, setForm] = useState({
    medicine_id: '', quantity: '', usage_date: todayStr(),
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    getMedicines(user?.id).then(setMedList).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    if (!form.medicine_id || !qty) { alert('Lengkapi data pemakaian'); return; }
    try {
      await createMedicineUsage(user?.id, {
        medicine_id: form.medicine_id,
        usage_date: form.usage_date,
        quantity: qty,
        cost_per_unit: 0,
        total_cost: 0,
      });
      onClose();
    } catch (err: any) { alert('Gagal: ' + (err?.message || err)); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">Obat</label>
          <select name="medicine_id" className="select" value={form.medicine_id} onChange={change}>
            <option value="">Pilih obat...</option>
            {medList.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Jumlah</label>
          <input name="quantity" type="number" className="input" placeholder="Jumlah pemakaian" value={form.quantity} onChange={change} required />
        </div>
        <div>
          <label className="label">Tanggal</label>
          <input name="usage_date" type="date" className="input" value={form.usage_date} onChange={change} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary">{t('common.save')}</button>
      </div>
    </form>
  );
}
