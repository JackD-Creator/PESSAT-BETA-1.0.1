import { useTranslation } from '../../contexts/LanguageContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'earth' | 'orange';
  size?: 'sm' | 'md';
}

const variantMap = {
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-neutral-100 text-neutral-600',
  earth: 'bg-earth-100 text-earth-700',
  orange: 'bg-orange-100 text-orange-700',
};

export function Badge({ children, variant = 'gray', size = 'md' }: BadgeProps) {
  const sz = size === 'sm' ? 'px-1.5 py-0 text-[10px]' : 'px-2.5 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${sz} ${variantMap[variant]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, { labelKey: string; variant: BadgeProps['variant'] }> = {
    healthy: { labelKey: 'status.healthy', variant: 'green' },
    sick: { labelKey: 'status.sick', variant: 'red' },
    pregnant: { labelKey: 'status.pregnant', variant: 'earth' },
    lactating: { labelKey: 'status.lactating', variant: 'blue' },
    dry: { labelKey: 'status.dry', variant: 'yellow' },
    culled: { labelKey: 'status.culled', variant: 'orange' },
    sold: { labelKey: 'status.sold', variant: 'gray' },
    dead: { labelKey: 'status.dead', variant: 'gray' },
  };
  const cfg = map[status] || { labelKey: status, variant: 'gray' as const };
  return <Badge variant={cfg.variant}>{t(cfg.labelKey)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const { t } = useTranslation();
  const map: Record<string, { labelKey: string; variant: BadgeProps['variant'] }> = {
    low: { labelKey: 'priority.low', variant: 'gray' },
    medium: { labelKey: 'priority.medium', variant: 'blue' },
    high: { labelKey: 'priority.high', variant: 'yellow' },
    urgent: { labelKey: 'priority.urgent', variant: 'red' },
  };
  const cfg = map[priority] || { labelKey: priority, variant: 'gray' as const };
  return <Badge variant={cfg.variant}>{t(cfg.labelKey)}</Badge>;
}

export function SpeciesBadge({ species }: { species: string }) {
  const { t } = useTranslation();
  const map: Record<string, { labelKey: string; variant: BadgeProps['variant'] }> = {
    cattle: { labelKey: 'species.cattle', variant: 'earth' },
    sheep: { labelKey: 'species.sheep', variant: 'blue' },
    goat: { labelKey: 'species.goat', variant: 'green' },
  };
  const cfg = map[species] || { labelKey: species, variant: 'gray' as const };
  return <Badge variant={cfg.variant}>{t(cfg.labelKey)}</Badge>;
}

export function SeverityBadge({ severity }: { severity: string }) {
  const { t } = useTranslation();
  const map: Record<string, { labelKey: string; variant: BadgeProps['variant'] }> = {
    info: { labelKey: 'severity.info', variant: 'blue' },
    warning: { labelKey: 'severity.warning', variant: 'yellow' },
    critical: { labelKey: 'severity.critical', variant: 'red' },
  };
  const cfg = map[severity] || { labelKey: severity, variant: 'gray' as const };
  return <Badge variant={cfg.variant}>{t(cfg.labelKey)}</Badge>;
}
