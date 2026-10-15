// Collections: one JSON file per item. Texts live in a language folder
// (services/nl/dienst-1.json); the same file name in another language folder
// is the translation of that item. Reviews are quoted as written, so they have
// no language folder.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Entry id = file path without .json ("nl/dienst-1"). Set explicitly: by default
// the glob loader takes a `slug` field from the data as the id, which would drop
// the language folder and make the entry vanish from its language.
const generateId = ({ entry }: { entry: string }) => entry.replace(/\.json$/, '');

const services = defineCollection({
  loader: glob({ pattern: '*/*.json', base: './src/content/services', generateId }),
  schema: z.object({
    order: z.number(),
    // Lucide icon name (lucide.dev/icons, e.g. "hammer"), or "custom:<file>"
    // for an SVG in src/assets/icons/.
    icon: z.string(),
    title: z.string(),
    summary: z.string(),
    // Optional URL slug; defaults to the file name.
    slug: z.string().optional(),
    image: z.string().nullable(),
    imageAlt: z.string(),
    body: z.array(z.string()),
    // Date of the last real change (sitemap lastmod), optional.
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

// A region gets its own page only when it has real, distinct body text —
// templated city pages hurt SEO. Without body it is only listed by name.
const regions = defineCollection({
  loader: glob({ pattern: '*/*.json', base: './src/content/regions', generateId }),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    slug: z.string().optional(),
    body: z.array(z.string()),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

const gallery = defineCollection({
  loader: glob({ pattern: '*/*.json', base: './src/content/gallery', generateId }),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    // File name of the related service (without .json), optional.
    service: z.string().nullable(),
    image: z.string().nullable(),
    imageAlt: z.string(),
  }),
});

// Only real reviews, copied word for word, with the source.
const reviews = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/reviews', generateId }),
  schema: z.object({
    order: z.number(),
    author: z.string(),
    text: z.string(),
    rating: z.number().int().min(1).max(5),
    source: z.string(),
    date: z.string().nullable(),
  }),
});

export const collections = { services, regions, gallery, reviews };
