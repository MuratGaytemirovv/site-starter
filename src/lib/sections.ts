// Which homepage sections actually render, in order: enabled in
// sections.json AND having data. Header/footer menus use the same list, so a
// hidden section never leaves a dead menu link.
import { getGallery, getReviews, getServices } from './collections';
import type { Lang, SectionId } from './schema';
import { enabledSectionIds, getContent } from './site';

export async function visibleSections(lang: Lang): Promise<SectionId[]> {
  const content = getContent(lang);
  const [services, gallery, reviews] = await Promise.all([getServices(lang), getGallery(lang), getReviews()]);

  const hasData: Record<SectionId, boolean> = {
    hero: true,
    trust: content.trust.items.length > 0,
    services: services.length > 0,
    about: content.about.paragraphs.length > 0,
    process: content.process.steps.length > 0,
    gallery: gallery.length > 0,
    'why-us': content.whyUs.items.length > 0,
    reviews: reviews.length > 0,
    faq: content.faq.items.length > 0,
    contact: true,
  };

  return enabledSectionIds().filter((id) => hasData[id]);
}

// Background tone per section so two alike backgrounds never meet. The split
// hero sits on the surface colour, the cover hero and contact are dark; every
// other section alternates base / alt after the hero.
export type Tone = 'base' | 'alt';
export function tonesFor(ids: SectionId[]): Record<SectionId, Tone> {
  const tones = { hero: 'alt', contact: 'base' } as Record<SectionId, Tone>;
  let next: Tone = 'base';
  for (const id of ids) {
    if (id === 'hero' || id === 'contact') continue;
    tones[id] = next;
    next = next === 'base' ? 'alt' : 'base';
  }
  return tones;
}
