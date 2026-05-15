import { useState, useEffect } from 'react';
import { getFeeds, getMedicines } from '../../lib/api';
import { createFeedPurchase } from '../../lib/api/feed';
import { createMedicinePurchase } from '../../lib/api/medicine';
import { useAuth } from '../../contexts/AuthContext';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function FeedPurchaseForm({ type, t, onClose }: { type: string; t: (key: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const [feedList, setFeedList] = useState<any[]>([]);
  const [medList, setMedList] = useState<any[]>([]);
  const [form, setForm] = useState({
    item_id: '', supplier: '', quantity: '', price_per_unit: '',
    purchase_date: todayStr(), invoice_number: '', unit: 'kg',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    Promise.all([getFeeds(user!.id), getMedicines(user!.id)])
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
        await createFeedPurchase(user!.id, {
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
        await createMedicinePurchase(user!.id, {
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
