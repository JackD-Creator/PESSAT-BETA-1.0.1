import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, UserPlus, Shield, BarChart3, Wheat, Heart, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole, FarmScale } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

export function LoginPage() {
  const { login, signUp } = useAuth();
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Registration extra fields
  const [role, setRole] = useState<UserRole>('owner');
  const [farmName, setFarmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [farmScale, setFarmScale] = useState<FarmScale>('kecil');
  const [farmPhone, setFarmPhone] = useState('');
  const [farmEmail, setFarmEmail] = useState('');
  const [farmWebsite, setFarmWebsite] = useState('');
  const [farmSocial, setFarmSocial] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register') {
      if (password !== confirmPass) {
        setError(t('register.error.password.match'));
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError(t('register.error.password.length'));
        setLoading(false);
        return;
      }
      const err = await signUp(email, password, fullName, 'owner', {
        farm_name: farmName,
        owner_name: ownerName,
        address: farmAddress,
        farm_scale: farmScale,
        phone: farmPhone,
        email: farmEmail,
        website: farmWebsite,
        social_media: farmSocial,
      });
      setLoading(false);
      if (err) {
        if (err.includes('rate_limit') || err.includes('rate limit') || err.includes('Rate limit'))
          setError(t('register.error.rate.limit'));
        else
          setError(err);
      } else {
        setMode('login');
        setSuccessMsg(t('register.success'));
      }
      return;
    }

    const err = await login(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        {/* Left - Brand Panel */}
        <div className="login-brand">
          <div className="login-brand-content">
            <img src="/PESSATLOGO.png" alt="PESSAT" className="login-brand-logo" />
            <div className="login-brand-features">
              {[
                { icon: Shield, key: 'login.brand.feature1' },
                { icon: Heart, key: 'login.brand.feature2' },
                { icon: Wheat, key: 'login.brand.feature3' },
                { icon: BarChart3, key: 'login.brand.feature4' },
              ].map(f => (
                <div key={f.key} className="login-brand-feature">
                  <f.icon size={14} />
                  <span>{t(f.key)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Form Panel */}
        <div className="login-form-panel">
          <div className="login-form-inner">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
                className="lang-switch-btn"
              >
                <Globe size={14} />
                {lang === 'id' ? t('lang.en') : t('lang.id')}
              </button>
            </div>

            {/* Mobile logo */}
            <div className="login-mobile-logo">
              <img src="/PESSATLOGO.png" alt="PESSAT" className="login-mobile-logo-img" />
            </div>

            <h2 className="login-form-title">
              {mode === 'login' ? t('login.title') : t('register.title')}
            </h2>
            <p className="login-form-subtitle">
              {mode === 'login' ? t('login.subtitle') : t('register.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="login-form">
              {mode === 'register' && (
                <div>
                  <label className="label">{t('register.fullname')}</label>
                  <input
                    type="text"
                    className="input"
                    placeholder={t('register.fullname.placeholder')}
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label className="label">{t('login.email')}</label>
                <input
                  type="email"
                  className="input"
                  placeholder="nama@farm.id"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="label">{t('login.password')}</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    onClick={() => setShowPass(v => !v)}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {mode === 'register' && (
                <div>
                  <label className="label">{t('register.confirm.password')}</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    required
                  />
                </div>
              )}

              {mode === 'register' && (
                <>
                  <hr className="my-3 border-neutral-200" />
                  <p className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">{t('register.farm.data')}</p>

                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-sm text-primary-700">
                    Registrasi ini untuk <strong>Pemilik Farm</strong>. Untuk mendaftarkan manajer/staf, login sebagai pemilik lalu buka <strong>Manajemen Pengguna</strong>.
                  </div>
                  <div>
                    <label className="label">{t('register.farm.name')}</label>
                    <input type="text" className="input" placeholder={t('register.farm.name.placeholder')} value={farmName} onChange={e => setFarmName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">{t('register.farm.owner')}</label>
                    <input type="text" className="input" placeholder={t('register.farm.owner.placeholder')} value={ownerName} onChange={e => setOwnerName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">{t('register.farm.address')}</label>
                    <textarea className="input" rows={2} placeholder={t('register.farm.address.placeholder')} value={farmAddress} onChange={e => setFarmAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">{t('register.farm.scale')}</label>
                    <select className="input" value={farmScale} onChange={e => setFarmScale(e.target.value as FarmScale)}>
                      <option value="kecil">{t('farm.scale.small')}</option>
                      <option value="sedang">{t('farm.scale.medium')}</option>
                      <option value="besar">{t('farm.scale.large')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('register.farm.phone')}</label>
                    <input type="tel" className="input" placeholder={t('register.farm.phone.placeholder')} value={farmPhone} onChange={e => setFarmPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">{t('register.farm.email')}</label>
                    <input type="email" className="input" placeholder={t('register.farm.email.placeholder')} value={farmEmail} onChange={e => setFarmEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">{t('register.farm.website')}</label>
                    <input type="url" className="input" placeholder={t('register.farm.website.placeholder')} value={farmWebsite} onChange={e => setFarmWebsite(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">{t('register.farm.social')}</label>
                    <input type="text" className="input" placeholder={t('register.farm.social.placeholder')} value={farmSocial} onChange={e => setFarmSocial(e.target.value)} />
                  </div>
                </>
              )}

              {successMsg && (
                <div className="text-sm px-4 py-3 rounded-xl border animate-slide-in bg-primary-50 text-primary-700 border-primary-100">
                  {successMsg}
                </div>
              )}
              {error && (
                <div className="text-sm px-4 py-3 rounded-xl border animate-slide-in bg-error-50 text-error-700 border-error-100">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="login-submit-btn">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('common.loading')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                    {mode === 'login' ? t('login.signin') : t('register.submit')}
                  </span>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); setSuccessMsg(''); }}
              >
                {mode === 'login' ? t('register.toggle.register') : t('register.toggle.login')}
              </button>
            </div>

            <p className="login-beta mt-4">{t('login.beta')}</p>

            <div className="mt-4 pt-4 border-t border-neutral-100">
              <div className="login-footer-text flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>{t('login.copyright')}</span>
                <div className="flex items-center gap-2">
                  <button>{t('login.terms')}</button>
                  <span>&middot;</span>
                  <button>{t('login.privacy')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
