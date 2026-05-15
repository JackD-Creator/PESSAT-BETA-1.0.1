export function formatCurrency(n: number): string {
  return `Rp. ${n.toLocaleString('id-ID')},-`;
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
