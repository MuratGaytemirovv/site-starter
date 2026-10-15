// Contact-form leads: validation, a simple rate limit and delivery channels.
// A lead counts as delivered when at least one channel confirms it; the
// visitor only sees "thank you" in that case (a lead must never vanish silently).
//
// Channels (each optional, configured with Vercel environment variables —
// see .env.example; nothing secret lives in the repo):
//   e-mail via Resend   RESEND_API_KEY + CONTACT_FROM_EMAIL (+ CONTACT_TO_EMAIL)
//   Telegram            TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (+ TELEGRAM_THREAD_ID for a topic)
//   Odoo CRM            ODOO_LEAD_FORM_URL (+ ODOO_LEAD_TEAM_ID, ODOO_LEAD_USER_ID)
import { LANGUAGES, type Lang } from './schema';

export type Lead = {
  name: string;
  phone: string;
  email: string;
  service: string; // service title in the visitor's language, or ''
  message: string;
  lang: Lang;
  page: string;
};

export type Env = (key: string) => string | undefined;

const MAX = { name: 120, phone: 40, email: 160, service: 120, message: 4000 };

// Returns the cleaned lead, or null when required fields are missing/invalid.
export function parseLead(form: Record<string, string>, fallbackLang: Lang): Omit<Lead, 'service' | 'page'> & { serviceKey: string } | null {
  const get = (k: string, max: number) => (form[k] ?? '').trim().slice(0, max);
  const name = get('name', MAX.name);
  const phone = get('phone', MAX.phone);
  const email = get('email', MAX.email);
  const message = get('message', MAX.message);
  const serviceKey = get('service', MAX.service);
  const lang = (LANGUAGES as readonly string[]).includes(form.lang) ? (form.lang as Lang) : fallbackLang;

  if (!name || (phone.match(/\d/g) ?? []).length < 6) return null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
  return { name, phone, email, message, serviceKey, lang };
}

// In-memory limit per IP: 5 requests per 10 minutes. Best effort — a server
// instance is reused across requests on Vercel (Fluid Compute), not shared
// between instances; enough to stop a bot hammering the form.
const WINDOW = 10 * 60 * 1000;
const LIMIT = 5;
const hits = new Map<string, number[]>();
export function rateLimited(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > WINDOW) hits.delete(k);
  return recent.length > LIMIT;
}

type Labels = { subject: (s: string) => string; name: string; phone: string; email: string; service: string; message: string; language: string; page: string };

export function leadText(lead: Lead, l: Labels, siteName: string) {
  const lines = [
    `${l.name}: ${lead.name}`,
    `${l.phone}: ${lead.phone}`,
    ...(lead.email ? [`${l.email}: ${lead.email}`] : []),
    ...(lead.service ? [`${l.service}: ${lead.service}`] : []),
    `${l.language}: ${lead.lang}`,
    ...(lead.page ? [`${l.page}: ${lead.page}`] : []),
    '',
    `${l.message}:`,
    lead.message || '-',
  ];
  return { subject: `${l.subject(lead.service)} — ${siteName}`, text: lines.join('\n') };
}

export type ChannelResult = { channel: 'email' | 'telegram' | 'odoo'; ok: boolean };

const timeout = () => AbortSignal.timeout(8000);

export async function sendEmail(env: Env, msg: { subject: string; text: string; replyTo?: string; to: string | null }): Promise<ChannelResult | null> {
  const key = env('RESEND_API_KEY');
  const from = env('CONTACT_FROM_EMAIL');
  const to = env('CONTACT_TO_EMAIL') || msg.to;
  if (!key || !from || !to) return null; // not configured
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: msg.subject, text: msg.text, reply_to: msg.replyTo || undefined }),
      signal: timeout(),
    });
    if (!res.ok) console.error('[api/contact] Resend error', res.status, (await res.text()).slice(0, 300));
    return { channel: 'email', ok: res.ok };
  } catch (err) {
    console.error('[api/contact] Resend network error', err);
    return { channel: 'email', ok: false };
  }
}

export async function sendTelegram(env: Env, text: string): Promise<ChannelResult | null> {
  const token = env('TELEGRAM_BOT_TOKEN');
  const chat = env('TELEGRAM_CHAT_ID');
  if (!token || !chat) return null;
  const thread = env('TELEGRAM_THREAD_ID');
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Plain text on purpose: no parse_mode, so visitor input can't break Markdown/HTML parsing.
      body: JSON.stringify({ chat_id: chat, text: text.slice(0, 4000), disable_web_page_preview: true, ...(thread ? { message_thread_id: Number(thread) } : {}) }),
      signal: timeout(),
    });
    if (!res.ok) console.error('[api/contact] Telegram error', res.status, (await res.text()).slice(0, 300));
    return { channel: 'telegram', ok: res.ok };
  } catch (err) {
    console.error('[api/contact] Telegram network error', err);
    return { channel: 'telegram', ok: false };
  }
}

// Odoo Standard has no external API: post to its own public website form
// (/website/form/crm.lead), as on INGBELG. Team/user ids are hidden fields of
// Odoo's own form, so we send them ourselves.
export async function sendOdoo(env: Env, lead: Lead, subject: string, text: string): Promise<ChannelResult | null> {
  const url = env('ODOO_LEAD_FORM_URL');
  if (!url) return null;
  const form = new FormData();
  form.set('name', subject);
  form.set('contact_name', lead.name);
  if (lead.email) form.set('email_from', lead.email);
  form.set('phone', lead.phone);
  form.set('description', text);
  const team = env('ODOO_LEAD_TEAM_ID');
  const user = env('ODOO_LEAD_USER_ID');
  if (team) form.set('team_id', team);
  if (user) form.set('user_id', user);
  try {
    const res = await fetch(url, { method: 'POST', body: form, signal: timeout() });
    const body = await res.text();
    const ok = res.ok && /"id"\s*:\s*\d+/.test(body);
    if (!ok) console.error('[api/contact] Odoo lead not created', res.status, body.slice(0, 300));
    return { channel: 'odoo', ok };
  } catch (err) {
    console.error('[api/contact] Odoo network error', err);
    return { channel: 'odoo', ok: false };
  }
}
