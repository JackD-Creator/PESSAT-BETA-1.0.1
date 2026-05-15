import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Beef, Heart, Wheat, DollarSign, Milk, CheckSquare, Bell,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock,
  MapPin, ArrowRight, Syringe, Baby,
  ChevronRight, BarChart3,
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { PriorityBadge } from '../components/ui/Badge';
import {
  getDailyProduction, getFinancialTransactions,
  getLocations, getBreedingEvents, getVaccinations,
  getFeedInventory, getTasks, getAlerts,
  getAnimals,
} from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

function formatCurrency(n: number) {
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1)}jt`;
  if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}rb`;
  return `Rp ${n.toFixed(0)}`;
}

function MiniChart({ data, color = '#10b981' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 40;
  const w = 200;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getGreeting(t: (key: string) => string) {
  const h = new Date().getHours();
  if (h < 11) return t('greeting.morning');
  if (h < 15) return t('greeting.afternoon');
  if (h < 18) return t('greeting.evening');
  return t('greeting.night');
}

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

const todayStr = new Date().toISOString().split('T')[0];
const todayObj = new Date();

export function DashboardPage() {
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const locale = lang === 'id' ? 'id-ID' : 'en-US';
  const dateStr = todayObj.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const [animals, setAnimals] = useState<any[]>([]);
  const [production, setProduction] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [breedingEvents, setBreedingEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [feedInventory, setFeedInventory] = useState<any[]>([]);

  useEffect(() => {
    getAnimals().then(setAnimals);
    getDailyProduction(14).then(d => setProduction(d));
    getFinancialTransactions().then(setTransactions);
    getLocations().then(setLocations);
    getVaccinations().then(setVaccinations);
    getBreedingEvents().then(setBreedingEvents);
    getTasks().then(setTasks);
    getAlerts().then(setAlerts);
    getFeedInventory().then(setFeedInventory);
  }, []);

  const cattleCount = animals.filter(a => a.species === 'cattle').length;
  const sheepCount = animals.filter(a => a.species === 'sheep').length;
  const goatCount = animals.filter(a => a.species === 'goat').length;
  const totalAnimals = animals.length;
  const healthyCount = animals.filter(a => a.status === 'healthy').length;
  const sickCount = animals.filter(a => a.status === 'sick').length;
  const pregnantCount = animals.filter(a => a.status === 'pregnant').length;
  const lactatingCount = animals.filter(a => a.status === 'lactating').length;
  const dryCount = animals.filter(a => a.status === 'dry').length;
  const avgMilkToday = production[0]?.quantity || 0;

  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.transaction_date?.startsWith(todayStr.slice(0, 7)))
    .reduce((s: number, t: any) => s + t.amount, 0);
  const monthlyExpense = transactions
    .filter(t => t.type === 'expense' && t.transaction_date?.startsWith(todayStr.slice(0, 7)))
    .reduce((s: number, t: any) => s + t.amount, 0);

  const milkData = useMemo(() =>
    production.slice(0, 7).map((d: any) => d.quantity).reverse(), [production]
  );

  const upcomingVaccinations = useMemo(() =>
    vaccinations.filter((v: any) => v.next_due_date).filter((v: any) => {
      const days = Math.ceil((new Date(v.next_due_date).getTime() - todayObj.getTime()) / 86400000);
      return days <= 7 && days >= 0;
    }), [vaccinations]
  );

  const upcomingBirths = useMemo(() =>
    breedingEvents.filter((e: any) => e.event_type === 'insemination' && e.expected_due_date).filter((e: any) => {
      const days = Math.ceil((new Date(e.expected_due_date).getTime() - todayObj.getTime()) / 86400000);
      return days <= 30 && days >= 0;
    }), [breedingEvents]
  );

  const todayTasks = useMemo(() =>
    tasks.filter((t: any) => t.status !== 'completed' && t.status !== 'cancelled' && t.due_date && t.due_date <= todayStr), [tasks]
  );

  const totalIncome = transactions
    .filter((t: any) => t.type === 'income' && t.cash_flow === 'cash_in')
    .reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t: any) => t.type === 'expense' && t.cash_flow !== 'non_cash')
    .reduce((s: number, t: any) => s + t.amount, 0);

  const unreadAlerts = alerts.filter((a: any) => !a.is_read).length;
  const criticalAlerts = alerts.filter((a: any) => a.severity === 'critical' && !a.is_resolved).length;

  const lowStockCount = feedInventory.filter((f: any) => f.quantity_on_hand < f.min_threshold).length;

  const stats = {
    totalAnimals, cattleCount, sheepCount, goatCount,
    healthyCount, sickCount, pregnantCount, lactatingCount, dryCount,
    totalIncome, totalExpense,
    netProfit: totalIncome - totalExpense,
    avgMilkToday, unreadAlerts, criticalAlerts, lowStockCount,
    totalFeedValue: feedInventory.reduce((s: number, f: any) => s + f.total_cost, 0),
    totalMedValue: 0,
    totalInventoryValue: feedInventory.reduce((s: number, f: any) => s + f.total_cost, 0),
    pendingTasks: tasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length,
    overdueTasks: tasks.filter((t: any) => t.due_date && new Date(t.due_date) < todayObj && t.status !== 'completed' && t.status !== 'cancelled').length,
  };

  const quickActions = [
    {
      key: 'add-livestock', icon: <Beef size={20} />, label: t('dashboard.add.livestock'), to: '/livestock/new',
      bgColor: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'record-health', icon: <Heart size={20} />, label: t('dashboard.record.health'), to: '/health',
      bgColor: 'bg-rose-50 text-rose-600',
    },
    {
      key: 'record-production', icon: <Milk size={20} />, label: t('dashboard.record.production'), to: '/production',
      bgColor: 'bg-blue-50 text-blue-600',
    },
    {
      key: 'view-reports', icon: <BarChart3 size={20} />, label: t('dashboard.view.reports'), to: '/finance/reports',
      bgColor: 'bg-amber-50 text-amber-600',
    },
  ];

  const otherCount = stats.totalAnimals - stats.healthyCount - stats.sickCount - stats.pregnantCount - stats.lactatingCount - stats.dryCount;

  return (
    <div className="page-container">
      {/* Welcome Hero */}
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
              {getGreeting(t)}, {user?.full_name.split(' ')[0]}!
            </h1>
            <p className="text-emerald-100/70 text-sm md:text-base mt-1.5 max-w-xl font-medium">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {stats.criticalAlerts > 0 && (
              <Link to="/alerts" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur-md text-white rounded-xl text-sm font-bold hover:bg-white/25 transition-all duration-200 border border-white/10 shadow-lg">
                <AlertTriangle size={16} />
                {stats.criticalAlerts} {t('severity.critical')}
              </Link>
            )}
          </div>
        </div>

        {/* Hero Stats */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 md:mt-8">
          {[
            { label: t('dashboard.total.livestock'), value: stats.totalAnimals, icon: <Beef size={16} /> },
            { label: t('dashboard.today.production'), value: `${stats.avgMilkToday}L`, icon: <Milk size={16} /> },
            { label: t('dashboard.monthly.revenue'), value: formatCurrency(monthlyIncome), icon: <TrendingUp size={16} /> },
            { label: t('dashboard.active.alerts'), value: stats.unreadAlerts, icon: <Bell size={16} /> },
          ].map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 md:p-4 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300 cursor-pointer group"
              onClick={() => {
                const paths = ['/livestock', '/production', '/finance/transactions', '/alerts'];
                navigate(paths[i]);
              }}
            >
              <div className="flex items-center gap-2 text-emerald-200/70 text-[11px] md:text-xs font-semibold uppercase tracking-wider mb-1.5">
                {item.icon} {item.label}
              </div>
              <p className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white group-hover:scale-105 transition-transform duration-200 origin-left">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-[0.15em] mb-3 md:mb-4">{t('dashboard.quick.actions')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {quickActions.map(action => (
            <button
              key={action.key}
              onClick={() => navigate(action.to)}
              className="group relative flex items-center gap-3 px-4 py-3.5 md:py-4 rounded-2xl border border-neutral-100 bg-white hover:border-neutral-200 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 text-neutral-700 hover:text-neutral-900"
            >
              <div className={`p-2.5 md:p-3 rounded-xl ${action.bgColor} transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg`}>
                {action.icon}
              </div>
              <span className="text-xs md:text-sm font-semibold">{action.label}</span>
              <ChevronRight size={14} className="ml-auto text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard title={t('dashboard.total.livestock')} value={stats.totalAnimals}
          subtitle={`${stats.cattleCount} ${t('species.cattle')} \u00B7 ${stats.sheepCount} ${t('species.sheep')} \u00B7 ${stats.goatCount} ${t('species.goat')}`}
          icon={<Beef size={22} className="text-emerald-600" />} iconBg="bg-emerald-50"
          onClick={() => navigate('/livestock')} />
        <StatCard title={t('dashboard.today.production')} value={`${stats.avgMilkToday} L`}
          subtitle={t('dashboard.production.subtitle')}
          icon={<Milk size={22} className="text-blue-600" />} iconBg="bg-blue-50"
          trend={{ value: 3.2, label: t('dashboard.vs.yesterday') }}
          onClick={() => navigate('/production')} />
        <StatCard title={t('dashboard.monthly.revenue')} value={formatCurrency(monthlyIncome)}
          subtitle={t('dashboard.revenue.subtitle')}
          icon={<TrendingUp size={22} className="text-emerald-600" />} iconBg="bg-emerald-50"
          onClick={() => navigate('/finance/transactions')} />
        <StatCard title={t('dashboard.active.alerts')} value={stats.unreadAlerts}
          subtitle={`${stats.criticalAlerts} ${t('severity.critical')} \u00B7 ${stats.lowStockCount} ${t('dashboard.low.stock.text')}`}
          icon={<Bell size={22} className="text-rose-600" />} iconBg="bg-rose-50"
          onClick={() => navigate('/alerts')} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left - 2/3 */}
        <div className="xl:col-span-2 space-y-6">

          {/* Population */}
          <div className="card p-5 md:p-6 hover:shadow-card-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base md:text-lg font-bold text-neutral-800 flex items-center gap-2">
                <Beef size={18} className="text-emerald-600" />
                {t('dashboard.population.title')}
              </h2>
              <Link to="/livestock" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                {t('view.all')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 md:mb-5">
              {[
                { label: t('species.cattle'), count: stats.cattleCount, from: 'from-emerald-500', to: 'to-emerald-600', text: 'text-white' },
                { label: t('species.sheep'), count: stats.sheepCount, from: 'from-blue-500', to: 'to-blue-600', text: 'text-white' },
                { label: t('species.goat'), count: stats.goatCount, from: 'from-amber-500', to: 'to-amber-600', text: 'text-white' },
                { label: t('dashboard.total'), count: stats.totalAnimals, from: 'from-violet-500', to: 'to-violet-600', text: 'text-white' },
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.from} ${s.to} rounded-2xl p-4 md:p-5 text-center hover:scale-[1.03] hover:shadow-lg transition-all duration-300 cursor-pointer ${s.text}`}>
                  <p className="text-2xl md:text-3xl font-extrabold drop-shadow-sm">{s.count}</p>
                  <p className="text-[11px] md:text-xs font-bold mt-1 opacity-90 uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-2.5">
              {[
                { label: t('status.healthy'), count: stats.healthyCount, bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                { label: t('status.sick'), count: stats.sickCount, bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
                { label: t('status.pregnant'), count: stats.pregnantCount, bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
                { label: t('status.lactating'), count: stats.lactatingCount, bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
                { label: t('status.dry'), count: stats.dryCount, bg: 'bg-stone-50', text: 'text-stone-700', dot: 'bg-stone-500' },
                { label: t('status.other'), count: Math.max(0, otherCount), bg: 'bg-neutral-50', text: 'text-neutral-600', dot: 'bg-neutral-400' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} ${s.text} rounded-xl p-2.5 md:p-3 text-center hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer`}>
                  <div className="flex justify-center mb-1">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  </div>
                  <p className="text-base md:text-lg font-extrabold">{s.count}</p>
                  <p className="text-[9px] md:text-[11px] font-bold mt-0.5 uppercase tracking-wider opacity-80">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Milk Trend */}
          <div className="card p-5 md:p-6 hover:shadow-card-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base md:text-lg font-bold text-neutral-800 flex items-center gap-2">
                <Milk size={18} className="text-blue-600" />
                {t('dashboard.milk.trend')}
              </h2>
              <Link to="/production" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                {t('dashboard.feed.details')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl px-4 py-2.5 shadow-lg shadow-blue-200">
                <span className="text-2xl md:text-3xl font-extrabold">{milkData[milkData.length - 1]}</span>
                <span className="text-base md:text-lg font-bold ml-1 opacity-90">L</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg mb-1">
                <TrendingUp size={14} />
                <span>+3.2% {t('dashboard.vs.yesterday')}</span>
              </div>
              <span className="text-xs md:text-sm text-neutral-400 font-semibold mb-1 ml-auto">
                {t('dashboard.avg.per.day').replace('{0}', String(Math.round(milkData.reduce((a, b) => a + b, 0) / milkData.length)))}
              </span>
            </div>
            <div className="relative bg-neutral-50/50 rounded-2xl p-3 md:p-4">
              <MiniChart data={milkData} color="#3b82f6" />
              <div className="flex justify-between mt-3">
                  {production.slice(0, 7).reverse().map((d: any, i: number) => (
                  <div key={i} className="text-center flex-1">
                    <p className="text-xs font-bold text-neutral-700">{d.quantity}</p>
                    <p className="text-[10px] font-semibold text-neutral-400 mt-0.5 uppercase tracking-wider">
                      {new Date(d.production_date).toLocaleDateString(locale, { weekday: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5 md:p-6 hover:shadow-card-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm md:text-base font-bold text-neutral-800 flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center"><Syringe size={14} className="text-blue-600" /></div>
                  {t('dashboard.upcoming.vaccinations')}
                </h3>
                <Link to="/vaccinations" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">{t('view.all')}</Link>
              </div>
              <div className="space-y-3">
                {upcomingVaccinations.slice(0, 3).map(v => (
                  <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-transparent hover:from-blue-50 transition-all duration-200 cursor-pointer">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><Syringe size={15} className="text-blue-600" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-800 truncate">{v.vaccine_name}</p>
                      <p className="text-xs text-neutral-400 font-medium">{v.animal_tag || v.herd_group_name}</p>
                    </div>
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-lg">{Math.ceil((new Date(v.next_due_date!).getTime() - todayObj.getTime()) / 86400000)}d</span>
                  </div>
                ))}
                {upcomingVaccinations.length === 0 && <p className="text-sm text-neutral-400 text-center py-4 font-medium">{t('no.upcoming')}</p>}
              </div>
            </div>

            <div className="card p-5 md:p-6 hover:shadow-card-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm md:text-base font-bold text-neutral-800 flex items-center gap-2">
                  <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center"><Baby size={14} className="text-amber-600" /></div>
                  {t('dashboard.upcoming.births')}
                </h3>
                <Link to="/breeding" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">{t('view.all')}</Link>
              </div>
              <div className="space-y-3">
                {upcomingBirths.slice(0, 3).map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-50/80 to-transparent hover:from-amber-50 transition-all duration-200 cursor-pointer">
                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0"><Baby size={15} className="text-amber-600" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-800 truncate">{e.animal_tag}</p>
                      <p className="text-xs text-neutral-400 font-medium">{t('dashboard.due')} {new Date(e.expected_due_date!).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <span className="text-xs font-extrabold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-lg">{Math.ceil((new Date(e.expected_due_date!).getTime() - todayObj.getTime()) / 86400000)}d</span>
                  </div>
                ))}
                {upcomingBirths.length === 0 && <p className="text-sm text-neutral-400 text-center py-4 font-medium">{t('dashboard.no.upcoming.births')}</p>}
              </div>
            </div>
          </div>

          {/* Finance */}
          {(user?.role === 'owner' || user?.role === 'manager') && (
            <div className="card p-5 md:p-6 hover:shadow-card-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base md:text-lg font-bold text-neutral-800 flex items-center gap-2">
                  <DollarSign size={18} className="text-emerald-600" />
                  {t('dashboard.finance.summary')}
                </h2>
                <Link to="/finance/reports" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                  {t('dashboard.reports')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1">{t('finance.income')}</p>
                  <p className="text-lg md:text-xl font-extrabold">{formatCurrency(monthlyIncome)}</p>
                  <div className="flex items-center gap-1 mt-1.5 text-xs font-bold text-emerald-100"><TrendingUp size={12} /> +8.2%</div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg shadow-red-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1">{t('finance.expenses')}</p>
                  <p className="text-lg md:text-xl font-extrabold">{formatCurrency(monthlyExpense)}</p>
                  <div className="flex items-center gap-1 mt-1.5 text-xs font-bold text-red-100"><TrendingDown size={12} /> -2.1%</div>
                </div>
                <div className={`bg-gradient-to-br rounded-2xl p-4 text-white shadow-lg ${monthlyIncome - monthlyExpense >= 0 ? 'from-emerald-500 to-emerald-600 shadow-emerald-200' : 'from-red-500 to-red-600 shadow-red-200'}`}>
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1">{t('finance.net.profit')}</p>
                  <p className="text-lg md:text-xl font-extrabold">{formatCurrency(monthlyIncome - monthlyExpense)}</p>
                  <div className={`flex items-center gap-1 mt-1.5 text-xs font-bold ${monthlyIncome - monthlyExpense >= 0 ? 'text-emerald-100' : 'text-red-100'}`}>
                    {monthlyIncome - monthlyExpense >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {monthlyIncome - monthlyExpense >= 0 ? '+5.1%' : '-5.1%'}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-[0.15em] mb-3">{t('finance.recent.transactions')}</p>
                <div className="space-y-1">
                  {transactions.slice(0, 5).map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                          {tx.type === 'income' ? <TrendingUp size={14} className="text-emerald-600" /> : <TrendingDown size={14} className="text-red-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-700">{tx.description || tx.category}</p>
                          <p className="text-xs text-neutral-400 font-medium">{new Date(tx.transaction_date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-extrabold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right - 1/3 */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="card p-5 md:p-6 hover:shadow-card-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm md:text-base font-bold text-neutral-800 flex items-center gap-2">
                <Bell size={18} className="text-rose-600" />
                {t('dashboard.active.alerts')}
              </h2>
              <Link to="/alerts" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                {t('view.all')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-3">
              {alerts.filter((a: any) => !a.is_resolved).slice(0, 5).map((alert: any) => (
                <div key={alert.id} className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  alert.severity === 'critical' ? 'bg-gradient-to-r from-red-50 to-red-50/50 border-red-200 hover:from-red-100 hover:to-red-50' :
                  alert.severity === 'warning' ? 'bg-gradient-to-r from-amber-50 to-amber-50/50 border-amber-200 hover:from-amber-100 hover:to-amber-50' :
                  'bg-gradient-to-r from-blue-50 to-blue-50/50 border-blue-200 hover:from-blue-100 hover:to-blue-50'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1 rounded-lg ${
                      alert.severity === 'critical' ? 'bg-red-100' :
                      alert.severity === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      <AlertTriangle size={14} className={
                        alert.severity === 'critical' ? 'text-red-600' :
                        alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-800 leading-tight">{alert.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed font-medium">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.filter((a: any) => !a.is_resolved).length === 0 && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><CheckCircle size={24} className="text-emerald-500" /></div>
                  <p className="text-sm font-bold text-neutral-600">{t('dashboard.no.alerts')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="card p-5 md:p-6 hover:shadow-card-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm md:text-base font-bold text-neutral-800 flex items-center gap-2">
                <CheckSquare size={18} className="text-emerald-600" />
                {t('dashboard.pending.tasks')}
              </h2>
              <Link to="/tasks" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                {t('view.all')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {todayTasks.slice(0, 5).map(task => {
                const overdue = task.due_date && task.due_date < '2026-05-14';
                return (
                  <div key={task.id} className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md ${
                    overdue ? 'border-red-200 bg-gradient-to-r from-red-50/80 to-transparent hover:from-red-100' :
                    'border-neutral-100 bg-neutral-50/50 hover:bg-neutral-100'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold leading-tight ${overdue ? 'text-red-800' : 'text-neutral-800'}`}>{task.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <PriorityBadge priority={task.priority} />
                          <span className="text-xs font-medium text-neutral-400">{task.assigned_to_name}</span>
                        </div>
                      </div>
                      {overdue && <div className="flex-shrink-0 mt-0.5 w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center"><Clock size={14} className="text-red-500" /></div>}
                    </div>
                  </div>
                );
              })}
              {todayTasks.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><CheckCircle size={24} className="text-emerald-500" /></div>
                  <p className="text-sm font-bold text-neutral-600">{t('dashboard.tasks.completed')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Feed */}
          <div className="card p-5 md:p-6 hover:shadow-card-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm md:text-base font-bold text-neutral-800 flex items-center gap-2">
                <Wheat size={18} className="text-amber-600" />
                {t('dashboard.low.stock')}
              </h2>
              <Link to="/feed-inventory" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                {t('dashboard.feed.details')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-3.5">
              {feedInventory.slice(0, 5).map((feed: any) => {
                const pct = Math.min(100, (feed.quantity_on_hand / (feed.min_threshold * 3)) * 100);
                const isLow = feed.quantity_on_hand < feed.min_threshold;
                return (
                  <div key={feed.id} className="group cursor-pointer">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-neutral-700 group-hover:text-neutral-900 transition-colors">{feed.feed_name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-extrabold ${isLow ? 'text-red-600' : 'text-neutral-500'}`}>{feed.quantity_on_hand} {feed.unit}</span>
                        {isLow && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-soft" />}
                      </div>
                    </div>
                    <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full rounded-full transition-all duration-500 group-hover:scale-y-110 ${
                        isLow ? 'bg-gradient-to-r from-red-500 to-rose-400' :
                        pct < 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                        'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      }`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Locations */}
          <div className="card p-5 md:p-6 hover:shadow-card-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm md:text-base font-bold text-neutral-800 flex items-center gap-2">
                <MapPin size={18} className="text-neutral-600" />
                {t('dashboard.location.status')}
              </h2>
              <Link to="/locations" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                {t('view.all')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {locations.filter((l: any) => l.type !== 'storage' && l.type !== 'office').map((loc: any) => {
                const pct = loc.capacity > 0 ? (loc.current_occupancy / loc.capacity) * 100 : 0;
                const isNearFull = pct > 85;
                return (
                  <div key={loc.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      loc.type === 'shed' ? 'bg-amber-50' :
                      loc.type === 'paddock' ? 'bg-emerald-50' :
                      loc.type === 'quarantine' ? 'bg-red-50' : 'bg-blue-50'
                    }`}>
                      <MapPin size={16} className={
                        loc.type === 'shed' ? 'text-amber-600' :
                        loc.type === 'paddock' ? 'text-emerald-600' :
                        loc.type === 'quarantine' ? 'text-red-600' : 'text-blue-600'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs md:text-sm font-bold text-neutral-700 truncate group-hover:text-neutral-900 transition-colors">{loc.name}</p>
                        <span className={`text-xs font-extrabold ${isNearFull ? 'text-amber-600' : 'text-neutral-500'}`}>{loc.current_occupancy}/{loc.capacity}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          isNearFull ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        }`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
