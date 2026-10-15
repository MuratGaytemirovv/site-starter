// Contact form endpoint. JSON answer for the in-page form (Accept:
// application/json), a minimal HTML page for a plain form post without JS.
// "ok: true" only when at least one channel confirmed delivery; otherwise the
// page shows the phone and e-mail instead of a false "thank you".
import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
import { defaultLang, facts, isPlaceholder, links } from '../../lib/site';
import { getServices } from '../../lib/collections';
import { leadText, parseLead, rateLimited, sendEmail, sendOdoo, sendTelegram } from '../../lib/leads';
import type { Lang } from '../../lib/schema';
import { ui } from '../../i18n/ui';

export const prerender = false;

type Outcome = 'ok' | 'invalid' | 'rate-limited' | 'not-configured' | 'not-delivered';
const STATUS: Record<Outcome, number> = { ok: 200, invalid: 400, 'rate-limited': 429, 'not-configured': 503, 'not-delivered': 502 };

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false;
  const form: Record<string, string> = {};
  try {
    const data = await request.formData();
    for (const [k, v] of data) if (typeof v === 'string') form[k] = v;
  } catch {
    return reply('invalid', defaultLang, wantsJson);
  }
  const lang = (facts.languages as string[]).includes(form.lang) ? (form.lang as Lang) : defaultLang;

  // Honeypot filled in = a bot. Pretend success, send nothing.
  if (form.website?.trim()) return reply('ok', lang, wantsJson);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || 'unknown';
  if (rateLimited(ip)) return reply('rate-limited', lang, wantsJson);

  const parsed = parseLead(form, lang);
  if (!parsed) return reply('invalid', lang, wantsJson);

  const services = await getServices(parsed.lang);
  const serviceTitle = services.find((s) => s.key === parsed.serviceKey)?.title ?? (parsed.serviceKey === 'other' ? ui(parsed.lang).form.serviceOther : '');
  const lead = { ...parsed, service: serviceTitle, page: request.headers.get('referer') ?? '' };
  // The business reads notifications in the site's main language.
  const { subject, text } = leadText(lead, ui(defaultLang).lead, facts.name);

  const env = (key: string) => getSecret(key);
  const results = (
    await Promise.all([
      sendEmail(env, { subject, text, replyTo: lead.email, to: isPlaceholder(facts.email) ? null : facts.email }),
      sendTelegram(env, `${subject}\n\n${text}`),
      sendOdoo(env, lead, subject, text),
    ])
  ).filter((r) => r !== null);

  if (!results.length) {
    console.error('[api/contact] No delivery channel configured — set RESEND_* or TELEGRAM_* in Vercel. Lead NOT delivered.');
    return reply('not-configured', lang, wantsJson);
  }
  const delivered = results.filter((r) => r.ok).map((r) => r.channel);
  return reply(delivered.length ? 'ok' : 'not-delivered', lang, wantsJson, delivered);
};

function reply(outcome: Outcome, lang: Lang, json: boolean, channels: string[] = []) {
  const status = STATUS[outcome];
  if (json) {
    return Response.json(outcome === 'ok' ? { ok: true, channels } : { ok: false, error: outcome }, { status });
  }
  // Plain form post (no JS): a minimal page in the visitor's language.
  const t = ui(lang);
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const message = outcome === 'ok' ? t.form.success : outcome === 'invalid' ? t.form.invalid : outcome === 'rate-limited' ? t.form.tooMany : t.form.failed;
  const contacts = outcome === 'ok' ? '' : `<p><a href="${links.tel}">${esc(facts.phone)}</a>${links.mail && facts.email ? `<br><a href="${links.mail}">${esc(facts.email)}</a>` : ''}</p>`;
  const html = `<!doctype html><html lang="${t.htmlLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(facts.name)}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1.25rem;line-height:1.6">
<p>${esc(message)}</p>${contacts}
<p><a href="${lang === defaultLang ? '/' : `/${lang}/`}">${esc(t.cta.back)}</a></p></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
