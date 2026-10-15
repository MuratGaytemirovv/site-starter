// A new client site from this template, in its own folder and git repository.
//
//   npm run new-site -- <slug> [--client <client.json> [--images <folder>]] [--dir <folder>] [--github [--owner <org>] [--public]]
//
// --images: the client's photos, copied into src/assets/images/ keeping the
// folder structure (client.json then refers to them as "client/hero.jpg"…).
//
// Copies the committed template (git ls-files — no node_modules, no history,
// no template notes), applies the client file if given, makes the first
// commit. Only with --github it also creates a GitHub repository (private;
// --public when someone other than the owner commits — Vercel Hobby does not
// deploy their commits from a private repo) and pushes (gh CLI, logged in). Vercel: import that repository once in
// the Vercel dashboard — the script prints the steps; previews stay noindex
// until launched: true.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const template = process.cwd();
const run = (cmd: string, args: string[], cwd: string) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const fail = (msg: string): never => {
  console.error(`new-site: ${msg}`);
  process.exit(1);
};

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : (args[i + 1] ?? fail(`${name} needs a value`));
};
const slug = args.find((a, i) => !a.startsWith('--') && !['--client', '--dir', '--owner', '--images'].includes(args[i - 1] ?? ''));
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  fail('usage: npm run new-site -- <slug> [--client <file> [--images <folder>]] [--dir <folder>] [--github [--owner <org>] [--public]]  (slug: lowercase, digits, hyphens)');
}
const clientFile = flag('--client');
const target = path.resolve(template, flag('--dir') ?? path.join('..', slug!));
const github = args.includes('--github');
const owner = flag('--owner');
const imagesDir = flag('--images');
const visibility = args.includes('--public') ? '--public' : '--private';

// The copy must be a known template version: no uncommitted changes.
if (run('git', ['status', '--porcelain'], template)) fail('the template has uncommitted changes — commit them first');
if (fs.existsSync(target) && fs.readdirSync(target).length) fail(`${target} already exists and is not empty`);
if (clientFile && !fs.existsSync(path.resolve(template, clientFile))) fail(`${clientFile} not found`);
if (imagesDir && !fs.existsSync(path.resolve(template, imagesDir))) fail(`${imagesDir} not found`);

const commit = run('git', ['rev-parse', '--short', 'HEAD'], template);
// Template-only files: its history, plan and examples stay here.
const skip = (f: string) => f.startsWith('examples/') || f.startsWith('.claude/notes/') || f.startsWith('templates/') || f === 'PLAN.md';

let copied = 0;
for (const file of run('git', ['ls-files'], template).split('\n').filter(Boolean)) {
  if (skip(file)) continue;
  const to = path.join(target, file === 'CLAUDE.md' ? 'CLAUDE.template.md' : file);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(template, file), to);
  copied++;
}

const pkgPath = path.join(target, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
fs.writeFileSync(pkgPath, `${JSON.stringify({ ...pkg, name: slug, version: '0.1.0' }, null, 2)}\n`);

let name = slug!;
if (clientFile) {
  if (imagesDir) fs.cpSync(path.resolve(template, imagesDir), path.join(target, 'src/assets/images'), { recursive: true });
  // The template's own apply-client and node_modules do the work; the copy needs no install for this.
  const applied = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--no-warnings', path.join(template, 'scripts/apply-client.ts'), path.resolve(template, clientFile)],
    { cwd: target, encoding: 'utf8' },
  );
  if (applied.status !== 0) {
    // The folder was created by this run only — remove it, nothing half-made stays behind.
    fs.rmSync(target, { recursive: true, force: true });
    console.error(applied.stderr || applied.stdout);
    fail('client file is not valid (see above) — nothing created');
  }
  console.log(applied.stdout);
  name = JSON.parse(fs.readFileSync(path.join(target, 'client.json'), 'utf8')).facts?.name ?? slug;
}

const claude = fs
  .readFileSync(path.join(template, 'templates/CLAUDE.client.md'), 'utf8')
  .replaceAll('{{name}}', name)
  .replaceAll('{{commit}}', commit)
  .replaceAll('{{date}}', new Date().toISOString().slice(0, 10));
fs.writeFileSync(path.join(target, 'CLAUDE.md'), claude);

run('git', ['init', '-b', 'main'], target);
run('git', ['add', '-A'], target);
run('git', ['commit', '-m', `${name}: site from site-starter ${commit}`], target);
console.log(`new-site: ${target} — ${copied} files from site-starter ${commit}, first commit made`);

if (github) {
  const repo = owner ? `${owner}/${slug}` : slug!;
  console.log(run('gh', ['repo', 'create', repo, visibility, '--source', target, '--push'], target));
}

console.log(`
Next:
  1. cd "${target}" && npm install && npm run build
${github ? '' : '  2. GitHub: npm run new-site … --github, or: gh repo create <name> --private --source . --push\n'}  ${github ? 2 : 3}. Vercel: vercel.com/new → import the repository (framework Astro is detected). Previews are noindex until launched: true.
  ${github ? 3 : 4}. Form delivery: set RESEND_* / TELEGRAM_* from .env.example in Vercel → Settings → Environment Variables, send a test lead.
  Vercel Hobby: commits by others deploy only from a public repo; agent commits need a git author e-mail known to GitHub (ID+login@users.noreply.github.com).
`);
