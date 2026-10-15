// client.json: everything a new site needs, in one file an LLM agent can fill.
// scripts/apply-client.ts validates it with this schema and spreads it over
// src/data/* and src/content/*; client.schema.json is generated from it
// (descriptions included), so agents and editors see the same rules.
//
// Rules for whoever fills it: only confirmed or publicly stated facts; unknown
// = null or leave the field out (never invent, never write [ЗАПОЛНИТЬ]).
// Optional texts that are missing simply don't show on the site.
import { z } from 'astro/zod';
import { HERO_VARIANTS, LANGUAGES, PROCESSORS, SECTION_IDS, STYLES, isoDate } from './schema.ts';

const PLACEHOLDER = '[ЗАПОЛНИТЬ';

const text = z
  .string()
  .trim()
  .min(1)
  .refine((s) => !s.includes(PLACEHOLDER), 'do not write [ЗАПОЛНИТЬ] — use null or leave the field out');
const optText = text.nullish();
const texts = z.array(text).default([]);

const id = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'expected lowercase latin letters, digits and hyphens, like "platte-daken"');
const imagePath = z
  .string()
  .regex(
    /^(?!\/|https?:)[\w./-]+\.(jpe?g|png|webp|avif|svg)$/i,
    'expected a file path inside src/assets/images/, like "client/hero.jpg" (no URLs: save the file first)',
  )
  .describe('Path inside src/assets/images/ (the file must exist). Save photos there first; no URLs.');
const icon = z
  .string()
  .regex(/^(custom:)?[a-z0-9]+(-[a-z0-9]+)*$/, 'expected a Lucide icon name like "hammer", or "custom:<file>"')
  .describe('Lucide icon name from lucide.dev/icons ("hammer", "paint-roller"), or "custom:<file>" for src/assets/icons/<file>.svg');
const e164 = z.string().regex(/^\+\d{8,15}$/, 'expected an international number like +32470123456');
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected a colour like #1f4e8c');
const day = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
const time = z.string().regex(/^\d{2}:\d{2}$/, 'expected HH:MM');

// Section heading: every field optional; a missing eyebrow/title gets the
// template default for the language, a missing intro is not shown.
const heading = {
  eyebrow: optText.describe('Small label above the title; default = the section name'),
  title: optText.describe('Section title; default = a neutral title in this language'),
};

const homeText = z
  .object({
    meta: z.object({
      title: text.describe('Browser/Google title, ~50–60 chars: what + where + name'),
      description: text.describe('Google snippet, ~140–155 chars'),
      updated: isoDate.optional().describe('Date of the last real content change (sitemap lastmod)'),
    }).strict(),
    hero: z
      .object({
        eyebrow: optText.describe('Short line above the H1, e.g. "Gent · Oost-Vlaanderen"'),
        title: text.describe('H1: what you do + where'),
        titleAccent: optText.describe('Second H1 line in the accent colour: a short, true promise'),
        subtitle: optText,
        primaryCta: optText.describe('Main button (to the contact form); default = "request a quote" in this language'),
        secondaryCta: optText.describe('Second button; default = "see our work" in this language'),
        secondaryTarget: z.enum(SECTION_IDS).nullish().describe('Section the second button scrolls to; default gallery'),
        bullets: z.array(text).max(4).default([]).describe('Up to 4 short, confirmed advantages'),
        image: imagePath.nullish(),
        imageAlt: optText,
      })
      .strict(),
    trust: z
      .object({ items: z.array(z.object({ icon, label: text }).strict()).max(4).default([]) })
      .strict()
      .optional()
      .describe('Strip of 3–4 confirmed trust facts (warranty, insurance, certification, area). Empty = hidden'),
    services: z.object({ ...heading, intro: optText }).strict().optional(),
    about: z
      .object({
        ...heading,
        paragraphs: texts.describe('Who is behind the business; empty = section hidden'),
        stats: z
          .array(z.object({ value: text.describe('Shown as written: "15 jaar", "400+"'), label: text }).strict())
          .max(3)
          .default([])
          .describe('Only confirmed numbers'),
        image: imagePath.nullish(),
        imageAlt: optText,
      })
      .strict()
      .optional(),
    process: z
      .object({ ...heading, steps: z.array(z.object({ title: text, text }).strict()).max(5).default([]) })
      .strict()
      .optional()
      .describe('How a job goes, 3–5 steps; empty = hidden'),
    whyUs: z
      .object({ ...heading, items: z.array(z.object({ icon, title: text, text }).strict()).max(6).default([]) })
      .strict()
      .optional(),
    gallery: z.object({ ...heading, intro: optText }).strict().optional(),
    reviews: z.object(heading).strict().optional(),
    faq: z
      .object({ ...heading, items: z.array(z.object({ q: text, a: text }).strict()).default([]) })
      .strict()
      .optional()
      .describe('Real questions with honest answers; empty = hidden'),
    contact: z
      .object({
        ...heading,
        text: optText.describe('What happens after someone sends the form'),
        responseTime: optText.describe('Only a real commitment, e.g. "Antwoord binnen 1 werkdag"'),
      })
      .strict()
      .optional(),
    footer: z.object({ tagline: optText }).strict().optional(),
  })
  .strict();

// A collection item: language-neutral fields + one text object per site language.
function perLanguage<T extends z.ZodType>(textSchema: T) {
  return Object.fromEntries(
    LANGUAGES.map((l) => [l, textSchema.optional().describe(`Texts in "${l}" — required for every language in "languages"`)]),
  ) as Record<(typeof LANGUAGES)[number], z.ZodOptional<T>>;
}

const service = z
  .object({
    id: id.describe('Latin slug; file name, default URL and translation key'),
    icon,
    image: imagePath.nullish(),
    updated: isoDate.optional(),
    ...perLanguage(
      z
        .object({
          slug: id.optional().describe('URL in this language; default = id'),
          title: text,
          summary: text.describe('One sentence: what it is and for whom'),
          imageAlt: optText,
          body: texts.describe('Paragraphs for the service page'),
        })
        .strict(),
    ),
  })
  .strict();

const region = z
  .object({
    id,
    updated: isoDate.optional(),
    ...perLanguage(
      z
        .object({
          name: text,
          slug: id.optional(),
          body: texts.describe('Own, specific text for this town; empty = listed by name only, no page'),
        })
        .strict(),
    ),
  })
  .strict();

const galleryItem = z
  .object({
    id,
    service: id.nullish().describe('id of the related service'),
    image: imagePath.describe('Own photo of real work, inside src/assets/images/'),
    ...perLanguage(z.object({ title: text, imageAlt: text }).strict()),
  })
  .strict();

const review = z
  .object({
    author: text,
    text: text.describe('Word for word, as published'),
    rating: z.number().int().min(1).max(5),
    source: text.default('Google'),
    date: optText.describe('As shown at the source, e.g. "2026-08" or "3 months ago"'),
  })
  .strict();

export const clientSchema = z
  .object({
    $schema: z.string().optional(),
    demo: z.boolean().describe('true = preview built from public info, facts not confirmed by the business (shows a notice)'),
    launched: z.boolean().default(false).describe('true only on the real domain: enables indexing; strict checks apply'),
    sources: z
      .array(
        z
          .object({
            what: text.describe('Which facts or files, e.g. "phone, hours, reviews" or "photo client/p1.jpg"'),
            from: text.describe('Google Business Profile, old site URL, owner by phone…'),
            date: isoDate.nullish(),
          })
          .strict(),
      )
      .min(1)
      .describe('Where the facts come from — needed for review'),

    facts: z
      .object({
        name: text.describe('Trade name as the business uses it'),
        legalName: optText.describe('Registered name with legal form (BV, SRL…); required at launch'),
        vat: optText.describe('VAT/KBO number, e.g. "BE 0123.456.789"; required at launch in BE'),
        owner: optText,
        foundedYear: z.number().int().min(1800).max(2100).nullish(),
        phone: text.describe('Main number as shown, e.g. "0470 12 34 56"'),
        phoneE164: e164.nullish().describe('Optional; derived from phone for BE/NL/FR/LU/DE'),
        whatsappE164: e164.nullish(),
        email: z.email().nullish().describe('Public e-mail; null = only the phone is shown; required at launch'),
        address: z
          .object({
            street: optText,
            postalCode: optText,
            city: text,
            region: optText.describe('Province'),
            country: z.string().length(2).default('BE'),
          })
          .strict(),
        showAddress: z.boolean().default(false).describe('Show street address and map (needs street + postalCode). false for service-area businesses'),
        openingHours: z
          .array(z.object({ days: z.array(day).min(1), opens: time, closes: time }).strict())
          .default([]),
        geo: z.object({ lat: z.number(), lng: z.number() }).strict().nullish(),
        reviews: z
          .object({
            score: z.union([z.number().min(1).max(5), z.string().regex(/^[1-5]([.,]\d)?$/)]).nullish().describe('Google rating, e.g. 4.9'),
            count: z.number().int().min(0).nullish(),
            googleUrl: z.url().nullish(),
          })
          .strict()
          .optional(),
        social: z
          .object({ facebook: z.url().nullish(), instagram: z.url().nullish(), tiktok: z.url().nullish() })
          .strict()
          .optional(),
        schemaType: z
          .string()
          .regex(/^[A-Z][A-Za-z]+$/)
          .default('LocalBusiness')
          .describe('schema.org type: RoofingContractor, Plumber, Electrician, HairSalon… or LocalBusiness'),
        siteUrl: z.url().nullish().describe('Final domain with https://; required at launch'),
      })
      .strict(),

    design: z
      .object({
        style: z.enum(STYLES).default('strict').describe('strict = sober/corporate, warm = friendly/craft, modern = bold/clean'),
        primary: hex.nullish().describe('Brand accent colour; default = the style colour'),
        ink: hex.nullish().describe('Dark brand colour for dark sections (≥7:1 against white)'),
        logo: imagePath.nullish().describe('null = text logo from the name'),
        ogImage: imagePath.nullish().describe('Share image; null = hero photo'),
        heroVariant: z.enum(HERO_VARIANTS).nullish().describe('split = text + photo, cover = photo behind text; default = style default'),
      })
      .strict()
      .default({ style: 'strict' }),

    languages: z.array(z.enum(LANGUAGES)).min(1).describe('First = main language (site root); others under /<lang>/'),
    sections: z
      .array(z.enum(SECTION_IDS))
      .default([...SECTION_IDS])
      .describe('Homepage sections in display order; leave one out to hide it. Sections without data hide themselves'),
    topbar: z.boolean().default(true).describe('Thin bar above the header with phone/e-mail (desktop)'),

    home: z.partialRecord(z.enum(LANGUAGES), homeText).describe('Homepage texts, one object per site language'),
    services: z.array(service).min(1),
    regions: z.array(region).default([]).describe('Towns served; a page only for those with own body text'),
    gallery: z.array(galleryItem).default([]).describe('Only own photos of real work'),
    reviews: z.array(review).default([]).describe('Only real reviews, word for word'),

    privacy: z
      .object({
        updated: isoDate.nullish().describe('Date the privacy text was approved; null = shown as draft; required at launch'),
        processors: z.array(z.enum(PROCESSORS)).default(['vercel', 'resend', 'telegram']),
      })
      .strict()
      .default({ processors: ['vercel', 'resend', 'telegram'] }),
  })
  .strict()
  .superRefine((c, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
    const langs = new Set(c.languages);
    if (langs.size !== c.languages.length) issue(['languages'], 'a language is listed twice');

    for (const lang of LANGUAGES) {
      if (langs.has(lang) && !c.home[lang]) issue(['home', lang], `missing — "${lang}" is in languages`);
      if (!langs.has(lang) && c.home[lang]) issue(['home', lang], `"${lang}" is not in languages`);
    }

    const checkItems = (name: 'services' | 'regions' | 'gallery', items: Record<string, unknown>[]) => {
      const seen = new Set<string>();
      items.forEach((item, i) => {
        const itemId = item.id as string;
        if (seen.has(itemId)) issue([name, i, 'id'], `duplicate id "${itemId}"`);
        seen.add(itemId);
        for (const lang of LANGUAGES) {
          if (langs.has(lang) && !item[lang]) issue([name, i, lang], `missing — "${lang}" is in languages`);
          if (!langs.has(lang) && item[lang]) issue([name, i, lang], `"${lang}" is not in languages`);
        }
      });
      return seen;
    };
    const serviceIds = checkItems('services', c.services);
    checkItems('regions', c.regions);
    checkItems('gallery', c.gallery);
    c.gallery.forEach((g, i) => {
      if (g.service && !serviceIds.has(g.service)) issue(['gallery', i, 'service'], `no service with id "${g.service}"`);
    });

    if (new Set(c.sections).size !== c.sections.length) issue(['sections'], 'a section is listed twice');

    // Image alt texts: a photo without a description fails accessibility.
    for (const lang of c.languages) {
      const h = c.home[lang];
      if (h?.hero.image && !h.hero.imageAlt) issue(['home', lang, 'hero', 'imageAlt'], 'required when hero.image is set');
      if (h?.about?.image && !h.about.imageAlt) issue(['home', lang, 'about', 'imageAlt'], 'required when about.image is set');
      c.services.forEach((s, i) => {
        if (s.image && s[lang] && !s[lang].imageAlt) issue(['services', i, lang, 'imageAlt'], 'required when the service has an image');
      });
    }

    const f = c.facts;
    if (f.showAddress && !(f.address.street && f.address.postalCode)) {
      issue(['facts', 'showAddress'], 'needs address.street and address.postalCode');
    }

    if (c.launched) {
      const need = (cond: unknown, path: (string | number)[], what: string) => {
        if (!cond) issue(path, `required at launch: ${what}`);
      };
      need(!c.demo, ['demo'], 'demo must be false (facts confirmed by the business)');
      need(f.legalName, ['facts', 'legalName'], 'registered name');
      need(f.email, ['facts', 'email'], 'public e-mail');
      need(f.address.country !== 'BE' || f.vat, ['facts', 'vat'], 'VAT/KBO number (Belgian law)');
      need(f.siteUrl, ['facts', 'siteUrl'], 'final domain');
      need(c.privacy.updated, ['privacy', 'updated'], 'date the privacy text was approved');
    }
  });

export type ClientInput = z.input<typeof clientSchema>;
export type Client = z.output<typeof clientSchema>;
