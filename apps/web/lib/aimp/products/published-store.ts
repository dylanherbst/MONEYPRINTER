// AMP-100: does a PUBLISHED store still show a product? Used by archiveProduct so a page can ask the owner to republish.
// A published store is an immutable snapshot (AMP-031): archiving a product does not change it, so until the owner
// publishes again the store keeps listing the product (with a buy button that checkout now refuses).
import type { PublicResolution } from '../site-versions/store.ts';
import type { ProductRecord } from './types.ts';

/** 'unknown' means the answer could not be worked out (no data, or the lookup failed). It is never read as "not shown". */
export type StoreShowsProduct = 'shown' | 'not_shown' | 'unknown';

export interface PublishedStoreProbe {
  isProductShown(ctx: { workspaceId: string }, product: ProductRecord): Promise<StoreShowsProduct>;
}

export interface SitePublishedStoreProbeDeps {
  /** Public, live-only lookup of a store by slug (SiteVersionStore.resolvePublished, or the store registry). */
  resolvePublished(slug: string): Promise<PublicResolution>;
  /** The store slug of the product's business. MUST be tenant-scoped (workspace AND business): the probe cannot verify it. null: no store. */
  storeSlugFor(ctx: { workspaceId: string }, product: ProductRecord): Promise<string | null>;
  /** The slugs the store snapshot would carry for this product (e.g. the slug of every listing title it was published with). */
  productSlugsFor(ctx: { workspaceId: string }, product: ProductRecord): Promise<string[]>;
}

/** Probe over real published-site data. A paused or never-published store shows nothing, so it is 'not_shown'. */
export function createSitePublishedStoreProbe(deps: SitePublishedStoreProbeDeps): PublishedStoreProbe {
  return {
    async isProductShown(ctx, product) {
      const slug = await deps.storeSlugFor(ctx, product);
      if (!slug) return 'not_shown';
      const resolved = await deps.resolvePublished(slug);
      if (resolved.status !== 'live') return 'not_shown';
      // The published snapshot carries no workspace, business, product or listing id (StoreProduct is slug-based), so the
      // only link to a product is its slug, and a store can rename or de-duplicate a slug. A miss is therefore not proof.
      if (resolved.config.products.length === 0) return 'not_shown'; // live but empty: nothing to show
      const slugs = await deps.productSlugsFor(ctx, product);
      if (slugs.length === 0) return 'unknown'; // cannot tell which store product this is: do not claim it is gone
      return resolved.config.products.some((p) => slugs.includes(p.slug)) ? 'shown' : 'unknown';
    },
  };
}
