// Schemas for client data. A typo in a data file fails the build with a
// readable message instead of silently rendering a broken page.
import { z } from 'astro/zod';

export const STYLES = ['strict', 'warm', 'modern'] as const;
export const LANGUAGES = ['nl', 'fr', 'en', 'ru'] as const;
export const SECTION_IDS = [
  'hero',
  'trust',
  'services',
  'about',
  'process',
  'gallery',
  'why-us',
  'reviews',
  'faq',
  'contact',
] as const;
export const HERO_VARIANTS = ['split', 'cover'] as const;
// Services that may receive personal data; each has a paragraph in the privacy policy.
export const PROCESSORS = ['vercel', 'resend', 'telegram', 'odoo', 'whatsapp', 'accountant'] as const;
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected a colour like #1f4e8c');
const dayNames = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
const time = z.string().regex(/^\d{2}:\d{2}$/, 'expected HH:MM');

export const factsSchema = z.object({
  name: z.string().min(1),
  // null = not confirmed yet; the trade name is shown instead (required at launch).
  legalName: z.string().min(1).nullable(),
  vat: z.string().nullable(),
  owner: z.string().nullable(),
  foundedYear: z.number().int().nullable(),

  phone: z.string().min(1),
  phoneE164: z.string().min(1),
  whatsappE164: z.string().nullable(),
  // null = no public e-mail: only the phone is shown (required at launch).
  email: z.string().min(1).nullable(),

  address: z.object({
    street: z.string(),
    postalCode: z.string(),
    city: z.string(),
    region: z.string(),
    country: z.string().length(2),
  }),
  showAddress: z.boolean(),

  // Language-neutral: the day labels come from the interface strings.
  openingHours: z.array(z.object({ days: z.array(dayNames).min(1), opens: time, closes: time })),
  // Optional coordinates for the LocalBusiness schema (from Google Maps).
  geo: z.object({ lat: z.number(), lng: z.number() }).nullable(),

  reviews: z.object({
    score: z.string().nullable(),
    count: z.number().int().nullable(),
    googleUrl: z.url().nullable(),
  }),
  social: z.object({
    facebook: z.url().nullable(),
    instagram: z.url().nullable(),
    tiktok: z.url().nullable(),
  }),

  // Path inside src/assets/images/ (svg/png/webp), or null for a text logo.
  logo: z.string().nullable(),
  // Share image (path in src/assets/images/); null = the hero photo, if any.
  ogImage: z.string().nullable(),
  // schema.org type: LocalBusiness or a more specific one (RoofingContractor,
  // Plumber, HairSalon, HomeAndConstructionBusiness … — see schema.org/LocalBusiness).
  schemaType: z.string().regex(/^[A-Z][A-Za-z]+$/, 'expected a schema.org type like LocalBusiness'),
  style: z.enum(STYLES),
  brand: z.object({ primary: hex.nullable(), ink: hex.nullable() }),

  languages: z.array(z.enum(LANGUAGES)).min(1),
  siteUrl: z.url(),
  launched: z.boolean(),
  demo: z.boolean(),

  // Privacy policy: date of the last change and the services that receive
  // personal data (listed in the policy). Show the text to a lawyer before launch.
  privacy: z.object({
    updated: isoDate.nullable(),
    processors: z.array(z.enum(PROCESSORS)),
  }),
});

export const sectionsSchema = z.object({
  topbar: z.boolean(),
  sections: z.array(
    z.object({
      id: z.enum(SECTION_IDS),
      enabled: z.boolean(),
      variant: z.string().nullable().optional(),
    }),
  ),
});

const image = z.string().nullable();
const cta = z.string().min(1);

export const contentSchema = z.object({
  // updated = date of the last real content change (sitemap lastmod), optional.
  meta: z.object({ title: z.string().min(1), description: z.string().min(1), updated: isoDate.optional() }),
  hero: z.object({
    eyebrow: z.string(),
    title: z.string().min(1),
    titleAccent: z.string(),
    subtitle: z.string(),
    primaryCta: cta,
    secondaryCta: z.string(),
    secondaryTarget: z.enum(SECTION_IDS),
    bullets: z.array(z.string()),
    image,
    imageAlt: z.string(),
  }),
  trust: z.object({ items: z.array(z.object({ icon: z.string(), label: z.string() })) }),
  services: z.object({ eyebrow: z.string(), title: z.string(), intro: z.string() }),
  about: z.object({
    eyebrow: z.string(),
    title: z.string(),
    paragraphs: z.array(z.string()),
    // Only confirmed numbers; value is shown as written ("400+", "15 jaar").
    stats: z.array(z.object({ value: z.string(), label: z.string() })),
    image,
    imageAlt: z.string(),
  }),
  process: z.object({
    eyebrow: z.string(),
    title: z.string(),
    steps: z.array(z.object({ title: z.string(), text: z.string() })),
  }),
  whyUs: z.object({
    eyebrow: z.string(),
    title: z.string(),
    items: z.array(z.object({ icon: z.string(), title: z.string(), text: z.string() })),
  }),
  gallery: z.object({ eyebrow: z.string(), title: z.string(), intro: z.string() }),
  // Optional demo video block (shown after services); null/absent = no block.
  video: z
    .object({
      eyebrow: z.string(),
      title: z.string(),
      caption: z.string(),
      alt: z.string(),
      src: z.string(),
      poster: z.string(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .nullable()
    .optional(),
  reviews: z.object({ eyebrow: z.string(), title: z.string() }),
  faq: z.object({
    eyebrow: z.string(),
    title: z.string(),
    items: z.array(z.object({ q: z.string(), a: z.string() })),
  }),
  contact: z.object({ eyebrow: z.string(), title: z.string(), text: z.string(), responseTime: z.string() }),
  footer: z.object({ tagline: z.string() }),
});

export type Facts = z.infer<typeof factsSchema>;
export type SectionsConfig = z.infer<typeof sectionsSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Lang = (typeof LANGUAGES)[number];
export type SectionId = (typeof SECTION_IDS)[number];
export type Style = (typeof STYLES)[number];
