// Sitemap from the route table. lastmod only where the data has a real
// `updated` date (date of the last content change, never the build date —
// otherwise every deploy "changes" every page and Google ignores lastmod).
// Privacy/cookie pages are left out on purpose (no search value).
// Announced in robots.txt only after launch.
import type { APIRoute } from 'astro';
import { allRoutes, alternatesOf } from '../lib/routes';
import { defaultLang } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const routes = (await allRoutes()).filter((r) => r.kind !== 'privacy' && r.kind !== 'cookies');
  const multilingual = new Set(routes.map((r) => r.lang)).size > 1;

  const entries = await Promise.all(
    routes.map(async (r) => {
      const lines = [`    <loc>${abs(r.path)}</loc>`];
      if (r.updated) lines.push(`    <lastmod>${r.updated}</lastmod>`);
      if (multilingual) {
        const alternates = await alternatesOf(r);
        if (alternates.length > 1) {
          for (const a of alternates) lines.push(`    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${abs(a.path)}"/>`);
          const main = alternates.find((a) => a.lang === defaultLang);
          if (main) lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(main.path)}"/>`);
        }
      }
      return `  <url>\n${lines.join('\n')}\n  </url>`;
    }),
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
