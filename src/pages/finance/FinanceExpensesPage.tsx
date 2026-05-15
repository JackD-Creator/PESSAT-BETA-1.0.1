import { useState, useEffect } from 'react';
import { Plus, DollarSign, Pencil, Trash2 } from 'lucide-react';
import {
  getTransactions,
  getLaborExpenses, createLaborExpense, updateLaborExpense, deleteLaborExpense,
  getOperationalExpenses, createOperationalExpense, updateOperationalExpense, deleteOperationalExpense,
} from '../../lib/api/finance';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

function formatCurrency(n: number) {
  return `Rp. ${n.toLocaleString('id-ID')},-`;
}

function formatDate(d: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

const OPEX_CATEGORIES: Record<string, string> = {
  opex_electricity: 'Listrik',
  opex_water: 'Air',
  opex_fuel: 'BBM',
  stock_loss: 'Kerugian Stok',
  maintenance: 'Perawatan',
  other: 'Lainnya',
};

const LABOR_TYPES: Record<string, string> = {
  salary: 'Gaji',
  bonus: 'Bonus',
  overtime: 'Lembur',
  other: 'Lainnya',
};

export function FinanceExpensesPage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingLabor, setEditingLabor] = useState<any | null>(null);
  const [editingOpex, setEditingOpex] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'labor' | 'opex'>('labor');

  const [txs, setTxs] = useState<any[]>([]);
  const [laborList, setLaborList] = useState<any[]>([]);
  const [opexList, setOpexList] = useState<any[]>([]);

  const loadData = () => {
    if (!user?.id) return;
    Promise.all([
      getTransactions(user.id),
      getLaborExpenses(user.id),
      getOperationalExpenses(user.id),
    ]).then(([t, l, o]) => {
      setTxs(t as any[]);
      setLaborList(l as any[]);
      setOpexList(o as any[]);
    }).catch(() => {});
  };
  useEffect(() => { loadData(); }, [user?.id]);

  const expenses = txs.filter((tr: any) => tr.type === 'expense');
  const cashExpenses = expenses.filter((tr: any) => tr.cash_flow === 'cash_out').reduce((s: number, tr: any) => s + Number(tr.amount), 0);
  const nonCashExpenses = expenses.filter((tr: any) => tr.cash_flow === 'non_cash').reduce((s: number, tr: any) => s + Number(tr.amount), 0);

  const categoryLabels: Record<string, string> = {
    feed_purchase: 'Pembelian Pakan',
    feed_usage: 'Pemakaian Pakan',
    medicine_purchase: 'Pembelian Obat',
    medicine_usage: 'Pemakaian Obat',
    vet_service: 'Jasa Dokter Hewan',
    vaccination: 'Vaksinasi',
    breeding: 'Perkawinan',
    animal_purchase: 'Pembelian Ternak',
    labor: 'Tenaga Kerja',
    opex_electricity: 'Listrik',
    opex_water: 'Air',
    opex_fuel: 'BBM',
    stock_loss: 'Kerugian Stok',
  };

  const byCategory = Object.entries(
    expenses.reduce((acc: Record<string, number>, tr: any) => {
      acc[tr.category] = (acc[tr.category] || 0) + Number(tr.amount);
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);
  const maxCat = byCategory[0]?.[1] || 1;

  const handleDeleteLabor = async (id: string) => {
    if (!window.confirm('Hapus data biaya tenaga kerja ini?')) return;
    await deleteLaborExpense(user!.id, id).catch(() => {});
    loadData();
  };

  const handleDeleteOpex = async (id: string) => {
    if (!window.confirm('Hapus data biaya operasional ini?')) return;
    await deleteOperationalExpense(user!.id, id).catch(() => {});
    loadData();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('expense.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('expense.subtitle')}</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            {t('expense.add')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-l-error-500">
          <p className="text-xs text-neutral-500 font-medium">{t('expense.total.cash')}</p>
          <p className="text-2xl font-bold text-error-700 mt-1">{formatCurrency(cashExpenses)}</p>
        </div>
        <div className="card p-5 border-l-4 border-l-warning-500">
          <p className="text-xs text-neutral-500 font-medium">{t('expense.total.noncash')}</p>
          <p className="text-2xl font-bold text-warning-700 mt-1">{formatCurrency(nonCashExpenses)}</p>
        </div>
        <div className="card p-5 border-l-4 border-l-neutral-400">
          <p className="text-xs text-neutral-500 font-medium">{t('expense.total.all')}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(cashExpenses + nonCashExpenses)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-1">
          <h2 className="section-header mb-4">{t('expense.by.category')}</h2>
          <div className="space-y-3">
            {byCategory.map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-neutral-700">{categoryLabels[cat] || cat}</span>
                  <span className="text-xs font-semibold text-neutral-700">{formatCurrency(amount)}</span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-earth-400 rounded-full" style={{ width: `${(amount / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <div className="tab-bar w-fit">
              <button className={activeTab === 'labor' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('labor')}>
                Tenaga Kerja ({laborList.length})
              </button>
              <button className={activeTab === 'opex' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('opex')}>
                Operasional ({opexList.length})
              </button>
            </div>
          </div>

          {activeTab === 'labor' ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Nama Pekerja</th>
                    <th>Tipe</th>
                    <th className="text-right">Jumlah</th>
                    <th>Catatan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {laborList.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-neutral-400 py-8">{t('common.no.data')}</td></tr>
                  ) : laborList.map((l: any) => (
                    <tr key={l.id}>
                      <td className="text-sm">{formatDate(l.expense_date)}</td>
                      <td className="font-medium">{l.worker_name}</td>
                      <td><span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{LABOR_TYPES[l.expense_type] || l.expense_type}</span></td>
                      <td className="text-right font-semibold text-error-600">{formatCurrency(Number(l.amount))}</td>
                      <td className="text-sm text-neutral-500 max-w-[150px] truncate">{l.notes || '-'}</td>
                      <td>
                        {hasRole(['owner', 'manager']) && (
                          <div className="flex gap-1">
                            <button className="btn-ghost text-neutral-400 hover:text-primary-600 p-1" title="Edit" onClick={() => setEditingLabor(l)}>
                              <Pencil size={14} />
                            </button>
                            <button className="btn-ghost text-neutral-400 hover:text-error-600 p-1" title="Hapus" onClick={() => handleDeleteLabor(l.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Kategori</th>
                    <th>Deskripsi</th>
                    <th>Tipe Kas</th>
                    <th className="text-right">Jumlah</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {opexList.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-neutral-400 py-8">{t('common.no.data')}</td></tr>
                  ) : opexList.map((o: any) => (
                    <tr key={o.id}>
                      <td className="text-sm">{formatDate(o.expense_date)}</td>
                      <td><span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{OPEX_CATEGORIES[o.category] || o.category}</span></td>
                      <td className="text-sm text-neutral-600 max-w-[150px] truncate">{o.description || '-'}</td>
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.cash_flow === 'non_cash' ? 'bg-warning-100 text-warning-700' : 'bg-error-100 text-error-700'}`}>
                          {o.cash_flow === 'non_cash' ? 'Non-Kas' : 'Kas'}
                        </span>
                      </td>
                      <td className="text-right font-semibold text-error-600">{formatCurrency(Number(o.amount))}</td>
                      <td>
                        {hasRole(['owner', 'manager']) && (
                          <div className="flex gap-1">
                            <button className="btn-ghost text-neutral-400 hover:text-primary-600 p-1" title="Edit" onClick={() => setEditingOpex(o)}>
                              <Pencil size={14} />
                            </button>
                            <button className="btn-ghost text-neutral-400 hover:text-error-600 p-1" title="Hapus" onClick={() => handleDeleteOpex(o.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('expense.form.title')} size="md">
        <ExpenseForm t={t} onClose={() => { setShowModal(false); loadData(); }} />
      </Modal>

      <Modal open={!!editingLabor} onClose={() => setEditingLabor(null)} title="Edit Biaya Tenaga Kerja" size="md">
        {editingLabor && (
          <LaborEditForm labor={editingLabor} onClose={() => { setEditingLabor(null); loadData(); }} />
        )}
      </Modal>

      <Modal open={!!editingOpex} onClose={() => setEditingOpex(null)} title="Edit Biaya Operasional" size="md">
        {editingOpex && (
          <OpexEditForm opex={editingOpex} onClose={() => { setEditingOpex(null); loadData(); }} />
        )}
      </Modal>
    </div>
  );
}

function LaborEditForm({ labor, onClose }: { labor: any; onClose: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    expense_date: labor.expense_date || '',
    worker_name: labor.worker_name || '',
    expense_type: labor.expense_type || 'salary',
    amount: String(labor.amount || ''),
    notes: labor.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateLaborExpense(user!.id, labor.id, {
        expense_date: form.expense_date,
        worker_name: form.worker_name,
        expense_type: form.expense_type as any,
        amount: Number(form.amount),
        notes: form.notes || undefined,
      });
      onClose();
    } catch (err: any) { alert('Gagal: ' + (err?.message || err)); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">Tanggal</label>
          <input name="expense_date" type="date" className="input" value={form.expense_date} onChange={change} required />
        </div>
        <div>
          <label className="label">Tipe</label>
          <select name="expense_type" className="select" value={form.expense_type} onChange={change}>
            {Object.entries(LABOR_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Nama Pekerja</label>
          <input name="worker_name" className="input" value={form.worker_name} onChange={change} required />
        </div>
        <div className="col-span-2">
          <label className="label">Jumlah (Rp)</label>
          <input name="amount" type="number" className="input" value={form.amount} onChange={change} required />
        </div>
        <div className="col-span-2">
          <label className="label">Catatan</label>
          <input name="notes" className="input" value={form.notes} onChange={change} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Batal</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Pencil size={14} />}
          Simpan
        </button>
      </div>
    </form>
  );
}

function OpexEditForm({ opex, onClose }: { opex: any; onClose: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    expense_date: opex.expense_date || '',
    category: opex.category || 'opex_electricity',
    amount: String(opex.amount || ''),
    description: opex.description || '',
    cash_flow: opex.cash_flow || 'cash_out',
  });
  const [submitting, setSubmitting] = useState(false);
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateOperationalExpense(user!.id, opex.id, {
        expense_date: form.expense_date,
        category: form.category as any,
        amount: Number(form.amount),
        description: form.description || undefined,
        cash_flow: form.cash_flow as any,
      });
      onClose();
    } catch (err: any) { alert('Gagal: ' + (err?.message || err)); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">Tanggal</label>
          <input name="expense_date" type="date" className="input" value={form.expense_date} onChange={change} required />
        </div>
        <div>
          <label className="label">Kategori</label>
          <select name="category" className="select" value={form.category} onChange={change}>
            {Object.entries(OPEX_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Jumlah (Rp)</label>
          <input name="amount" type="number" className="input" value={form.amount} onChange={change} required />
        </div>
        <div>
          <label className="label">Tipe Kas</label>
          <select name="cash_flow" className="select" value={form.cash_flow} onChange={change}>
            <option value="cash_out">Kas Keluar</option>
            <option value="non_cash">Non-Kas</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Deskripsi</label>
          <input name="description" className="input" value={form.description} onChange={change} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Batal</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Pencil size={14} />}
          Simpan
        </button>
      </div>
    </form>
  );
}

function ExpenseForm({ t, onClose }: { t: (key: string) => string; onClose: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    expense_type: 'labor', category: 'opex_electricity', amount: '', expense_date: new Date().toISOString().split('T')[0],
    cash_flow: 'cash_out', description: '', worker_name: '',
  });
  const change = (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount) { alert('Jumlah harus diisi'); return; }

    try {
      if (form.expense_type === 'labor') {
        await createLaborExpense(user?.id, {
          expense_date: form.expense_date,
          worker_name: form.worker_name || 'Unknown',
          expense_type: 'salary',
          amount,
          notes: form.description || undefined,
        });
      } else {
        await createOperationalExpense(user?.id, {
          expense_date: form.expense_date,
          category: form.category as any,
          amount,
          description: form.description || undefined,
          cash_flow: form.cash_flow as any,
        });
      }
      onClose();
    } catch { alert('Gagal menyimpan pengeluaran'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid-2">
        <div>
          <label className="label">{t('expense.form.category')}</label>
          <div className="flex gap-2 mb-2">
            <label className="flex items-center gap-1 text-sm"><input type="radio" name="expense_type" value="labor" checked={form.expense_type === 'labor'} onChange={change} /> Tenaga Kerja</label>
            <label className="flex items-center gap-1 text-sm"><input type="radio" name="expense_type" value="opex" checked={form.expense_type === 'opex'} onChange={change} /> Operasional</label>
          </div>
          {form.expense_type === 'labor' ? (
            <input name="worker_name" className="input" placeholder="Nama pekerja" value={form.worker_name} onChange={change} />
          ) : (
            <select name="category" className="select" value={form.category} onChange={change}>
              {Object.entries(OPEX_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="label">{t('expense.form.amount')}</label>
          <input name="amount" type="number" className="input" placeholder="500000" value={form.amount} onChange={change} required />
        </div>
        <div>
          <label className="label">{t('expense.form.date')}</label>
          <input name="expense_date" type="date" className="input" value={form.expense_date} onChange={change} />
        </div>
        <div>
          <label className="label">{t('expense.form.cashflow')}</label>
          <select name="cash_flow" className="select" value={form.cash_flow} onChange={change}>
            <option value="cash_out">{t('expense.form.cashflow.cash')}</option>
            <option value="non_cash">{t('expense.form.cashflow.noncash')}</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">{t('expense.form.description')}</label>
        <input name="description" className="input" placeholder={t('expense.form.description.placeholder')} value={form.description} onChange={change} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary">
          <DollarSign size={14} />
          {t('common.save')}
        </button>
      </div>
    </form>
  );
}
