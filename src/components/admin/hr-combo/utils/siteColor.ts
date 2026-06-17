/**
 * Returns Combo-style shift color class based on the site name.
 * Cugnaux → corail "Black", Toulouse → beige "BLACKPEARL TOULOUSE",
 * Foodtruck → vert menthe "BLACK FOODTRUCK".
 */
export function getShiftClass(siteName: string | undefined | null): string {
  if (!siteName) return 'combo-shift-default';
  const n = siteName.toLowerCase();
  if (n.includes('cugnaux')) return 'combo-shift-cugnaux';
  if (n.includes('toulouse')) return 'combo-shift-toulouse';
  if (n.includes('foodtruck') || n.includes('food truck')) return 'combo-shift-foodtruck';
  return 'combo-shift-default';
}

/**
 * Label affiché dans le bloc shift (style Combo).
 * Cugnaux → "Black" (siège), Toulouse → "BLACKPEARL TOULOUSE",
 * Foodtruck → "BLACK FOODTRUCK".
 */
export function getShiftLabel(siteName: string | undefined | null): string {
  if (!siteName) return '—';
  const n = siteName.toLowerCase();
  if (n.includes('cugnaux')) return 'Black';
  if (n.includes('toulouse')) return 'BLACKPEARL TOULOUSE';
  if (n.includes('foodtruck') || n.includes('food truck')) return 'BLACK FOODTRUCK';
  return siteName;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`;
}

export function avatarColor(seed: string): string {
  const palette = [
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',
    'bg-emerald-100 text-emerald-700',
    'bg-sky-100 text-sky-700',
    'bg-violet-100 text-violet-700',
    'bg-orange-100 text-orange-700',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function durationHours(start: string, end: string, breakMin = 0): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm) - (breakMin || 0);
  return Math.max(0, mins) / 60;
}

export function formatHM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}
