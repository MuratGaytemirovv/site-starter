// One table of every page on the site. Pages, the language switcher,
// hreflang links and the sitemap are all built from it, so they can't drift
// apart. The main language lives at the root (/dienst-1), other languages
// under their code (/fr/service-1).
import { getRegions, getServices } from './collections';
import { defaultLang, facts, getContent } from './site';
import type { Lang, SectionId } from './schema';
import { ui } from '../i18n/ui';

export type PageKind = 'home' | 'service' | 'region' | 'privacy' | 'cookies';

export type PageRoute = {
  path: string;
  lang: Lang;
  kind: PageKind;
  // Same key in every language = translations of one page (hreflang).
  key: string;
  // Date of the last real content change, for the sitemap.
  updated?: string;
};

const prefix = (lang: Lang) => (lang === defaultLang ? '' : `/${lang}`);

export const homePath = (lang: Lang) => `${prefix(lang)}/`;
export const sectionHref = (lang: Lang, id: SectionId) => `${homePath(lang)}#${ui(lang).sections[id].anchor}`;
export const servicePath = (lang: Lang, slug: string) => `${prefix(lang)}/${slug}`;
export const regionPath = (lang: Lang, slug: string) => `${prefix(lang)}/${ui(lang).routes.region}/${slug}`;
export const legalPath = (lang: Lang, kind: 'privacy' | 'cookies') => `${prefix(lang)}/${ui(lang).routes[kind]}`;

let cache: Promise<PageRoute[]> | undefined;

export function allRoutes(): Promise<PageRoute[]> {
  cache ??= buildRoutes();
  return cache;
}

async function buildRoutes(): Promise<PageRoute[]> {
  const routes: PageRoute[] = [];
  for (const lang of facts.languages) {
    routes.push({ path: homePath(lang), lang, kind: 'home', key: 'home', updated: getContent(lang).meta.updated });
    for (const s of await getServices(lang)) {
      routes.push({ path: servicePath(lang, s.slug), lang, kind: 'service', key: s.key, updated: s.updated });
    }
    for (const r of await getRegions(lang)) {
      if (r.hasPage) routes.push({ path: regionPath(lang, r.slug), lang, kind: 'region', key: r.key, updated: r.updated });
    }
    routes.push({ path: legalPath(lang, 'privacy'), lang, kind: 'privacy', key: 'privacy' });
    routes.push({ path: legalPath(lang, 'cookies'), lang, kind: 'cookies', key: 'cookies' });
  }

  const seen = new Map<string, PageRoute>();
  for (const r of routes) {
    const clash = seen.get(r.path);
    if (clash) {
      throw new Error(`Two pages want the URL ${r.path}: ${clash.kind} "${clash.key}" and ${r.kind} "${r.key}" — give one of them another slug`);
    }
    seen.set(r.path, r);
  }
  return routes;
}

// The same page in every language that has it.
export async function alternatesOf(route: Pick<PageRoute, 'kind' | 'key'>): Promise<{ lang: Lang; path: string }[]> {
  return (await allRoutes())
    .filter((r) => r.kind === route.kind && r.key === route.key)
    .map((r) => ({ lang: r.lang, path: r.path }));
}
