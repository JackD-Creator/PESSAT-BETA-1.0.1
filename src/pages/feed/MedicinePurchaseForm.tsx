import { useState, useEffect } from 'react';
import { getMedicines } from '../../lib/api';
import { createMedicinePurchase } from '../../lib/api/medicine';
import { useAuth } from '../../contexts/AuthContext';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function MedicinePurchaseForm({ t: _t, onClose }: { t: (key: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const [medList, setMedList] = useState<any[]>([]);
  const [form, setForm] = useState({
    item_id: '', supplier: '', quantity: '', price_per_unit: '',
    purchase_date: todayStr(), batch_number: '', unit: 'pcs',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    getMedicines(user!.id).then(setMedList).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const ppu = Number(form.price_per_unit);
    if (!form.item_id || !qty || !ppu) { alert('Lengkapi data pembelian'); return; }
    try {
      await createMedicinePurchase(user!.id, {
        medicine_id: form.item_id,
        purchase_date: form.purchase_date,
        quantity: qty,
        price_per_unit: ppu,
        total_amount: qty * ppu,
        supplier: form.supplier || undefined,
        batch_number: form.batch_number || undefined,
        recorded_by: user?.id,
      });
      onClose();
    } catch (err: any) { alert('Gagal: ' + (err?.message || err)); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">Obat</label>
          <select name="item_id" className="select" value={form.item_id} onChange={change}>
            <option value="">Pilih obat...</option>
            {medList.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Satuan</label>
          <select name="unit" className="select" value={form.unit} onChange={change}>
            <option value="pcs">pcs</option>
            <option value="botol">botol</option>
            <option value="ml">ml</option>
          </select>
        </div>
        <div>
          <label className="label">Supplier</label>
          <input name="supplier" className="input" placeholder="Nama supplier" value={form.supplier} onChange={change} />
        </div>
        <div>
          <label className="label">Jumlah</label>
          <input name="quantity" type="number" className="input" placeholder="Jumlah" value={form.quantity} onChange={change} required />
        </div>
        <div>
          <label className="label">Harga/Unit</label>
          <input name="price_per_unit" type="number" className="input" placeholder="Harga per unit" value={form.price_per_unit} onChange={change} required />
        </div>
        <div>
          <label className="label">Tanggal</label>
          <input name="purchase_date" type="date" className="input" value={form.purchase_date} onChange={change} />
        </div>
        <div>
          <label className="label">No. Batch</label>
          <input name="batch_number" className="input" placeholder="Nomor batch" value={form.batch_number} onChange={change} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="submit" className="btn-primary">Simpan</button>
      </div>
    </form>
  );
}
