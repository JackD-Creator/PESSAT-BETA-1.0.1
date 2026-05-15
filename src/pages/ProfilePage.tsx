import { useState, useEffect } from 'react';
import { Building2, Save, Loader2, MapPin, Phone, Mail, Globe, CheckCircle, User, Scale } from 'lucide-react';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import type { FarmProfile } from '../types';

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 6 6 0 0 0-9-9Z" />
      <path d="M20.5 20.5a4.5 4.5 0 0 0-4.5-4.5 4.5 4.5 0 0 0 4.5 4.5Z" />
      <path d="M4 23a3 3 0 0 0 3-3 3 3 0 0 0-3 3Z" />
      <path d="M7.5 4.5a3 3 0 0 0 3-3 3 3 0 0 0-3 3Z" />
    </svg>
  );
}

const scaleLabels: Record<string, string> = {
  kecil: 'Peternakan Kecil',
  sedang: 'Peternakan Sedang',
  besar: 'Peternakan Besar',
};

export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
      setMessage('Profil berhasil disimpan!');
    }
    setSaving(false);
  };

  const set = (k: keyof FarmProfile, v: string) => setFarm(p => p ? { ...p, [k]: v } : p);

  if (loading) return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!farm) {
    return (
      <div className="page-container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-8 md:p-10 shadow-glow-lg">
          <div className="absolute inset-0 bg-gradient-pattern opacity-30" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-200/80 text-xs sm:text-sm font-semibold mb-2 tracking-wide">
              <SparkleIcon />
              <span>Profil Peternakan</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-sm">{t('profile.title')}</h1>
          </div>
        </div>
        <div className="text-center py-16 text-neutral-400 mt-6">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t('profile.no_data')}</p>
        </div>
      </div>
    );
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page-container space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-6 md:p-8 lg:p-10 shadow-glow-lg">
        <div className="absolute inset-0 bg-gradient-pattern opacity-30" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-400/10 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-200/80 text-xs sm:text-sm font-semibold mb-2 tracking-wide">
              <SparkleIcon />
              <span>{dateStr}</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight drop-shadow-sm">
              {farm.farm_name || 'Peternakan'}
            </h1>
            <p className="text-emerald-100/70 text-sm md:text-base mt-1.5 max-w-xl font-medium">
              {farm.owner_name ? `Dimiliki oleh ${farm.owner_name}` : 'Kelola profil peternakan Anda'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur-md text-white rounded-xl text-sm font-bold border border-white/10 shadow-lg">
              <User size={16} />
              {user?.full_name}
            </div>
          </div>
        </div>
        {/* Hero Stats */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 md:mt-8">
          {[
            { label: 'Skala Peternakan', value: scaleLabels[farm.farm_scale] || farm.farm_scale || '-', icon: <Scale size={16} /> },
            { label: 'Kontak', value: farm.phone || '-', icon: <Phone size={16} /> },
            { label: 'Email', value: farm.email || '-', icon: <Mail size={16} /> },
            { label: 'Status', value: 'Aktif', icon: <CheckCircle size={16} /> },
          ].map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 md:p-4 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-2 text-emerald-200/70 text-[11px] md:text-xs font-semibold uppercase tracking-wider mb-1.5">
                {item.icon} {item.label}
              </div>
              <p className="text-sm md:text-base lg:text-lg font-extrabold text-white group-hover:scale-105 transition-transform duration-200 origin-left">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <div className="card p-6 md:p-8 hover:shadow-card-md transition-shadow duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-800">Informasi Peternakan</h2>
            <p className="text-sm text-neutral-500">Lengkapi data profil peternakan Anda</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label">{t('profile.farm_name')}</label>
            <input className="input" value={farm.farm_name} onChange={e => set('farm_name', e.target.value)} />
          </div>
          <div>
            <label className="label">{t('profile.owner_name')}</label>
            <input className="input" value={farm.owner_name} onChange={e => set('owner_name', e.target.value)} />
          </div>
        </div>
        <div className="mt-5">
          <label className="label flex items-center gap-1.5"><MapPin size={14} /> {t('profile.address')}</label>
          <textarea className="input" rows={2} value={farm.address} onChange={e => set('address', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
          <div>
            <label className="label">{t('profile.scale')}</label>
            <select className="input" value={farm.farm_scale} onChange={e => set('farm_scale', e.target.value)}>
              <option value="kecil">{t('profile.scale.small')}</option>
              <option value="sedang">{t('profile.scale.medium')}</option>
              <option value="besar">{t('profile.scale.large')}</option>
            </select>
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Phone size={14} /> {t('profile.phone')}</label>
            <input className="input" value={farm.phone} onChange={e => set('phone', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
          <div>
            <label className="label flex items-center gap-1.5"><Mail size={14} /> {t('profile.email')}</label>
            <input className="input" value={farm.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Globe size={14} /> {t('profile.website')}</label>
            <input className="input" value={farm.website} onChange={e => set('website', e.target.value)} />
          </div>
        </div>
        <div className="mt-5">
          <label className="label">{t('profile.social_media')}</label>
          <input className="input" value={farm.social_media} onChange={e => set('social_media', e.target.value)} />
        </div>

        {message && (
          <div className={`mt-5 text-sm px-4 py-3 rounded-xl border flex items-center gap-2 ${
            message.startsWith('Gagal') ? 'bg-error-50 text-error-700 border-error-100' : 'bg-primary-50 text-primary-700 border-primary-100'
          }`}>
            <CheckCircle size={16} className={message.startsWith('Gagal') ? 'text-error-500' : 'text-primary-500'} />
            {message}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3 pt-4 border-t border-neutral-100">
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-2.5">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t('common.save')}
          </button>
          {saving && <span className="text-sm text-neutral-400">Menyimpan...</span>}
        </div>
      </div>
    </div>
  );
}
