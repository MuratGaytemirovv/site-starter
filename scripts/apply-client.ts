// Spreads client.json over the template's data files.
//
//   npm run apply-client <file>     validate <file>, copy it to ./client.json, write the site data
//   npm run apply-client            same for ./client.json
//   npm run apply-client -- --check <file>   validate and report only, write nothing
//   --auto (prebuild/predev)        apply ./client.json if it exists, otherwise keep the template data
//
// With client.json present it is the only source: src/data/* and the content
// collections are regenerated from it on every build, old files are removed.
// Photos are never touched. Prints what is still missing before launch.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { clientSchema, type Client } from '../src/lib/client-schema.ts';
import { SECTION_IDS, contentSchema, factsSchema, sectionsSchema, type Lang, type SectionId } from '../src/lib/schema.ts';
import { ui } from '../src/i18n/ui.ts';

const root = process.cwd();
const rel = (...p: string[]) => path.join(root, ...p);
const CLIENT = 'client.json';
const GENERATED = 'Generated from client.json by `npm run apply-client` — edit client.json, not this file.';
const COLLECTIONS = ['services', 'regions', 'gallery'] as const;

// ---------- validation ----------

type Problem = { path: string; message: string };

function readClient(file: string): { client?: Client; problems: Problem[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return { problems: [{ path: file, message: e instanceof Error ? e.message : String(e) }] };
  }
  const result = clientSchema.safeParse(raw);
  if (!result.success) {
    return {
      problems: result.error.issues.map((i) => ({ path: i.path.map(String).join('.') || '(root)', message: i.message })),
    };
  }
  return { client: result.data, problems: filesProblems(result.data) };
}

const BRAND_ICONS = new Set(['whatsapp', 'facebook', 'instagram', 'tiktok']);
// Resolved from this script, so it also works when run for another folder (new-site).
const LUCIDE = path.join(path.dirname(createRequire(import.meta.url).resolve('lucide-static/package.json')), 'icons');

// Things the schema can't see: files on disk and icon names.
function filesProblems(c: Client): Problem[] {
  const problems: Problem[] = [];
  const image = (p: string | null | undefined, at: string) => {
    if (p && !fs.existsSync(rel('src/assets/images', p))) problems.push({ path: at, message: `file src/assets/images/${p} not found` });
  };
  const icon = (name: string, at: string) => {
    const ok = name.startsWith('custom:')
      ? fs.existsSync(rel('src/assets/icons', `${name.slice(7)}.svg`))
      : BRAND_ICONS.has(name) || fs.existsSync(path.join(LUCIDE, `${name}.svg`));
    if (!ok) problems.push({ path: at, message: `unknown icon "${name}" — pick a name from lucide.dev/icons` });
  };

  if (!c.facts.phoneE164 && !e164(c.facts.phone, c.facts.address.country)) {
    problems.push({ path: 'facts.phoneE164', message: 'cannot derive it from phone — give it, like +32470123456' });
  }
  image(c.design.logo, 'design.logo');
  image(c.design.ogImage, 'design.ogImage');
  for (const lang of c.languages) {
    const h = c.home[lang]!;
    image(h.hero.image, `home.${lang}.hero.image`);
    image(h.about?.image, `home.${lang}.about.image`);
    h.trust?.items.forEach((t, i) => icon(t.icon, `home.${lang}.trust.items.${i}.icon`));
    h.whyUs?.items.forEach((t, i) => icon(t.icon, `home.${lang}.whyUs.items.${i}.icon`));
  }
  c.services.forEach((s, i) => {
    icon(s.icon, `services.${i}.icon`);
    image(s.image, `services.${i}.image`);
  });
  c.gallery.forEach((g, i) => image(g.image, `gallery.${i}.image`));
  return problems;
}

// ---------- mapping ----------

const COUNTRY_CODES: Record<string, string> = { BE: '32', NL: '31', FR: '33', LU: '352', DE: '49' };

function e164(phone: string, country: string): string | null {
  const d = phone.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  if (d.startsWith('00')) return `+${d.slice(2)}`;
  const cc = COUNTRY_CODES[country];
  return cc && d.startsWith('0') ? `+${cc}${d.slice(1)}` : null;
}

function buildFacts(c: Client) {
  const f = c.facts;
  const main = c.languages[0];
  const score = f.reviews?.score;
  return {
    _comment: GENERATED,
    _confirm: c.sources.map((s) => `${s.what}: ${s.from}${s.date ? ` (${s.date})` : ''}`).join('; '),
    name: f.name,
    legalName: f.legalName ?? null,
    vat: f.vat ?? null,
    owner: f.owner ?? null,
    foundedYear: f.foundedYear ?? null,
    phone: f.phone,
    phoneE164: f.phoneE164 ?? e164(f.phone, f.address.country),
    whatsappE164: f.whatsappE164 ?? null,
    email: f.email ?? null,
    address: {
      street: f.address.street ?? '',
      postalCode: f.address.postalCode ?? '',
      city: f.address.city,
      region: f.address.region ?? '',
      country: f.address.country,
    },
    showAddress: f.showAddress,
    openingHours: f.openingHours,
    geo: f.geo ?? null,
    reviews: {
      score: typeof score === 'number' ? (main === 'en' ? score.toFixed(1) : score.toFixed(1).replace('.', ',')) : (score ?? null),
      count: f.reviews?.count ?? null,
      googleUrl: f.reviews?.googleUrl ?? null,
    },
    social: {
      facebook: f.social?.facebook ?? null,
      instagram: f.social?.instagram ?? null,
      tiktok: f.social?.tiktok ?? null,
    },
    logo: c.design.logo ?? null,
    ogImage: c.design.ogImage ?? null,
    schemaType: f.schemaType,
    style: c.design.style,
    brand: { primary: c.design.primary ?? null, ink: c.design.ink ?? null },
    languages: c.languages,
    siteUrl: f.siteUrl ?? 'https://example.com',
    launched: c.launched,
    demo: c.demo,
    privacy: { updated: c.privacy.updated ?? null, processors: c.privacy.processors },
  };
}

function buildSections(c: Client) {
  return {
    _comment: GENERATED,
    topbar: c.topbar,
    sections: [
      ...c.sections.map((id) => (id === 'hero' ? { id, enabled: true, variant: c.design.heroVariant ?? null } : { id, enabled: true })),
      ...SECTION_IDS.filter((id) => !c.sections.includes(id)).map((id) => ({ id, enabled: false })),
    ],
  };
}

function buildContent(c: Client, lang: Lang) {
  const h = c.home[lang]!;
  const t = ui(lang);
  const d = t.homeDefaults;
  const s = (v: string | null | undefined) => v ?? '';
  const head = (id: SectionId, title: string, given?: { eyebrow?: string | null; title?: string | null }) => ({
    eyebrow: given?.eyebrow ?? t.sections[id].nav,
    title: given?.title ?? title,
  });
  return {
    _comment: GENERATED,
    meta: { title: h.meta.title, description: h.meta.description, ...(h.meta.updated && { updated: h.meta.updated }) },
    hero: {
      eyebrow: s(h.hero.eyebrow),
      title: h.hero.title,
      titleAccent: s(h.hero.titleAccent),
      subtitle: s(h.hero.subtitle),
      primaryCta: h.hero.primaryCta ?? t.cta.quote,
      secondaryCta: h.hero.secondaryCta ?? d.secondaryCta,
      secondaryTarget: h.hero.secondaryTarget ?? 'gallery',
      bullets: h.hero.bullets,
      image: h.hero.image ?? null,
      imageAlt: s(h.hero.imageAlt),
    },
    trust: { items: h.trust?.items ?? [] },
    services: { ...head('services', d.titles.services, h.services), intro: s(h.services?.intro) },
    about: {
      ...head('about', d.titles.about, h.about),
      paragraphs: h.about?.paragraphs ?? [],
      stats: h.about?.stats ?? [],
      image: h.about?.image ?? null,
      imageAlt: s(h.about?.imageAlt),
    },
    process: { ...head('process', d.titles.process, h.process), steps: h.process?.steps ?? [] },
    whyUs: { ...head('why-us', d.titles.whyUs, h.whyUs), items: h.whyUs?.items ?? [] },
    gallery: { ...head('gallery', d.titles.gallery, h.gallery), intro: s(h.gallery?.intro) },
    reviews: head('reviews', d.titles.reviews, h.reviews),
    faq: { ...head('faq', d.titles.faq, h.faq), items: h.faq?.items ?? [] },
    contact: {
      ...head('contact', d.titles.contact, h.contact),
      text: s(h.contact?.text),
      responseTime: s(h.contact?.responseTime),
    },
    footer: { tagline: s(h.footer?.tagline) },
  };
}

// Every generated file: path relative to the project → JSON value.
function buildFiles(c: Client): Map<string, unknown> {
  const files = new Map<string, unknown>();
  files.set('src/data/site-facts.json', buildFacts(c));
  files.set('src/data/sections.json', buildSections(c));
  for (const lang of c.languages) {
    files.set(`src/data/content/${lang}.json`, buildContent(c, lang));
    c.services.forEach((s, i) => {
      const t = s[lang]!;
      files.set(`src/content/services/${lang}/${s.id}.json`, {
        order: i + 1,
        icon: s.icon,
        title: t.title,
        summary: t.summary,
        ...(t.slug && { slug: t.slug }),
        image: s.image ?? null,
        imageAlt: t.imageAlt ?? '',
        body: t.body,
        ...(s.updated && { updated: s.updated }),
      });
    });
    c.regions.forEach((r, i) => {
      const t = r[lang]!;
      files.set(`src/content/regions/${lang}/${r.id}.json`, {
        order: i + 1,
        name: t.name,
        ...(t.slug && { slug: t.slug }),
        body: t.body,
        ...(r.updated && { updated: r.updated }),
      });
    });
    c.gallery.forEach((g, i) => {
      const t = g[lang]!;
      files.set(`src/content/gallery/${lang}/${g.id}.json`, {
        order: i + 1,
        title: t.title,
        service: g.service ?? null,
        image: g.image,
        imageAlt: t.imageAlt,
      });
    });
  }
  c.reviews.forEach((r, i) => {
    files.set(`src/content/reviews/review-${i + 1}.json`, {
      order: i + 1,
      author: r.author,
      text: r.text,
      rating: r.rating,
      source: r.source,
      date: r.date ?? null,
    });
  });
  return files;
}

// Generated files must still pass the site's own schemas (guards against drift).
function selfCheck(files: Map<string, unknown>, languages: Lang[]): Problem[] {
  const checks: [string, { safeParse(v: unknown): { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } } }][] = [
    ['src/data/site-facts.json', factsSchema],
    ['src/data/sections.json', sectionsSchema],
    ...languages.map((l) => [`src/data/content/${l}.json`, contentSchema] as [string, typeof contentSchema]),
  ];
  const problems: Problem[] = [];
  for (const [file, schema] of checks) {
    const r = schema.safeParse(files.get(file));
    if (!r.success) for (const i of r.error!.issues) problems.push({ path: `${file} → ${i.path.map(String).join('.')}`, message: i.message });
  }
  return problems;
}

// ---------- writing ----------

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

function listOld(): string[] {
  const old: string[] = [];
  const jsonIn = (dir: string) =>
    fs.existsSync(rel(dir)) ? fs.readdirSync(rel(dir)).filter((f) => f.endsWith('.json')).map((f) => `${dir}/${f}`) : [];
  old.push(...jsonIn('src/data/content'), ...jsonIn('src/content/reviews'));
  for (const col of COLLECTIONS) {
    const base = `src/content/${col}`;
    if (!fs.existsSync(rel(base))) continue;
    for (const lang of fs.readdirSync(rel(base))) {
      if (fs.statSync(rel(base, lang)).isDirectory()) old.push(...jsonIn(`${base}/${lang}`));
    }
  }
  return old;
}

function write(files: Map<string, unknown>, languages: Lang[]) {
  let changed = 0;
  let removed = 0;
  for (const file of listOld()) {
    if (!files.has(file)) {
      fs.rmSync(rel(file));
      removed++;
    }
  }
  // Empty language folders of dropped languages go too; the collection roots
  // stay (git keeps no empty folders, a fresh clone may lack them).
  fs.mkdirSync(rel('src/content/reviews'), { recursive: true });
  for (const col of COLLECTIONS) {
    const base = rel('src/content', col);
    fs.mkdirSync(base, { recursive: true });
    for (const lang of fs.readdirSync(base)) {
      const dir = path.join(base, lang);
      if (fs.statSync(dir).isDirectory() && !languages.includes(lang as Lang) && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
    }
  }
  for (const [file, value] of files) {
    const target = rel(file);
    const next = json(value);
    // CRLF from a Windows checkout (core.autocrlf) is not a change.
    if (fs.existsSync(target) && fs.readFileSync(target, 'utf8').replaceAll('\r\n', '\n') === next) continue;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, next);
    changed++;
  }
  return { changed, removed };
}

// ---------- report ----------

function report(c: Client): { launch: string[]; improve: string[] } {
  const f = c.facts;
  const launch: string[] = [];
  const improve: string[] = [];
  if (c.demo) launch.push('demo: true — факты не подтверждены клиентом');
  if (!f.legalName) launch.push('facts.legalName — юр. название с формой (BV, SRL…)');
  if (!f.vat && f.address.country === 'BE') launch.push('facts.vat — номер BTW/KBO (обязателен на сайте в Бельгии)');
  if (!f.email) launch.push('facts.email — публичная почта (сейчас на сайте только телефон)');
  if (!f.siteUrl) launch.push('facts.siteUrl — домен');
  if (!c.privacy.updated) launch.push('privacy.updated — дата утверждения privacy-текста (сейчас «черновик»)');

  const main = c.languages[0];
  const h = c.home[main]!;
  if (!f.openingHours.length) improve.push('facts.openingHours — часы работы (сверить с Google-профилем)');
  if (!c.design.logo) improve.push('design.logo — логотип (сейчас текстовый)');
  if (!c.design.primary) improve.push('design.primary — цвет бренда (сейчас цвет стиля)');
  if (!h.hero.image) improve.push(`home.${main}.hero.image — фото на первом экране (сейчас узорная заглушка)`);
  const noImage = c.services.filter((s) => !s.image).map((s) => s.id);
  if (noImage.length) improve.push(`services без фото: ${noImage.join(', ')}`);
  const thin = c.services.filter((s) => !s[main]!.body.length).map((s) => s.id);
  if (thin.length) improve.push(`services без текста страницы (body): ${thin.join(', ')} — страница будет тонкой`);
  if (c.services.length < 3) improve.push(`услуг ${c.services.length} — на главной лучше смотрятся 3+`);
  if (!c.reviews.length) improve.push('reviews — нет отзывов (секция скрыта)');
  if (!c.gallery.length) improve.push('gallery — нет фото работ (секция скрыта)');
  if (!h.about?.paragraphs.length) improve.push(`home.${main}.about — нет текста «о нас» (секция скрыта)`);
  if (!h.faq?.items.length) improve.push(`home.${main}.faq — нет вопросов (секция скрыта)`);
  if (!h.trust?.items.length) improve.push(`home.${main}.trust — нет фактов доверия (полоса скрыта)`);
  if (!c.regions.length) improve.push('regions — не указан район работы');
  if (f.reviews?.score && !f.reviews.googleUrl) improve.push('facts.reviews.googleUrl — без ссылки оценка Google не показывается');
  for (const lang of c.languages) {
    const m = c.home[lang]!.meta;
    if (m.title.length > 65) improve.push(`home.${lang}.meta.title — ${m.title.length} знаков, Google обрежет после ~60`);
    if (m.description.length > 160) improve.push(`home.${lang}.meta.description — ${m.description.length} знаков, лучше ≤155`);
    if (m.description.length < 70) improve.push(`home.${lang}.meta.description — ${m.description.length} знаков, коротко (70–155)`);
  }
  return { launch, improve };
}

function printProblems(source: string, problems: Problem[]) {
  console.error(`\n✗ ${source}: ${problems.length} ошибк(и/а) — ничего не записано\n`);
  for (const p of problems) console.error(`  - ${p.path}: ${p.message}`);
  console.error('');
}

// ---------- main ----------

function main() {
  const args = process.argv.slice(2);
  const auto = args.includes('--auto');
  const checkOnly = args.includes('--check');
  const fileArg = args.find((a) => !a.startsWith('--'));
  const source = fileArg ?? CLIENT;

  const sourcePath = path.resolve(root, source);
  if (!fs.existsSync(sourcePath)) {
    if (auto && !fileArg) {
      console.log('apply-client: client.json нет — используются данные шаблона из src/data и src/content');
      return;
    }
    console.error(`apply-client: файл ${source} не найден`);
    process.exit(1);
  }

  const { client, problems } = readClient(sourcePath);
  if (!client || problems.length) {
    printProblems(source, problems);
    process.exit(1);
  }

  const files = buildFiles(client);
  const drift = selfCheck(files, client.languages);
  if (drift.length) {
    printProblems(`${source} (внутренняя проверка шаблона)`, drift);
    process.exit(1);
  }

  if (!checkOnly) {
    if (sourcePath !== rel(CLIENT)) {
      // The copy lives in the project root: point its $schema there.
      const { $schema: _, ...rest } = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      fs.writeFileSync(rel(CLIENT), json({ $schema: './client.schema.json', ...rest }));
    }
    const { changed, removed } = write(files, client.languages);
    console.log(`apply-client: ${source} → ${files.size} файлов (изменено ${changed}, удалено старых ${removed})`);
  } else {
    console.log(`apply-client: ${source} — проверка пройдена, файлы не менялись`);
  }

  const c = client;
  console.log(
    `  ${c.facts.name} · языки ${c.languages.join(', ')} · стиль ${c.design.style} · услуг ${c.services.length} · регионов ${c.regions.length} · работ ${c.gallery.length} · отзывов ${c.reviews.length}${c.demo ? ' · ДЕМО' : ''}${c.launched ? ' · ЗАПУЩЕН' : ''}`,
  );
  const { launch, improve } = report(c);
  if (launch.length && !c.launched) {
    console.log(`\n  Перед запуском не хватает (${launch.length}):`);
    for (const l of launch) console.log(`    - ${l}`);
  }
  if (improve.length) {
    console.log(`\n  Можно улучшить (${improve.length}):`);
    for (const l of improve) console.log(`    - ${l}`);
  }
  console.log('');
}

main();
