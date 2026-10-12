// Client images live in src/assets/images/ and are referenced from data by
// their path inside that folder ("services/roof.jpg"). Astro then resizes them
// and serves WebP. A wrong path fails the build — better than a broken image.
import type { ImageMetadata } from 'astro';

const images = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/**/*.{jpg,jpeg,png,webp,avif,svg}', {
  eager: true,
});
const icons = import.meta.glob<string>('/src/assets/icons/*.svg', { eager: true, query: '?raw', import: 'default' });

export function resolveImage(path: string | null | undefined): ImageMetadata | null {
  if (!path) return null;
  const file = images[`/src/assets/images/${path.replace(/^\/+/, '')}`];
  if (!file) throw new Error(`Image "${path}" not found in src/assets/images/`);
  return file.default;
}

export function customIcon(name: string): string {
  const svg = icons[`/src/assets/icons/${name}.svg`];
  if (!svg) throw new Error(`Custom icon "${name}" not found: expected src/assets/icons/${name}.svg`);
  return svg;
}
