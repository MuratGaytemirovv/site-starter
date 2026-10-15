// Opening hours for display: consecutive days collapse into a range
// ("ma – do 07:00–19:00"); labels come from the interface language.
import type { Facts } from './schema';
import type { UI } from '../i18n/ui';

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export function formatHours(hours: Facts['openingHours'], t: UI) {
  return hours.map((h) => {
    const idx = [...new Set(h.days)].map((d) => WEEK.indexOf(d)).sort((a, b) => a - b);
    const parts: string[] = [];
    for (let i = 0; i < idx.length; ) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;
      const from = t.days[WEEK[idx[i]]];
      const to = t.days[WEEK[idx[j]]];
      parts.push(j - i >= 2 ? `${from} – ${to}` : j > i ? `${from}, ${to}` : from);
      i = j + 1;
    }
    return { days: parts.join(', '), time: `${h.opens}–${h.closes}` };
  });
}
