// Static server for the built site (dist/client) that makes scroll-reveal content visible.
// Injects a style into every HTML page on the fly, so the build itself is never patched.
// Usage (project root): node .claude/skills/visual-check/serve.mjs [port]   (default 4324)
// Port 4321 belongs to another project, 4322 to Bilto — don't use them.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = join(process.cwd(), 'dist', 'client');
const PORT = Number(process.argv[2]) || 4324;
const REVEAL_OFF =
  '<style>.js-anim [data-reveal]{opacity:1!important;transform:none!important;transition:none!important}</style>';
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (path.endsWith('\\') || path.endsWith('/')) path = join(path, 'index.html');
  else if (!extname(path)) path = join(path, 'index.html');
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  try {
    let body = await readFile(file);
    const type = TYPES[extname(file)] || 'application/octet-stream';
    if (type.startsWith('text/html')) body = body.toString().replace('</head>', `${REVEAL_OFF}</head>`);
    res.writeHead(200, { 'Content-Type': type }).end(body);
  } catch {
    const notFound = await readFile(join(ROOT, '404.html')).catch(() => 'Not found');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(notFound);
  }
}).listen(PORT, () => console.log(`visual-check: http://localhost:${PORT}`));
