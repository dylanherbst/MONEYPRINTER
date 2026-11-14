// Store lookup. Today only the DEMO fixture exists; the database-backed loader (published site_versions) replaces this.
import { demoStore } from './demo-store.ts';
import { demoStoreB } from './demo-store-b.ts';
import { getDefaultRegistry, type StoreRegistry } from '../hosts/registry.ts';
import { validateStoreConfig, type StoreBundle, type StoreConfig, type StoreProduct } from './schema.ts';

const fixtures: ReadonlyMap<string, StoreConfig> = new Map([demoStore, demoStoreB].map((s) => [s.slug, s]));

export function loadStore(slug: string): StoreConfig | null {
  const candidate = fixtures.get(slug) ?? null;
  if (!candidate) return null;
  const checked = validateStoreConfig(candidate);
  // Fail closed: a config that does not validate is never rendered.
  return checked.ok && checked.config.status === 'published' ? checked.config : null;
}

/**
 * What every public store route uses (AMP-032). Returns the PUBLISHED snapshot only: a store that was never published,
 * is paused, or no longer validates comes back null, so a draft can never render. `loadStore` above is the fixture
 * lookup kept for tests and the demo page; routes must not use it.
 */
export async function loadPublishedStore(slug: string, registry?: StoreRegistry): Promise<StoreConfig | null> {
  if (typeof slug !== 'string') return null;
  const r = await (registry ?? (await getDefaultRegistry())).resolve(slug);
  if (r.status !== 'live') return null;
  // Same fail-closed rules as loadStore: a snapshot must validate and be marked published, and must belong to this address.
  const checked = validateStoreConfig(r.config);
  return checked.ok && checked.config.status === 'published' && checked.config.slug === slug ? checked.config : null;
}

export const findProduct =(store: StoreConfig, slug: string): StoreProduct | undefined => store.products.find((p) => p.slug === slug);
export const bundleItems = (store: StoreConfig, bundle: StoreBundle): StoreProduct[] =>
  bundle.productSlugs.map((s) => findProduct(store, s)).filter((p): p is StoreProduct => Boolean(p));

const aud = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
export const formatPrice = (minor: number): string => aud.format(minor / 100);

/** Flipped to true only when the Stripe checkout route (plan §E02) and verified webhooks (§E03) ship. */
export const checkoutBuilt = false;

export type PurchaseState = { canBuy: true } | { canBuy: false; reason: string };
/** One rule for every buy button: checkout must exist, the store must not be a demo and the merchant must be live. */
export function purchaseState(store: StoreConfig, built: boolean = checkoutBuilt): PurchaseState {
  if (store.demo) return { canBuy: false, reason: 'Demo store: checkout is turned off.' };
  if (!store.merchant.chargesEnabled) return { canBuy: false, reason: 'Checkout opens once the owner finishes payment setup.' };
  if (!built) return { canBuy: false, reason: 'Checkout is not available yet.' };
  return { canBuy: true };
}

export const policyPages = { refund: 'Refund policy', privacy: 'Privacy policy', terms: 'Terms of sale' } as const;
export type PolicyPage = keyof typeof policyPages;
export const isPolicyPage = (v: string): v is PolicyPage => Object.hasOwn(policyPages, v);
