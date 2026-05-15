import { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Globe2, Scale, Save, Loader2 } from 'lucide-react';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { useAuth } from '../contexts/AuthContext';
import type { FarmProfile, FarmScale } from '../types';

export function ProfilePage() {
  const { user } = useAuth();
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const scaleLabels: Record<FarmScale, string> = { kecil: 'Kecil', sedang: 'Sedang', besar: 'Besar' };

  useEffect(() => {
    if (!user) return;
    supabaseAdmin.from('farm_profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setFarm(data as FarmProfile);
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user || !farm) return;
    setSaving(true);
    setMessage('');
    const { error } = await supabaseAdmin.from('farm_profiles').update(farm).eq('id', farm.id);
    if (error) {
      setMessage('Gagal menyimpan: ' + error.message);
    } else {
      setMessage('Data peternakan berhasil disimpan');
    }
    setSaving(false);
  };

  const set = (k: keyof FarmProfile, v: string) => setFarm(p => p ? { ...p, [k]: v } : p);

  if (loading) return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Profil Peternakan</h1>
          <p className="text-sm text-neutral-500">Kelola data profil peternakan Anda</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-lg">
          <Building2 size={16} />
          {user?.full_name}
        </div>
      </div>

      {!farm ? (
        <div className="text-center py-16 text-neutral-400">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>Belum ada data peternakan. Silakan isi data saat registrasi.</p>
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nama Peternakan</label>
              <input className="input" value={farm.farm_name} onChange={e => set('farm_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Nama Pemilik</label>
              <input className="input" value={farm.owner_name} onChange={e => set('owner_name', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Alamat</label>
            <textarea className="input" rows={2} value={farm.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Skala Ternak</label>
              <select className="input" value={farm.farm_scale} onChange={e => set('farm_scale', e.target.value)}>
                <option value="kecil">Kecil</option>
                <option value="sedang">Sedang</option>
                <option value="besar">Besar</option>
              </select>
            </div>
            <div>
              <label className="label">No. Telefon</label>
              <input className="input" value={farm.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input className="input" value={farm.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="label">Website</label>
              <input className="input" value={farm.website} onChange={e => set('website', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Media Sosial</label>
            <input className="input" value={farm.social_media} onChange={e => set('social_media', e.target.value)} />
          </div>

          {message && (
            <div className={`text-sm px-4 py-3 rounded-xl border ${message.includes('berhasil') ? 'bg-primary-50 text-primary-700 border-primary-100' : 'bg-error-50 text-error-700 border-error-100'}`}>
              {message}
            </div>
          )}

          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan
          </button>
        </div>
      )}
    </div>
  );
}