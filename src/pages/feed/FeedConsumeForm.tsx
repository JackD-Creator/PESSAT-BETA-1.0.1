import { useState, useEffect } from 'react';
import { getFeeds, getFeedInventory } from '../../lib/api';
import { createFeedConsumption } from '../../lib/api/feed';
import { useAuth } from '../../contexts/AuthContext';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function FeedConsumeForm({ t, onClose }: { t: (key: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const [feedList, setFeedList] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [form, setForm] = useState({
    feed_id: '', quantity: '', consumption_date: todayStr(), unit: 'kg',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    Promise.all([
      getFeeds(user!.id),
      getFeedInventory(user!.id),
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
      await createFeedConsumption(user!.id, {
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
