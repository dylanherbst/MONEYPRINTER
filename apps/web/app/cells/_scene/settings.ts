// Look settings for the cells page. Every value can be changed live from the Tune panel and is kept in the address
// (?bg=ffffff&c1=…), so a look can be shared as a link and survives a reload.

export interface CellSettings {
  /** Page background, hex without '#'. */
  bg: string;
  /** Main cell colour. */
  c1: string;
  /** Second cell colour; each cell gets a random mix of c1 and c2. */
  c2: string;
  /** Number of cells, in thousands. */
  count: number;
  /** Cell size multiplier. */
  size: number;
  /** Drift and spin speed multiplier (0 = still). */
  speed: number;
  /** Colour of the soft waves in the background. */
  wave: string;
  /** How strongly the waves show, 0 (off) to 1. */
  waveAmt: number;
}

export const defaults: CellSettings = { bg: 'ffffff', c1: '6d28d9', c2: 'c4b5fd', count: 14, size: 1, speed: 1, wave: 'ece6ff', waveAmt: 0.8 };

export const presets: { name: string; values: Partial<CellSettings> }[] = [
  { name: 'White and purple', values: { bg: 'ffffff', c1: '6d28d9', c2: 'c4b5fd', wave: 'ece6ff' } },
  { name: 'Lavender mist', values: { bg: 'f6f3ff', c1: '7c3aed', c2: 'f0abfc', wave: 'e4dbff' } },
  { name: 'Plum and peach', values: { bg: 'fff8f3', c1: '5b21b6', c2: 'fdba74', wave: 'f3e6ff' } },
  { name: 'Night', values: { bg: '0b0716', c1: '8b5cf6', c2: 'f472b6', wave: '241743' } },
];

export const limits = {
  count: { min: 4, max: 40, step: 1 },
  size: { min: 0.4, max: 2.5, step: 0.05 },
  speed: { min: 0, max: 3, step: 0.05 },
  waveAmt: { min: 0, max: 1, step: 0.05 },
} as const;

const HEX = /^[0-9a-f]{6}$/i;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function readSettings(search: string): CellSettings {
  const p = new URLSearchParams(search);
  const hex = (k: 'bg' | 'c1' | 'c2' | 'wave') => {
    const v = (p.get(k) ?? '').replace('#', '');
    return HEX.test(v) ? v.toLowerCase() : defaults[k];
  };
  const num = (k: keyof typeof limits) => {
    const v = Number(p.get(k));
    return p.has(k) && Number.isFinite(v) ? clamp(v, limits[k].min, limits[k].max) : defaults[k];
  };
  return {
    bg: hex('bg'), c1: hex('c1'), c2: hex('c2'), count: num('count'), size: num('size'), speed: num('speed'),
    wave: hex('wave'), waveAmt: num('waveAmt'),
  };
}

/** Writes only the values that differ from the defaults, so the plain address means the default look. */
export function writeSettings(s: CellSettings, search: string): string {
  const p = new URLSearchParams(search);
  for (const k of Object.keys(defaults) as (keyof CellSettings)[]) {
    if (s[k] === defaults[k]) p.delete(k);
    else p.set(k, String(s[k]));
  }
  const q = p.toString();
  return q ? `?${q}` : '';
}

/** Relative luminance 0..1, used to pick dark or light text for the chosen background. */
export function luminance(hex: string): number {
  const ch = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
