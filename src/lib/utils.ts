export function formatCurrency(n: number): string {
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1)}jt`;
  if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}rb`;
  return `Rp ${n.toFixed(0)}`;
}

export function formatDateLocale(d: string | undefined | null, locale = 'id-ID') {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

export function formatDateShort(d: string | undefined | null, locale = 'id-ID') {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short' }); }
  catch { return d; }
}

export function formatNumberLocale(n: number, locale = 'id-ID') {
  return n.toLocaleString(locale);
}
