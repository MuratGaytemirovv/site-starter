// Collection helpers: items of one language, sorted, with their URL slug.
import { getCollection } from 'astro:content';
import type { Lang } from './schema';

// Entry ids look like "nl/dienst-1": language folder + file name.
const inLang = (lang: Lang) => (entry: { id: string }) => entry.id.startsWith(`${lang}/`);
const fileName = (id: string) => id.slice(id.indexOf('/') + 1);
const byOrder = (a: { data: { order: number } }, b: { data: { order: number } }) => a.data.order - b.data.order;

// Read each collection once per build: every page asks for them, and an empty
// collection would otherwise log Astro's "empty collection" warning per page.
const cache = new Map<string, Promise<unknown>>();
function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) cache.set(key, load());
  return cache.get(key) as Promise<T>;
}

export function getServices(lang: Lang) {
  return once(`services/${lang}`, async () =>
    (await getCollection('services', inLang(lang))).sort(byOrder).map((entry) => ({
      ...entry.data,
      key: fileName(entry.id),
      slug: entry.data.slug ?? fileName(entry.id),
    })),
  );
}

export function getRegions(lang: Lang) {
  return once(`regions/${lang}`, async () =>
    (await getCollection('regions', inLang(lang))).sort(byOrder).map((entry) => ({
      ...entry.data,
      key: fileName(entry.id),
      slug: entry.data.slug ?? fileName(entry.id),
      hasPage: entry.data.body.length > 0,
    })),
  );
}

export function getGallery(lang: Lang) {
  return once(`gallery/${lang}`, async () =>
    (await getCollection('gallery', inLang(lang))).sort(byOrder).map((entry) => entry.data),
  );
}

export function getReviews() {
  return once('reviews', async () => (await getCollection('reviews')).sort(byOrder).map((entry) => entry.data));
}

export type Service = Awaited<ReturnType<typeof getServices>>[number];
export type Region = Awaited<ReturnType<typeof getRegions>>[number];
