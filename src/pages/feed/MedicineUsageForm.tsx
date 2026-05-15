import { useState, useEffect } from 'react';
import { getMedicines } from '../../lib/api';
import { createMedicineUsage } from '../../lib/api/medicine';
import { useAuth } from '../../contexts/AuthContext';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function MedicineUsageForm({ t: _t, onClose }: { t: (key: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const [medList, setMedList] = useState<any[]>([]);
  const [form, setForm] = useState({
    medicine_id: '', quantity: '', usage_date: todayStr(),
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    getMedicines(user!.id).then(setMedList).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    if (!form.medicine_id || !qty) { alert('Lengkapi data pemakaian'); return; }
    try {
      await createMedicineUsage(user!.id, {
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
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="submit" className="btn-primary">Simpan</button>
      </div>
    </form>
  );
}
