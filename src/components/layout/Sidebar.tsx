import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Heart, Wheat, DollarSign,
  Milk, CheckSquare, Bell, LogOut, Building2,
  Users, MapPin, Package, ShoppingCart, ClipboardList, Beef,
  ClipboardSignature, Scale, Pill,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

interface NavItem {
  labelKey: string;
  to?: string;
  icon: React.ReactNode;
  roles?: string[];
  children?: NavItem[];
}

export function Sidebar(_props?: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const roleLabels: Record<string, string> = { owner: t('role.owner'), manager: t('role.manager'), worker: t('role.worker') };

  const navItems: NavItem[] = [
    { labelKey: 'nav.dashboard', to: '/', icon: <LayoutDashboard size={18} /> },
    {
      labelKey: 'nav.livestock', icon: <Beef size={18} />,
      children: [
        { labelKey: 'nav.livestock.list', to: '/livestock', icon: <ClipboardList size={16} /> },
        { labelKey: 'nav.livestock.groups', to: '/herd-groups', icon: <Users size={16} /> },
        { labelKey: 'nav.livestock.locations', to: '/locations', icon: <MapPin size={16} /> },
      ]
    },
    {
      labelKey: 'nav.health', icon: <Heart size={18} />,
      children: [
        { labelKey: 'nav.health.records', to: '/health', icon: <Heart size={16} /> },
        { labelKey: 'nav.health.vaccinations', to: '/vaccinations', icon: <Package size={16} /> },
        { labelKey: 'nav.health.breeding', to: '/breeding', icon: <Milk size={16} /> },
      ]
    },
    {
      labelKey: 'nav.feed', icon: <Wheat size={18} />,
      children: [
        { labelKey: 'nav.feed.stock', to: '/feed-inventory', icon: <Package size={16} /> },
        { labelKey: 'nav.feed.purchases', to: '/feed-purchases', icon: <ShoppingCart size={16} /> },
        { labelKey: 'nav.feed.formulas', to: '/feed-formulas', icon: <ClipboardList size={16} /> },
        { labelKey: 'nav.feed.nutrition', to: '/nutrition-requirements', icon: <ClipboardSignature size={16} /> },
      ]
    },
    {
      labelKey: 'nav.medicine', icon: <Pill size={18} />,
      children: [
        { labelKey: 'nav.medicine.inventory', to: '/medicine-inventory', icon: <Package size={16} /> },
      ]
    },
    {
      labelKey: 'nav.production', icon: <Milk size={18} />,
      children: [
        { labelKey: 'nav.production.daily', to: '/production', icon: <Milk size={16} /> },
        { labelKey: 'nav.production.sales', to: '/product-sales', icon: <ShoppingCart size={16} /> },
        { labelKey: 'nav.production.transactions', to: '/animal-transactions', icon: <DollarSign size={16} /> },
      ]
    },
    {
      labelKey: 'nav.finance', icon: <DollarSign size={18} />, roles: ['owner', 'manager'],
      children: [
        { labelKey: 'nav.finance.transactions', to: '/finance/transactions', icon: <ClipboardList size={16} /> },
        { labelKey: 'nav.finance.reports', to: '/finance/reports', icon: <DollarSign size={16} /> },
        { labelKey: 'nav.finance.expenses', to: '/finance/expenses', icon: <Package size={16} /> },
        { labelKey: 'nav.finance.adjustments', to: '/finance/adjustments', icon: <Scale size={16} /> },
      ]
    },
    { labelKey: 'nav.tasks', to: '/tasks', icon: <CheckSquare size={18} /> },
    { labelKey: 'nav.alerts', to: '/alerts', icon: <Bell size={18} /> },
    { labelKey: 'nav.users', to: '/users', icon: <Users size={18} />, roles: ['owner'] },
    { labelKey: 'nav.profile', to: '/profile', icon: <Building2 size={18} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-100">
      <div className="px-4 py-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <img src="/PESSATLOGO.png" alt="PESSAT" className="sidebar-logo" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(item => (
          <NavGroup key={item.to || item.labelKey} item={item} user={user} t={t} />
        ))}
      </nav>

      <div className="border-t border-neutral-100 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-emerald-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-semibold flex-shrink-0">
            {user?.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800 truncate">{user?.full_name}</p>
            <p className="text-xs text-neutral-400">{roleLabels[user?.role || ''] || user?.role}</p>
          </div>
        </div>
        <button onClick={() => { logout(); }} className="sidebar-link-inactive w-full text-error-600 hover:bg-error-50 hover:text-error-700">
          <LogOut size={16} />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
}

function NavGroup({ item, user, t, depth = 0 }: { item: NavItem; user: any; t: (key: string) => string; depth?: number }) {
  const location = useLocation();
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some(c => c.to && location.pathname.startsWith(c.to));
  });

  if (item.roles && user && !item.roles.includes(user.role)) return null;

  if (!item.children) {
    return (
      <NavLink
        to={item.to!}
        end={item.to === '/'}
        className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        <span className="flex-1">{t(item.labelKey)}</span>
      </NavLink>
    );
  }

  const hasActiveChild = item.children.some(c => c.to && location.pathname.startsWith(c.to));

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className={`sidebar-link-inactive w-full ${hasActiveChild ? 'text-primary-700 bg-primary-50/60' : ''}`}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        <span className="flex-1 text-left">{t(item.labelKey)}</span>
        <span className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>
          <ChevronRightIcon />
        </span>
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-primary-100 pl-3">
          {item.children.map(child => (
            <NavGroup key={child.to || child.labelKey} item={child} user={user} t={t} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
