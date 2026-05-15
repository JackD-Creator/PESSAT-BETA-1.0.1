import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const pageTitleKeys: Record<string, string> = {
  '/': 'page.dashboard',
  '/livestock': 'page.livestock',
  '/herd-groups': 'page.herd.groups',
  '/locations': 'page.locations',
  '/health': 'page.health',
  '/vaccinations': 'page.vaccinations',
  '/breeding': 'page.breeding',
  '/feed-inventory': 'page.feed.inventory',
  '/feed-purchases': 'page.feed.purchases',
  '/feed-formulas': 'page.feed.formulas',
  '/medicine-inventory': 'page.medicine.inventory',
  '/production': 'page.production',
  '/product-sales': 'page.product.sales',
  '/animal-transactions': 'page.animal.transactions',
  '/finance/transactions': 'page.finance.transactions',
  '/finance/reports': 'page.finance.reports',
  '/finance/expenses': 'page.finance.expenses',
  '/tasks': 'page.tasks',
  '/alerts': 'page.alerts',
  '/users': 'page.users',
  '/profile': 'page.profile',
};

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const titleKey = pageTitleKeys[location.pathname];
  const title = titleKey ? t(titleKey) : t('app.name');

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:w-64">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 w-64 h-full animate-slide-in">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuToggle={() => setSidebarOpen(v => !v)} title={title} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
          <footer className="px-4 md:px-6 lg:px-8 py-4 border-t border-neutral-100">
            <div className="login-footer-text flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>{t('login.copyright')}</span>
              <div className="flex items-center gap-3">
                <button>{t('login.terms')}</button>
                <span>&middot;</span>
                <button>{t('login.privacy')}</button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
