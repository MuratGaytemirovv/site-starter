// Style presets. A client picks one with `style` in site-facts.json and may
// override the two brand colours (`brand.primary`, `brand.ink`). Everything
// else — text colour on buttons, a darker primary for text on light
// backgrounds, hover shades — is derived here so contrast stays WCAG AA
// whatever colour the client brings (a yellow logo colour must never end up
// as body text on white).
//
// The output is a set of --t-* CSS variables on :root; global.css maps them to
// Tailwind tokens (bg-primary, text-ink, rounded-card, font-heading …).
import type { Facts, Style } from './schema';

type Preset = {
  primary: string;
  ink: string; // dark sections, headings
  bg: string; // page background
  surface: string; // alternate section background
  text: string; // body text on bg/surface
  muted: string; // secondary text on bg/surface (≥ 4.5:1 on surface)
  line: string; // borders
  fontHeading: string;
  fontBody: string;
  headingWeight: string;
  headingTracking: string;
  radiusCard: string;
  radiusButton: string;
  sectionY: string; // vertical section padding, mobile
  sectionYLg: string; // desktop
  heroVariant: 'split' | 'cover';
};

const sans = 'ui-sans-serif, system-ui, sans-serif';

export const presets: Record<Style, Preset> = {
  // Calm and businesslike: steel blue, navy, small radii, geometric sans.
  strict: {
    primary: '#1f4e8c',
    ink: '#0f1b2d',
    bg: '#ffffff',
    surface: '#f3f5f8',
    text: '#2b3442',
    muted: '#566170',
    line: '#dde2e9',
    fontHeading: `'Manrope Variable', ${sans}`,
    fontBody: `'Inter Variable', ${sans}`,
    headingWeight: '800',
    headingTracking: '-0.02em',
    radiusCard: '0.375rem',
    radiusButton: '0.375rem',
    sectionY: '4rem',
    sectionYLg: '7rem',
    heroVariant: 'split',
  },
  // Craft and family business: terracotta, cream, serif headings, soft shapes.
  warm: {
    primary: '#b4532a',
    ink: '#2a1f1a',
    bg: '#fffdf9',
    surface: '#f6efe4',
    text: '#3a2f28',
    muted: '#6a5a4d',
    line: '#e7dccd',
    fontHeading: `'Lora Variable', ui-serif, Georgia, serif`,
    fontBody: `'Nunito Sans Variable', ${sans}`,
    headingWeight: '600',
    headingTracking: '-0.01em',
    radiusCard: '1rem',
    radiusButton: '999px',
    sectionY: '4.5rem',
    sectionYLg: '7.5rem',
    heroVariant: 'split',
  },
  // Bold and contemporary: near-black, vivid accent, large radii, full-bleed hero.
  modern: {
    primary: '#ff5a1f',
    ink: '#111111',
    bg: '#ffffff',
    surface: '#f2f2ef',
    text: '#26262a',
    muted: '#5b5b60',
    line: '#e3e3df',
    fontHeading: `'Onest Variable', ${sans}`,
    fontBody: `'Onest Variable', ${sans}`,
    headingWeight: '700',
    headingTracking: '-0.035em',
    radiusCard: '1.25rem',
    radiusButton: '0.75rem',
    sectionY: '4rem',
    sectionYLg: '7.5rem',
    heroVariant: 'cover',
  },
};

// --- colour maths (sRGB, WCAG 2.x) ---
type RGB = [number, number, number];
const toRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (rgb: RGB) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
const mix = (a: string, b: string, weightB: number): string => {
  const [x, y] = [toRgb(a), toRgb(b)];
  return toHex(x.map((c, i) => c + (y[i] - c) * weightB) as RGB);
};
const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// Darken `color` towards `ink` until it reaches `min` contrast against `bg`.
const ensureContrast = (color: string, bg: string, ink: string, min = 4.5) => {
  let result = color;
  for (let w = 0.05; contrast(result, bg) < min && w <= 1; w += 0.05) result = mix(color, ink, w);
  return result;
};

export function themeFor(facts: Facts) {
  const preset = presets[facts.style];
  const primary = facts.brand.primary ?? preset.primary;
  const ink = facts.brand.ink ?? preset.ink;
  const white = '#ffffff';
  if (contrast(white, ink) < 7) {
    throw new Error(`brand.ink ${ink} is too light: dark sections need white text at 7:1 or more`);
  }

  // Text on a primary button: whichever of white / ink reads better.
  const onPrimary = contrast(white, primary) >= contrast(ink, primary) ? white : ink;
  // Primary used as text or icon colour on light backgrounds.
  const primaryText = ensureContrast(primary, preset.surface, ink);
  // Primary used as text on dark (ink) sections.
  const primaryOnInk = contrast(primary, ink) >= 4.5 ? primary : mix(primary, white, 0.45);

  const vars: Record<string, string> = {
    '--t-primary': primary,
    '--t-primary-hover': mix(primary, onPrimary === white ? '#000000' : white, 0.14),
    '--t-on-primary': onPrimary,
    '--t-primary-text': primaryText,
    '--t-primary-on-ink': primaryOnInk,
    '--t-primary-soft': mix(primary, white, 0.88),
    '--t-ink': ink,
    '--t-ink-soft': mix(ink, white, 0.08),
    '--t-on-ink': '#ffffff',
    '--t-on-ink-muted': mix(ink, white, 0.72),
    '--t-ink-line': mix(ink, white, 0.18),
    '--t-bg': preset.bg,
    '--t-surface': preset.surface,
    '--t-text': preset.text,
    '--t-heading': ink,
    '--t-muted': preset.muted,
    '--t-line': preset.line,
    '--t-font-heading': preset.fontHeading,
    '--t-font-body': preset.fontBody,
    '--t-heading-weight': preset.headingWeight,
    '--t-heading-tracking': preset.headingTracking,
    '--t-radius-card': preset.radiusCard,
    '--t-radius-button': preset.radiusButton,
    '--t-section-y': preset.sectionY,
    '--t-section-y-lg': preset.sectionYLg,
  };

  return {
    css: `:root{${Object.entries(vars)
      .map(([k, v]) => `${k}:${v}`)
      .join(';')}}`,
    themeColor: ink,
    heroVariant: preset.heroVariant,
  };
}
