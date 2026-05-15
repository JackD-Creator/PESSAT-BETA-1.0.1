import { useState, useEffect } from 'react';
import { Building2, Save, Loader2 } from 'lucide-react';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import type { FarmProfile } from '../types';

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
      setMessage(t('profile.save.error') + error.message);
    } else {
      setMessage(t('profile.save.success'));
    }
    setSaving(false);
  };

  const set = (k: keyof FarmProfile, v: string) => setFarm(p => p ? { ...p, [k]: v } : p);

  if (loading) return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">{t('profile.title')}</h1>
          <p className="text-sm text-neutral-500">{t('profile.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-lg">
          <Building2 size={16} />
          {user?.full_name}
        </div>
      </div>

      {!farm ? (
        <div className="text-center py-16 text-neutral-400">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t('profile.no_data')}</p>
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('profile.farm_name')}</label>
              <input className="input" value={farm.farm_name} onChange={e => set('farm_name', e.target.value)} />
            </div>
            <div>
              <label className="label">{t('profile.owner_name')}</label>
              <input className="input" value={farm.owner_name} onChange={e => set('owner_name', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">{t('profile.address')}</label>
            <textarea className="input" rows={2} value={farm.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('profile.scale')}</label>
              <select className="input" value={farm.farm_scale} onChange={e => set('farm_scale', e.target.value)}>
                <option value="kecil">{t('profile.scale.small')}</option>
                <option value="sedang">{t('profile.scale.medium')}</option>
                <option value="besar">{t('profile.scale.large')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('profile.phone')}</label>
              <input className="input" value={farm.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('profile.email')}</label>
              <input className="input" value={farm.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="label">{t('profile.website')}</label>
              <input className="input" value={farm.website} onChange={e => set('website', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">{t('profile.social_media')}</label>
            <input className="input" value={farm.social_media} onChange={e => set('social_media', e.target.value)} />
          </div>

          {message && (
            <div className={`text-sm px-4 py-3 rounded-xl border ${message === t('profile.save.success') ? 'bg-primary-50 text-primary-700 border-primary-100' : 'bg-error-50 text-error-700 border-error-100'}`}>
              {message}
            </div>
          )}

          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t('common.save')}
          </button>
        </div>
      )}
    </div>
  );
}