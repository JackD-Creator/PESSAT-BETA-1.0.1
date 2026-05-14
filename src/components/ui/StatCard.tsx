import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, subtitle, icon, iconBg = 'bg-emerald-50', trend, className = '', onClick }: StatCardProps) {
  const TrendIcon = trend ? (trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus) : null;
  const trendColor = trend ? (trend.value > 0 ? 'text-emerald-600' : trend.value < 0 ? 'text-red-600' : 'text-neutral-500') : '';
  const bgMap: Record<string, string> = {
    'bg-emerald-50': 'from-emerald-500/10',
    'bg-blue-50': 'from-blue-500/10',
    'bg-rose-50': 'from-rose-500/10',
    'bg-amber-50': 'from-amber-500/10',
    'bg-earth-50': 'from-amber-500/10',
    'bg-error-50': 'from-red-500/10',
    'bg-primary-50': 'from-emerald-500/10',
  };
  const gradientFrom = bgMap[iconBg || ''] || 'from-emerald-500/10';

  return (
    <div
      className={`relative overflow-hidden card p-5 md:p-6 ${onClick ? 'cursor-pointer hover:shadow-card-md hover:-translate-y-0.5 hover:border-emerald-200' : ''} transition-all duration-200 group ${className}`}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-[0.08em] truncate">{title}</p>
          <p className="text-xl md:text-2xl lg:text-3xl font-extrabold text-neutral-800 mt-1 leading-none">{value}</p>
          {subtitle && <p className="text-xs md:text-sm text-neutral-400 mt-1.5 font-medium">{subtitle}</p>}
          {trend && TrendIcon && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-extrabold ${trendColor}`}>
              <TrendIcon size={12} />
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${iconBg} p-2.5 md:p-3 rounded-2xl flex-shrink-0 group-hover:scale-110 group-hover:shadow-lg transition-all duration-200`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
