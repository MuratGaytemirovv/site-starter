// Loads and validates the client data once; every component reads from here.
import rawFacts from '../data/site-facts.json';
import rawSections from '../data/sections.json';
import type { z } from 'astro/zod';
import {
  contentSchema,
  factsSchema,
  sectionsSchema,
  type Content,
  type Lang,
  type SectionId,
} from './schema';

function parse<S extends z.ZodType>(label: string, schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const lines = result.error.issues.map((i) => `  - ${i.path.map(String).join('.') || '(root)'}: ${i.message}`);
  throw new Error(`Invalid client data in ${label}:\n${lines.join('\n')}`);
}

export const facts = parse('src/data/site-facts.json', factsSchema, rawFacts);
export const sectionsConfig = parse('src/data/sections.json', sectionsSchema, rawSections);

export const defaultLang: Lang = facts.languages[0];

const contentFiles = import.meta.glob<{ default: unknown }>('../data/content/*.json', { eager: true });

export function getContent(lang: Lang): Content {
  const file = contentFiles[`../data/content/${lang}.json`];
  if (!file) throw new Error(`Missing src/data/content/${lang}.json (language "${lang}" is listed in site-facts.json)`);
  return parse(`src/data/content/${lang}.json`, contentSchema, file.default);
}

// Anything still marked as a placeholder. Used to hide optional bits that the
// client has not filled in, never to hide required ones.
export const isPlaceholder = (value: string | null | undefined) => !value || value.includes('[ЗАПОЛНИТЬ');

const digits = (value: string) => value.replace(/[^\d+]/g, '');

export const links = {
  tel: `tel:${digits(facts.phoneE164)}`,
  mail: facts.email ? `mailto:${facts.email}` : null,
  whatsapp: facts.whatsappE164 ? `https://wa.me/${digits(facts.whatsappE164).replace('+', '')}` : null,
  maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${facts.address.street}, ${facts.address.postalCode} ${facts.address.city}, ${facts.address.country}`,
  )}`,
};

export const addressLine = `${facts.address.street}, ${facts.address.postalCode} ${facts.address.city}`;

export function enabledSectionIds(): SectionId[] {
  return sectionsConfig.sections.filter((s) => s.enabled).map((s) => s.id);
}

export function sectionVariant(id: SectionId): string | null {
  return sectionsConfig.sections.find((s) => s.id === id)?.variant ?? null;
}
