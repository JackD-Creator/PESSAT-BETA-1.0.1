import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { getAnimals } from '../../lib/db';
import { createAnimalSale, createAnimalPurchase } from '../../lib/api/production';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { SpeciesBadge } from '../../components/ui/Badge';

function formatCurrency(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function AnimalTransactionsPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [txType, setTxType] = useState<'sale' | 'purchase'>('sale');
  const [filter, setFilter] = useState('all');
  const [animals, setAnimals] = useState<any[]>([]);

  const loadData = () => { getAnimals().then(setAnimals); };

  useEffect(() => { loadData(); }, []);

  const mockAnimalTransactions = animals
    .filter((a: any) => a.acquisition_type === 'purchased' || a.status === 'sold')
    .map((a: any) => ({
      id: a.id,
      transaction_date: a.acquisition_date || a.created_at?.split('T')[0] || '',
      type: a.status === 'sold' ? 'sale' as const : 'purchase' as const,
      animal_tag: a.tag_id,
      species: a.species as 'cattle' | 'sheep' | 'goat',
      breed: a.breed,
      weight_kg: a.current_weight_kg || 0,
      price: a.acquisition_cost || 0,
      party: '-',
      notes: a.notes || '',
    }));

  const filtered = mockAnimalTransactions.filter(t => filter === 'all' || t.type === filter);
  const totalSales = mockAnimalTransactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.price, 0);
  const totalPurchases = mockAnimalTransactions.filter(t => t.type === 'purchase').reduce((s, t) => s + t.price, 0);

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
              <p className="text-2xl font-bold text-error-700 mt-1">{formatCurrency(totalPurchases)}</p>
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
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.id}>
                  <td>{new Date(tx.transaction_date).toLocaleDateString('id-ID')}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={txType === 'sale' ? t('transaction.form.sale.title') : t('transaction.form.purchase.title')} size="md">
        <AnimalTransactionForm animals={animals} type={txType} onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>
    </div>
  );
}

function AnimalTransactionForm({ animals, type, onClose }: { animals: any[]; type: 'sale' | 'purchase'; onClose: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({
    animal_id: '', party: '', price: '', transaction_date: '2026-05-14',
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
        await createAnimalSale({
          animal_id: form.animal_id,
          sale_date: form.transaction_date,
          buyer_name: form.party || undefined,
          sale_price: price,
          weight_at_sale_kg: form.weight ? Number(form.weight) : undefined,
          notes: form.notes || undefined,
          recorded_by: (user as any)?.full_name || undefined,
        });
      } else {
        if (!form.new_tag_id) { alert('Tag ID harus diisi'); return; }
        await createAnimalPurchase({
          animal_id: form.new_tag_id,
          purchase_date: form.transaction_date,
          seller_name: form.party || undefined,
          purchase_price: price,
          total_cost: price,
          weight_at_purchase_kg: form.weight ? Number(form.weight) : undefined,
          notes: form.notes || undefined,
          recorded_by: (user as any)?.full_name || undefined,
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
