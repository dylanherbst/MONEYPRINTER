// Store templates (owner request, 20 Nov 2026): 15 ready-made looks for a new shop, each built on a proven conversion pattern, with only
// basic customisation (accent colour, logo). They are ORIGINAL designs made from general best practice (one clear action above the fold,
// proof next to the button, plain prices, sample before you buy, answers to the usual doubts, thumb-friendly mobile layout). They are not
// copies of any company's template. A template is DATA: a palette, a hero layout, a card style, corner radius, a font and which sections
// show. The renderer only reads these validated values, so AI output or customer input can never inject markup or styles.
import type { StoreConfig, StoreFont, StoreSection } from './schema.ts';

export const heroLayouts = ['split', 'split-rev', 'center', 'left', 'stack', 'banner', 'overlap', 'minimal'] as const;
export type HeroLayout = (typeof heroLayouts)[number];
export const cardStyles = ['soft', 'outline', 'flat', 'raised'] as const;
export type CardStyle = (typeof cardStyles)[number];
export const grids = ['three', 'two', 'four', 'list', 'mag'] as const;
export type Grid = (typeof grids)[number];
export const heads = ['left', 'center', 'bar'] as const;
export type Head = (typeof heads)[number];
/** The order the page's blocks run in. */
export const flows = ['proof', 'products', 'deal', 'story'] as const;
export type Flow = (typeof flows)[number];
export const trusts = ['cards', 'strip', 'plain'] as const;
export type Trust = (typeof trusts)[number];
export const radii = ['sharp', 'soft', 'round'] as const;
export type Radius = (typeof radii)[number];

export interface Palette { bg: string; surface: string; ink: string; muted: string; line: string; accent: string; accentInk: string; soft: string }
export interface StoreTemplate {
  id: string; name: string;
  /** Who it suits, in plain words. */
  bestFor: string;
  /** The conversion idea this layout is built on. */
  pattern: string;
  palette: Palette; font: StoreFont; hero: HeroLayout; grid: Grid; head: Head; flow: Flow; trust: Trust; cards: CardStyle; radius: Radius;
  sections: readonly StoreSection[];
}

const ALL: readonly StoreSection[] = ['trust', 'featured', 'bundles', 'catalogue', 'faq', 'newsletter'];
const LEAN: readonly StoreSection[] = ['trust', 'featured', 'catalogue', 'faq'];
const DEAL: readonly StoreSection[] = ['featured', 'bundles', 'trust', 'catalogue', 'faq'];

export const templates: readonly StoreTemplate[] = [
  { id: 'clean-launch', name: 'Clean Launch', bestFor: 'A first product with one clear message', pattern: 'One headline, one button, trust points straight under the hero.',
    palette: { bg: '#fbfaf8', surface: '#ffffff', ink: '#1d1b26', muted: '#625f70', line: '#e9e6ef', accent: '#5b3fc4', accentInk: '#ffffff', soft: '#efeafc' }, font: 'sans', hero: 'center', grid: 'three', head: 'center', flow: 'proof', trust: 'cards', cards: 'soft', radius: 'soft', sections: LEAN },
  { id: 'sage-studio', name: 'Sage Studio', bestFor: 'Planners, wellness and calm organisation', pattern: 'Split hero with the product cover beside the promise, so buyers see what they get at once.',
    palette: { bg: '#f7f8f4', surface: '#ffffff', ink: '#1f2a22', muted: '#566259', line: '#e2e7df', accent: '#2f6b49', accentInk: '#ffffff', soft: '#e6f0e8' }, font: 'sans', hero: 'split', grid: 'two', head: 'left', flow: 'proof', trust: 'strip', cards: 'soft', radius: 'soft', sections: ALL },
  { id: 'blush-boutique', name: 'Blush Boutique', bestFor: 'Journals, gratitude pages and gift printables', pattern: 'Warm, rounded and friendly, with a free-sample sign-up to win the first email.',
    palette: { bg: '#fdf8f6', surface: '#ffffff', ink: '#2b1f22', muted: '#6e5b5f', line: '#f0e3e0', accent: '#b8445a', accentInk: '#ffffff', soft: '#fbe9ec' }, font: 'rounded', hero: 'split-rev', grid: 'three', head: 'center', flow: 'proof', trust: 'plain', cards: 'raised', radius: 'round', sections: ALL },
  { id: 'midnight-shop', name: 'Midnight Shop', bestFor: 'Notion, spreadsheet and digital template products', pattern: 'Dark, high-contrast page where the button is the brightest thing on screen.',
    palette: { bg: '#121117', surface: '#1b1a22', ink: '#f4f2f8', muted: '#aaa6b8', line: '#2d2b36', accent: '#c7b6ff', accentInk: '#16131f', soft: '#262236' }, font: 'sans', hero: 'left', grid: 'four', head: 'left', flow: 'products', trust: 'strip', cards: 'outline', radius: 'soft', sections: LEAN },
  { id: 'paper-and-ink', name: 'Paper & Ink', bestFor: 'Writers, teachers and long-form guides', pattern: 'Editorial reading layout: a strong headline, then answers that build trust before the price.',
    palette: { bg: '#faf7f0', surface: '#ffffff', ink: '#222018', muted: '#625d4f', line: '#e8e2d3', accent: '#8a3b12', accentInk: '#ffffff', soft: '#f3e7d8' }, font: 'serif', hero: 'minimal', grid: 'list', head: 'center', flow: 'story', trust: 'plain', cards: 'flat', radius: 'sharp', sections: ['trust', 'featured', 'catalogue', 'faq', 'newsletter'] },
  { id: 'sunny-bundle', name: 'Sunny Bundle', bestFor: 'Several products sold as a bundle or deal', pattern: 'Bundle first: the saving is shown before single products, which lifts basket size.',
    palette: { bg: '#fffbef', surface: '#ffffff', ink: '#2a2208', muted: '#645a32', line: '#f2e8bf', accent: '#a85a00', accentInk: '#ffffff', soft: '#fff1c2' }, font: 'rounded', hero: 'banner', grid: 'three', head: 'left', flow: 'deal', trust: 'cards', cards: 'raised', radius: 'round', sections: DEAL },
  { id: 'ocean-planner', name: 'Ocean Planner', bestFor: 'Budget, business and productivity trackers', pattern: 'Confident blue with proof points and an FAQ that answers the money questions.',
    palette: { bg: '#f5f9fc', surface: '#ffffff', ink: '#13233a', muted: '#52647a', line: '#dce7f1', accent: '#1b64c4', accentInk: '#ffffff', soft: '#e1eefb' }, font: 'sans', hero: 'split', grid: 'mag', head: 'bar', flow: 'proof', trust: 'strip', cards: 'soft', radius: 'soft', sections: ALL },
  { id: 'terracotta-craft', name: 'Terracotta Craft', bestFor: 'Home, craft and DIY printables', pattern: 'Earthy and handmade-feeling, with large product covers so the work sells itself.',
    palette: { bg: '#fcf6f1', surface: '#ffffff', ink: '#2e1f17', muted: '#6c5547', line: '#f0e0d4', accent: '#a8431f', accentInk: '#ffffff', soft: '#f9e4d8' }, font: 'serif', hero: 'split-rev', grid: 'two', head: 'left', flow: 'products', trust: 'cards', cards: 'soft', radius: 'soft', sections: ALL },
  { id: 'mono-minimal', name: 'Mono Minimal', bestFor: 'Premium, design-led products', pattern: 'Black and white with sharp edges: fewer things on the page, so the one button gets the attention.',
    palette: { bg: '#ffffff', surface: '#ffffff', ink: '#111111', muted: '#5a5a5a', line: '#e3e3e3', accent: '#111111', accentInk: '#ffffff', soft: '#f1f1f1' }, font: 'sans', hero: 'minimal', grid: 'four', head: 'bar', flow: 'products', trust: 'plain', cards: 'outline', radius: 'sharp', sections: ['featured', 'catalogue', 'faq'] },
  { id: 'berry-pop', name: 'Berry Pop', bestFor: 'Kids, teachers and classroom printables', pattern: 'Bright, playful and rounded, with big tap targets for parents buying on a phone.',
    palette: { bg: '#fff6fa', surface: '#ffffff', ink: '#2a1020', muted: '#6e4a5e', line: '#f6dce9', accent: '#b0206a', accentInk: '#ffffff', soft: '#fde0ee' }, font: 'rounded', hero: 'stack', grid: 'two', head: 'center', flow: 'deal', trust: 'cards', cards: 'raised', radius: 'round', sections: ALL },
  { id: 'forest-study', name: 'Forest Study', bestFor: 'Study guides and student resources', pattern: 'Focused and trustworthy: a clear outcome statement, then proof and a detailed FAQ.',
    palette: { bg: '#f4f8f5', surface: '#ffffff', ink: '#14281d', muted: '#4f6657', line: '#d9e6dd', accent: '#1f6b3d', accentInk: '#ffffff', soft: '#dff0e5' }, font: 'serif', hero: 'left', grid: 'list', head: 'left', flow: 'story', trust: 'strip', cards: 'flat', radius: 'soft', sections: ['trust', 'featured', 'catalogue', 'faq', 'newsletter'] },
  { id: 'sky-soft', name: 'Sky Soft', bestFor: 'Habit trackers and gentle self-care', pattern: 'Light and airy with generous space; one product is shown large above the fold.',
    palette: { bg: '#f6faff', surface: '#ffffff', ink: '#17263d', muted: '#566a85', line: '#dfe9f6', accent: '#2f67c9', accentInk: '#ffffff', soft: '#e4eefc' }, font: 'rounded', hero: 'stack', grid: 'three', head: 'center', flow: 'products', trust: 'plain', cards: 'soft', radius: 'round', sections: LEAN },
  { id: 'gold-standard', name: 'Gold Standard', bestFor: 'Finance and premium professional templates', pattern: 'Dark navy with a gold button, signalling quality; trust points sit right next to the price.',
    palette: { bg: '#0f1a2e', surface: '#16243d', ink: '#f6f1e3', muted: '#b4b9c6', line: '#26385a', accent: '#e2b55a', accentInk: '#1a1405', soft: '#1d2d4a' }, font: 'serif', hero: 'banner', grid: 'mag', head: 'bar', flow: 'proof', trust: 'strip', cards: 'outline', radius: 'sharp', sections: ALL },
  { id: 'lemon-fresh', name: 'Lemon Fresh', bestFor: 'Fitness, meal plans and healthy habits', pattern: 'Energetic and clear: a short promise, a before-you-buy sample and fast mobile checkout.',
    palette: { bg: '#fbfdf2', surface: '#ffffff', ink: '#1b2408', muted: '#56613a', line: '#e6eccd', accent: '#4d7a0a', accentInk: '#ffffff', soft: '#eaf5c9' }, font: 'sans', hero: 'overlap', grid: 'three', head: 'left', flow: 'deal', trust: 'cards', cards: 'raised', radius: 'soft', sections: DEAL },
  { id: 'lavender-glow', name: 'Lavender Glow', bestFor: 'A soft, modern look for almost any product', pattern: 'The AiMoneyPrinter house style: lavender and peach with rounded cards and one bold button.',
    palette: { bg: '#faf8ff', surface: '#ffffff', ink: '#221b3a', muted: '#625b7c', line: '#e8e2f6', accent: '#6a47d6', accentInk: '#ffffff', soft: '#ece6fb' }, font: 'rounded', hero: 'split', grid: 'mag', head: 'center', flow: 'story', trust: 'cards', cards: 'soft', radius: 'round', sections: ALL },
] as const;

export const templateIds = templates.map((t) => t.id);
export type TemplateId = (typeof templates)[number]['id'];
export const templateById = (id: unknown): StoreTemplate | null => templates.find((t) => t.id === id) ?? null;

// ---------- Colour maths (WCAG) ----------
const HEX = /^#[0-9a-fA-F]{6}$/;
export const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);
const rgb = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
export const luminance = (h: string): number => { const [r, g, b] = rgb(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
export const contrast = (a: string, b: string): number => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
const mix = (a: string, b: string, t: number): string => {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b);
  const h = (x: number, y: number) => Math.round(x * (1 - t) + y * t).toString(16).padStart(2, '0');
  return `#${h(r1, r2)}${h(g1, g2)}${h(b1, b2)}`;
};

export interface Customisation { accent?: string; logo?: string }
export type Resolved = { ok: true; palette: Palette } | { ok: false; message: string };

/** The template's palette with the owner's accent colour on top. A colour that would be hard to read on this template's background is refused with a plain message. */
export function resolvePalette(t: StoreTemplate, accent?: string): Resolved {
  if (accent === undefined || accent === '') return { ok: true, palette: t.palette };
  if (!isHex(accent)) return { ok: false, message: 'Use a colour like #6a47d6.' };
  const a = accent.toLowerCase();
  if (contrast(a, t.palette.bg) < 3) return { ok: false, message: 'That colour is too close to the background to read. Pick a darker one.' };
  const accentInk = contrast('#ffffff', a) >= contrast('#111111', a) ? '#ffffff' : '#111111';
  return { ok: true, palette: { ...t.palette, accent: a, accentInk, soft: mix(a, t.palette.bg, 0.88) } };
}

// ---------- Logo ----------
export const LOGO_MAX_BYTES = 150 * 1024;
const MAGIC: Record<string, (b: Buffer) => boolean> = {
  'image/png': (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/jpeg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
};
/** A logo is a small PNG, JPEG or WebP stored as a data URL. SVG is refused (it can carry script). The bytes must match the stated type. */
export function checkLogo(v: unknown): { ok: true; logo: string } | { ok: false; message: string } {
  if (typeof v !== 'string') return { ok: false, message: 'The logo must be an image.' };
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(v);
  if (!m) return { ok: false, message: 'Use a PNG, JPEG or WebP logo.' };
  const bytes = Buffer.from(m[2]!, 'base64');
  if (bytes.length > LOGO_MAX_BYTES) return { ok: false, message: 'The logo is too big. Keep it under 150 KB.' };
  if (!MAGIC[m[1]!]!(bytes)) return { ok: false, message: 'That file is not really a ' + m[1]!.replace('image/', '').toUpperCase() + ' image.' };
  return { ok: true, logo: v };
}
export const LOGO_DATA_URL = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/** Put a template (and optional accent/logo) on a store config. Returns a new config; the owner's text, products and policies are untouched. */
export function applyTemplate(config: StoreConfig, templateId: string, custom: Customisation = {}): { ok: true; config: StoreConfig } | { ok: false; message: string } {
  const t = templateById(templateId);
  if (!t) return { ok: false, message: 'Unknown template.' };
  const accent = custom.accent === '' ? undefined : custom.accent;
  const pal = resolvePalette(t, accent);
  if (!pal.ok) return pal;
  let logo: string | undefined = config.brand.logo;
  if (custom.logo !== undefined) { if (custom.logo === '') logo = undefined; else { const l = checkLogo(custom.logo); if (!l.ok) return l; logo = l.logo; } }
  const brand: StoreConfig['brand'] = { ...config.brand, font: t.font, template: t.id };
  if (accent) brand.accent = accent.toLowerCase(); else delete brand.accent;
  if (logo) brand.logo = logo; else delete brand.logo;
  return { ok: true, config: { ...config, brand, sections: [...t.sections] } };
}

/** The data attributes the stylesheet reads. One place, so the shop, the picker preview and the gallery always agree. */
export function layoutAttrs(t: StoreTemplate): Record<string, string> {
  return { 'data-hero': t.hero, 'data-grid': t.grid, 'data-head': t.head, 'data-flow': t.flow, 'data-trust': t.trust, 'data-cards': t.cards, 'data-radius': t.radius };
}
