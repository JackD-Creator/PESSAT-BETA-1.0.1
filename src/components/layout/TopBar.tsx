import { useEffect, useState } from 'react';
import { Bell, Menu, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAlerts } from '../../lib/db';

interface TopBarProps {
  onMenuToggle: () => void;
  title?: string;
}

export function TopBar({ onMenuToggle, title }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [unread, setUnread] = useState(0);
  const [critical, setCritical] = useState(0);

  useEffect(() => {
    getAlerts(user?.id).then(alerts => {
      setUnread(alerts.filter(a => !a.is_read).length);
      setCritical(alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length);
    });
  }, []);

  return (
    <header className="h-14 bg-white/90 backdrop-blur-xl border-b border-neutral-100/80 shadow-sm px-4 flex items-center gap-4 flex-shrink-0 sticky top-0 z-30">
      <button onClick={onMenuToggle} className="lg:hidden btn-ghost p-2 rounded-lg">
        <Menu size={20} />
      </button>

      {title && <h1 className="font-semibold text-neutral-800 text-base hidden sm:block">{title}</h1>}

      <div className="flex-1" />

      {critical > 0 && (
        <Link to="/alerts" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-error-50 text-error-700 rounded-lg text-xs font-semibold hover:bg-error-100 transition-colors">
          <span className="w-1.5 h-1.5 bg-error-500 rounded-full animate-pulse-soft" />
          {critical} {t('severity.critical')}
        </Link>
      )}

      <Link to="/alerts" className="relative btn-ghost p-2 rounded-lg">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-error-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>

      <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-emerald-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-semibold flex-shrink-0 shadow-sm">
        {user?.full_name.charAt(0)}
      </div>

      <button
        onClick={async () => { await logout(); navigate('/login'); }}
        className="btn-ghost p-2 rounded-lg text-neutral-400 hover:text-error-600 transition-colors"
        title={t('nav.logout')}
      >
        <LogOut size={20} />
      </button>
    </header>
  );
}
