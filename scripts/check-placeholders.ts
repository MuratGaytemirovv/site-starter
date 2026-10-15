// Counts [ЗАПОЛНИТЬ] left in the site data before every build. A preview may
// still have them; a launched site (site-facts.json → launched: true) may not.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const MARK = '[ЗАПОЛНИТЬ';

function jsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return jsonFiles(p);
    return e.name.endsWith('.json') ? [p] : [];
  });
}

// Comment keys explain the placeholders; they are not content.
const strip = (text: string) => text.replace(/^\s*"_comment":.*$/gm, '');

const found: [string, number][] = [];
for (const file of [...jsonFiles(path.join(root, 'src/data')), ...jsonFiles(path.join(root, 'src/content'))]) {
  const n = strip(fs.readFileSync(file, 'utf8')).split(MARK).length - 1;
  if (n) found.push([path.relative(root, file).replaceAll('\\', '/'), n]);
}

const total = found.reduce((sum, [, n]) => sum + n, 0);
const facts = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site-facts.json'), 'utf8'));

if (!total) {
  console.log('check-placeholders: [ЗАПОЛНИТЬ] нет');
} else {
  console.log(`check-placeholders: [ЗАПОЛНИТЬ] осталось ${total} в ${found.length} файлах`);
  for (const [file, n] of found) console.log(`  ${String(n).padStart(3)}  ${file}`);
  if (facts.launched) {
    console.error('\n✗ launched: true, а заглушки остались — запуск с [ЗАПОЛНИТЬ] на сайте запрещён\n');
    process.exit(1);
  }
}
