// Cut full-page screenshots into readable parts (desktop frames scaled to 66%).
// Usage (project root): node .claude/skills/visual-check/split.mjs <dir> home-1440 home-375 ...
import sharp from 'sharp';
const [dir, ...names] = process.argv.slice(2);
for (const n of names) {
  const img = sharp(`${dir}/${n}.png`);
  const { width, height } = await img.metadata();
  const step = width > 1000 ? 1500 : 1300;
  let i = 0;
  for (let y = 0; y < height; y += step) {
    const h = Math.min(step, height - y);
    let part = sharp(`${dir}/${n}.png`).extract({ left: 0, top: y, width, height: h });
    if (width > 1000) part = part.resize(Math.round(width * 0.66));
    await part.toFile(`${dir}/${n}-p${i++}.png`);
  }
  console.log(n, width, height, i);
}
