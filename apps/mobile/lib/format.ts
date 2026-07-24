const MONTHS_SV = [
  'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
];

// 'YYYY-MM-DD' -> '22 jul'
export function formatMatchDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_SV[m - 1]}`;
}

const WEEKDAYS_SV = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
const startOfDay = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());

// 'YYYY-MM-DD' -> 'Idag' / 'Imorgon' / 'Torsdag' (this week) / '22 jul' (further out).
export function relativeMatchDate(iso: string, now = new Date()): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const target = startOfDay(new Date(y, m - 1, d));
  const days = Math.round((target.getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (days === 0) return 'Idag';
  if (days === 1) return 'Imorgon';
  if (days > 1 && days < 7) return WEEKDAYS_SV[target.getDay()].replace(/^./, (c) => c.toUpperCase());
  return `${d} ${MONTHS_SV[m - 1]}`;
}
