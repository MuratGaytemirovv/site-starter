// Cookie consent: remembers the choice in localStorage (strictly necessary,
// sets no cookie) and only creates third-party embeds after a "yes".
//
// New category (e.g. analytics): add it to Categories + DEFAULTS, add a toggle
// in CookieBanner.astro (data-consent-toggle="analytics"), load the script in a
// 'site:consent' listener when detail.analytics is true, and bump VERSION so
// visitors choose again.

const KEY = 'site-consent';
const VERSION = 1;

type Categories = { media: boolean };
export type Consent = Categories & { v: number; ts: number };

const DEFAULTS: Categories = { media: false };

export function readConsent(): Consent | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return parsed && parsed.v === VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: Partial<Categories>): Consent {
  const consent: Consent = { ...DEFAULTS, ...choice, v: VERSION, ts: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(consent));
  } catch {
    // Private mode / blocked storage: the choice holds for this page only.
  }
  applyConsent(consent);
  document.dispatchEvent(new CustomEvent<Consent>('site:consent', { detail: consent }));
  return consent;
}

// Each [data-consent-media] block holds a placeholder and the iframe details
// in data attributes; the iframe only exists after consent.
export function applyConsent(consent: Consent | null) {
  document.querySelectorAll<HTMLElement>('[data-consent-media]').forEach((el) => {
    const placeholder = el.querySelector<HTMLElement>('[data-consent-placeholder]');
    const existing = el.querySelector('iframe');

    if (consent?.media) {
      if (existing) return;
      const iframe = document.createElement('iframe');
      iframe.src = el.dataset.src ?? '';
      iframe.title = el.dataset.title ?? '';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.className = 'absolute inset-0 h-full w-full';
      el.append(iframe);
      if (placeholder) placeholder.hidden = true;
    } else {
      existing?.remove();
      if (placeholder) placeholder.hidden = false;
    }
  });
}
