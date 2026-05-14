import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Shield, BarChart3, Wheat, Heart, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

export function LoginPage() {
  const { login } = useAuth();
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      navigate('/');
    } else {
      setError(t('login.error'));
    }
  };

  const demoLogins = [
    { label: t('role.owner'), email: 'budi@farm.id', password: 'owner123' },
    { label: t('role.manager'), email: 'dewi@farm.id', password: 'manager123' },
    { label: t('role.worker'), email: 'andi@farm.id', password: 'worker123' },
  ];

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

            <h2 className="login-form-title">{t('login.title')}</h2>
            <p className="login-form-subtitle">{t('login.subtitle')}</p>

            <form onSubmit={handleSubmit} className="login-form">
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
                    autoComplete="current-password"
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

              {error && (
                <div className="bg-error-50 text-error-700 text-sm px-4 py-3 rounded-xl border border-error-100 animate-slide-in">
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
                    <LogIn size={18} />
                    {t('login.signin')}
                  </span>
                )}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="login-demo-section">
              <p className="login-demo-label">{t('login.demo.title')}</p>
              <div className="login-demo-grid">
                {demoLogins.map(demo => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => { setEmail(demo.email); setPassword(demo.password); }}
                    className="login-demo-btn"
                  >
                    <div className="login-demo-avatar">
                      <span className="login-demo-avatar-text">{demo.label.charAt(0)}</span>
                    </div>
                    <p className="login-demo-name">{demo.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <p className="login-beta">{t('login.beta')}</p>

            <div className="mt-6 pt-4 border-t border-neutral-100">
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
