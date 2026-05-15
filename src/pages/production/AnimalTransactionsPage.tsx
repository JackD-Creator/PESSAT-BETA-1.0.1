import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Pencil, Trash2 } from 'lucide-react';
import { getAnimals } from '../../lib/api';
import { getAnimalSales, getAnimalPurchases, createAnimalSale, createAnimalPurchase, updateAnimalSale, deleteAnimalSale, updateAnimalPurchase, deleteAnimalPurchase } from '../../lib/api/production';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { SpeciesBadge } from '../../components/ui/Badge';

function formatCurrency(n: number, locale = 'id-ID') {
  return `Rp ${n.toLocaleString(locale)}`;
}

export function AnimalTransactionsPage() {
  const { hasRole, user } = useAuth();
  const { t, locale } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [txType, setTxType] = useState<'sale' | 'purchase'>('sale');
  const [filter, setFilter] = useState('all');
  const [animals, setAnimals] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  const loadData = () => {
    getAnimals(user?.id).then(setAnimals);
    getAnimalSales(user?.id).then(setSales).catch(() => {});
    getAnimalPurchases(user?.id).then(setPurchases).catch(() => {});
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const combined = [
    ...sales.map((s: any) => ({
      id: s.id,
      transaction_date: s.sale_date,
      type: 'sale' as const,
      animal_tag: s.animals?.tag_id || '-',
      species: s.animals?.species || 'cattle',
      breed: s.animals?.breed || '-',
      weight_kg: s.weight_at_sale_kg || 0,
      price: s.sale_price || 0,
      party: s.buyer_name || '-',
      notes: s.notes || '',
    })),
    ...purchases.map((p: any) => ({
      id: p.id,
      transaction_date: p.purchase_date,
      type: 'purchase' as const,
      animal_tag: p.animals?.tag_id || '-',
      species: p.animals?.species || 'cattle',
      breed: p.animals?.breed || '-',
      weight_kg: p.weight_at_purchase_kg || 0,
      price: p.purchase_price || p.total_cost || 0,
      party: p.seller_name || '-',
      notes: p.notes || '',
    })),
  ].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

  const filtered = combined.filter(t => filter === 'all' || t.type === filter);
  const totalSales = sales.reduce((s: number, t: any) => s + Number(t.sale_price || 0), 0);
  const totalPurchasesVal = purchases.reduce((s: number, p: any) => s + Number(p.purchase_price || p.total_cost || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('transaction.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('transaction.subtitle')}</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => { setTxType('purchase'); setShowModal(true); }}>
              <ArrowDownLeft size={16} />
              {t('transaction.add.purchase')}
            </button>
            <button className="btn-primary" onClick={() => { setTxType('sale'); setShowModal(true); }}>
              <ArrowUpRight size={16} />
              {t('transaction.add.sale')}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">{t('transaction.total.sales')}</p>
              <p className="text-2xl font-bold text-primary-700 mt-1">{formatCurrency(totalSales)}</p>
            </div>
            <div className="bg-primary-50 p-3 rounded-xl">
              <ArrowUpRight size={22} className="text-primary-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 font-medium">{t('transaction.total.purchases')}</p>
              <p className="text-2xl font-bold text-error-700 mt-1">{formatCurrency(totalPurchasesVal)}</p>
            </div>
            <div className="bg-error-50 p-3 rounded-xl">
              <ArrowDownLeft size={22} className="text-error-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs text-neutral-500 font-medium">{t('transaction.current.population')}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{animals.length}</p>
          <p className="text-xs text-neutral-400 mt-0.5">{t('transaction.population.label')}</p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-neutral-100 flex items-center gap-3">
          <h2 className="section-header">{t('transaction.history.title')}</h2>
          <div className="tab-bar ml-auto">
            {[{ val: 'all', label: t('transaction.filter.all') }, { val: 'sale', label: t('transaction.filter.sales') }, { val: 'purchase', label: t('transaction.filter.purchases') }].map(opt => (
              <button key={opt.val} className={filter === opt.val ? 'tab-active' : 'tab-inactive'} onClick={() => setFilter(opt.val)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('transaction.table.date')}</th>
                <th>{t('transaction.table.type')}</th>
                <th>{t('transaction.table.tag')}</th>
                <th>{t('transaction.table.breed')}</th>
                <th>{t('transaction.table.weight')}</th>
                <th>{t('transaction.table.price')}</th>
                <th>{t('transaction.table.party')}</th>
                <th>{t('transaction.table.notes')}</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.id}>
                  <td>{new Date(tx.transaction_date).toLocaleDateString(locale)}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit ${tx.type === 'sale' ? 'bg-primary-100 text-primary-700' : 'bg-error-100 text-error-700'}`}>
                      {tx.type === 'sale' ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
                      {tx.type === 'sale' ? t('transaction.type.sale') : t('transaction.type.purchase')}
                    </span>
                  </td>
                  <td className="font-semibold text-primary-700">{tx.animal_tag}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <SpeciesBadge species={tx.species} />
                      <span className="text-sm text-neutral-600">{tx.breed}</span>
                    </div>
                  </td>
                  <td>{tx.weight_kg} kg</td>
                  <td className={`font-semibold ${tx.type === 'sale' ? 'text-primary-700' : 'text-error-700'}`}>
                    {formatCurrency(tx.price)}
                  </td>
                  <td>{tx.party}</td>
                  <td className="max-w-[180px] truncate text-neutral-500">{tx.notes || '-'}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn-ghost btn-sm p-1.5" onClick={() => setEditingItem(tx)}><Pencil size={14} /></button>
                      <button className="btn-ghost btn-sm p-1.5 text-error-500" onClick={async () => {
                        if (!window.confirm('Hapus data ini?')) return;
                        try {
                          if (tx.type === 'sale') await deleteAnimalSale(user?.id, tx.id);
                          else await deleteAnimalPurchase(user?.id, tx.id);
                          loadData();
                        } catch { alert('Gagal menghapus'); }
                      }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={txType === 'sale' ? t('transaction.form.sale.title') : t('transaction.form.purchase.title')} size="md">
        <AnimalTransactionForm animals={animals} type={txType} onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Transaksi" size="sm">
        {editingItem && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const payload: any = {
              [editingItem.type === 'sale' ? 'sale_price' : 'purchase_price']: Number(fd.get('price')),
              notes: fd.get('notes') as string,
            };
            if (fd.get('weight')) payload[editingItem.type === 'sale' ? 'weight_at_sale_kg' : 'weight_at_purchase_kg'] = Number(fd.get('weight'));
            if (editingItem.type === 'sale') {
              payload.sale_date = fd.get('transaction_date') as string;
            } else {
              payload.purchase_date = fd.get('transaction_date') as string;
            }
            try {
              if (editingItem.type === 'sale') await updateAnimalSale(user?.id, editingItem.id, payload);
              else await updateAnimalPurchase(user?.id, editingItem.id, payload);
              setEditingItem(null);
              loadData();
            } catch { alert('Gagal mengupdate'); }
          }} className="space-y-4">
            <div>
              <label className="label">Harga</label>
              <input name="price" type="number" className="input" defaultValue={editingItem.price} required />
            </div>
            <div>
              <label className="label">Berat (kg)</label>
              <input name="weight" type="number" step="0.1" className="input" defaultValue={editingItem.weight_kg || ''} />
            </div>
            <div>
              <label className="label">Tanggal</label>
              <input name="transaction_date" type="date" className="input" defaultValue={editingItem.transaction_date?.split('T')[0]} required />
            </div>
            <div>
              <label className="label">Keterangan</label>
              <textarea name="notes" className="input h-16 resize-none" defaultValue={editingItem.notes || ''} />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setEditingItem(null)}>Batal</button>
              <button type="submit" className="btn-primary">Simpan</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function AnimalTransactionForm({ animals, type, onClose }: { animals: any[]; type: 'sale' | 'purchase'; onClose: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({
    animal_id: '', party: '', price: '', transaction_date: new Date().toISOString().split('T')[0],
    new_tag_id: '', species: 'cattle', weight: '', notes: '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    if (!price) { alert('Harga harus diisi'); return; }

    try {
      if (type === 'sale') {
        if (!form.animal_id) { alert('Pilih ternak'); return; }
        await createAnimalSale(user?.id, {
          animal_id: form.animal_id,
          sale_date: form.transaction_date,
          buyer_name: form.party || undefined,
          sale_price: price,
          weight_at_sale_kg: form.weight ? Number(form.weight) : undefined,
          notes: form.notes || undefined,
          recorded_by: user?.id,
        });
      } else {
        if (!form.new_tag_id) { alert('Tag ID harus diisi'); return; }
        await createAnimalPurchase(user?.id, {
          animal_id: form.new_tag_id,
          purchase_date: form.transaction_date,
          seller_name: form.party || undefined,
          purchase_price: price,
          total_cost: price,
          weight_at_purchase_kg: form.weight ? Number(form.weight) : undefined,
          notes: form.notes || undefined,
          recorded_by: user?.id,
        });
      }
      onClose();
    } catch { alert('Gagal menyimpan transaksi'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        {type === 'sale' ? (
          <div>
            <label className="label">{t('transaction.form.animal')}</label>
            <select name="animal_id" className="select" value={form.animal_id} onChange={change}>
              <option value="">Pilih ternak...</option>
              {animals.map((a: any) => <option key={a.id} value={a.id}>{a.tag_id} - {a.breed}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="label">{t('transaction.form.newtag')} <span className="text-error-500">*</span></label>
            <input name="new_tag_id" className="input" placeholder={t('transaction.form.newtag.placeholder')} value={form.new_tag_id} onChange={change} required />
          </div>
        )}
        <div>
          <label className="label">{t('transaction.form.party')}</label>
          <input name="party" className="input" placeholder={t('transaction.form.party.placeholder')} value={form.party} onChange={change} />
        </div>
        <div>
          <label className="label">{t('transaction.form.price')}</label>
          <input name="price" type="number" className="input" placeholder={t('transaction.form.price.placeholder')} value={form.price} onChange={change} required />
        </div>
        <div>
          <label className="label">{t('transaction.form.date')}</label>
          <input name="transaction_date" type="date" className="input" value={form.transaction_date} onChange={change} />
        </div>
        {type === 'purchase' && (
          <>
            <div>
              <label className="label">{t('transaction.form.species')}</label>
              <select name="species" className="select" value={form.species} onChange={change}>
                <option value="cattle">{t('species.cattle')}</option>
                <option value="sheep">{t('species.sheep')}</option>
                <option value="goat">{t('species.goat')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('transaction.form.weight')}</label>
              <input name="weight" type="number" step="0.1" className="input" placeholder={t('transaction.form.weight.placeholder')} value={form.weight} onChange={change} />
            </div>
          </>
        )}
      </div>
      <div>
        <label className="label">{t('transaction.form.notes')}</label>
        <textarea name="notes" className="input h-16 resize-none" placeholder={t('transaction.form.notes.placeholder')} value={form.notes} onChange={change} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary">{t('common.save')}</button>
      </div>
    </form>
  );
}
