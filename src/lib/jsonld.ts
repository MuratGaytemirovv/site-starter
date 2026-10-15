// schema.org structured data. Only real facts: fields that are still a
// placeholder or empty are dropped. No AggregateRating from our own site —
// self-served review markup risks a Google penalty.
import { facts, isPlaceholder } from './site';
import { homePath } from './routes';
import type { Lang } from './schema';

type Json = Record<string, unknown>;

// Drop empty values and anything still marked [ЗАПОЛНИТЬ], recursively.
function clean<T>(value: T): T | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return isPlaceholder(value) ? undefined : value;
  if (Array.isArray(value)) {
    const items = value.map(clean).filter((v) => v !== undefined);
    return (items.length ? items : undefined) as T | undefined;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Json)
      .map(([k, v]) => [k, clean(v)] as const)
      .filter(([, v]) => v !== undefined);
    // An object with only @type/@context left carries no information (an @id reference does).
    if (!entries.some(([k]) => k !== '@type' && k !== '@context')) return undefined;
    return Object.fromEntries(entries) as T;
  }
  return value;
}

const abs = (site: URL, path: string) => new URL(path, site).href;

export function localBusiness(site: URL, lang: Lang, opts: { description?: string; areaServed: string[]; image?: string }) {
  const digits = facts.phoneE164.replace(/[^\d+]/g, '');
  return clean({
    '@context': 'https://schema.org',
    '@type': facts.schemaType,
    '@id': abs(site, '/#business'),
    name: facts.name,
    legalName: facts.legalName,
    description: opts.description,
    url: abs(site, homePath(lang)),
    telephone: digits.length > 6 ? digits : undefined,
    email: facts.email.includes('@example.') ? undefined : facts.email,
    image: opts.image,
    vatID: facts.vat,
    foundingDate: facts.foundedYear ? String(facts.foundedYear) : undefined,
    address: facts.showAddress
      ? {
          '@type': 'PostalAddress',
          streetAddress: facts.address.street,
          postalCode: facts.address.postalCode,
          addressLocality: facts.address.city,
          addressRegion: facts.address.region,
          addressCountry: facts.address.country,
        }
      : { '@type': 'PostalAddress', addressRegion: facts.address.region, addressCountry: facts.address.country },
    geo: facts.geo ? { '@type': 'GeoCoordinates', latitude: facts.geo.lat, longitude: facts.geo.lng } : undefined,
    openingHoursSpecification: facts.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: opts.areaServed.map((name) => ({ '@type': 'City', name })),
    sameAs: [...Object.values(facts.social), facts.reviews.googleUrl].filter(Boolean),
  });
}

export function faqPage(items: { q: string; a: string }[]) {
  const real = items.filter((i) => !isPlaceholder(i.q) && !isPlaceholder(i.a));
  if (!real.length) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: real.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  };
}

export function breadcrumbList(site: URL, crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(site, c.path) })),
  };
}

export function service(site: URL, opts: { name: string; description: string; path: string; areaServed: string[] }) {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    url: abs(site, opts.path),
    provider: { '@id': abs(site, '/#business') },
    areaServed: opts.areaServed.map((name) => ({ '@type': 'City', name })),
  });
}
