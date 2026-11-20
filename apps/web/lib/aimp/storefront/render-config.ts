// Pure render configuration shared by every store: the same function turns any validated StoreConfig into theme variables.
import { storeThemes, type StoreConfig, type StoreFont } from './schema.ts';
import { templateById, resolvePalette } from './templates.ts';

export const fontStacks: Record<StoreFont, string> = {
  serif: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif",
  rounded: "ui-rounded, 'SF Pro Rounded', 'Nunito', -apple-system, sans-serif",
};

export interface RenderConfig {
  cssVars: Record<string, string>;
  brandName: string;
  demo: boolean;
  /** Layout switches the stylesheet reads. Empty for the plain theme. */
  attrs: { 'data-hero'?: string; 'data-cards'?: string; 'data-radius'?: string };
  logo?: string;
  robots: { index: false; follow: false } | undefined;
}

export function renderConfig(store: StoreConfig): RenderConfig {
  const tpl = templateById(store.brand.template);
  const resolved = tpl ? resolvePalette(tpl, store.brand.accent) : null;
  const t = resolved && resolved.ok ? resolved.palette : storeThemes[store.brand.theme];
  return {
    attrs: tpl ? { 'data-hero': tpl.hero, 'data-cards': tpl.cards, 'data-radius': tpl.radius } : {},
    ...(store.brand.logo ? { logo: store.brand.logo } : {}),
    cssVars: {
      '--st-bg': t.bg, '--st-surface': t.surface, '--st-ink': t.ink, '--st-muted': t.muted, '--st-line': t.line,
      '--st-accent': t.accent, '--st-accent-ink': t.accentInk, '--st-soft': t.soft, '--st-font': fontStacks[store.brand.font],
    },
    brandName: store.brand.name,
    demo: store.demo,
    robots: store.demo ? { index: false, follow: false } : undefined,
  };
}
