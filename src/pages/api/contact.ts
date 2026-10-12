// Contact form endpoint — NOT CONNECTED YET (stage 2: validation, honeypot,
// rate limit, Resend e-mail + Telegram). Until then it always answers "not
// delivered", so the page shows the phone and e-mail instead of a false
// "thank you" (a lead must never be lost silently).
import type { APIRoute } from 'astro';
import { defaultLang, facts, links } from '../../lib/site';
import { ui } from '../../i18n/ui';

export const prerender = false;

export const POST: APIRoute = ({ request }) => {
  if (request.headers.get('accept')?.includes('application/json')) {
    return Response.json({ ok: false, reason: 'not-configured' }, { status: 503 });
  }

  // Plain form post (no JS): a minimal page with the direct contact details.
  const t = ui(defaultLang);
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const html = `<!doctype html><html lang="${t.htmlLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(facts.name)}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1.25rem;line-height:1.6">
<p>${esc(t.form.failed)}</p>
<p><a href="${links.tel}">${esc(facts.phone)}</a><br><a href="${links.mail}">${esc(facts.email)}</a></p>
<p><a href="/">${esc(t.cta.back)}</a></p></body></html>`;
  return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
};
