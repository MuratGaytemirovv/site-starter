// Collection helpers: items of one language, sorted, with their URL slug.
import { getCollection } from 'astro:content';
import type { Lang } from './schema';

// Entry ids look like "nl/dienst-1": language folder + file name.
const inLang = (lang: Lang) => (entry: { id: string }) => entry.id.startsWith(`${lang}/`);
const fileName = (id: string) => id.slice(id.indexOf('/') + 1);
const byOrder = (a: { data: { order: number } }, b: { data: { order: number } }) => a.data.order - b.data.order;

export async function getServices(lang: Lang) {
  return (await getCollection('services', inLang(lang))).sort(byOrder).map((entry) => ({
    ...entry.data,
    key: fileName(entry.id),
    slug: entry.data.slug ?? fileName(entry.id),
  }));
}

export async function getRegions(lang: Lang) {
  return (await getCollection('regions', inLang(lang))).sort(byOrder).map((entry) => ({
    ...entry.data,
    key: fileName(entry.id),
    slug: entry.data.slug ?? fileName(entry.id),
    hasPage: entry.data.body.length > 0,
  }));
}

export async function getGallery(lang: Lang) {
  return (await getCollection('gallery', inLang(lang))).sort(byOrder).map((entry) => entry.data);
}

export async function getReviews() {
  return (await getCollection('reviews')).sort(byOrder).map((entry) => entry.data);
}

export type Service = Awaited<ReturnType<typeof getServices>>[number];
export type Region = Awaited<ReturnType<typeof getRegions>>[number];
