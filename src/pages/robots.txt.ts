import type { APIRoute } from 'astro';
import { facts } from '../lib/site';

// Before launch deliberately no `Disallow: /`: Google must be able to crawl
// the pages to see their noindex. The sitemap is announced only after launch.
export const GET: APIRoute = ({ site }) => {
  const lines = ['User-agent: *', 'Allow: /'];
  if (facts.launched) lines.push('', `Sitemap: ${new URL('sitemap.xml', site)}`);
  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
