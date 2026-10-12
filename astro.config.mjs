import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import facts from './src/data/site-facts.json' with { type: 'json' };

// The site URL comes from client data (site-facts.json → siteUrl), not from code.
export default defineConfig({
  site: facts.siteUrl,
  output: 'static',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
});
