// Store registry (AMP-032): the public, read-only view the storefront routes use. It answers two questions only:
// "which stores exist" and "what is the PUBLISHED version of this one". Drafts are not reachable from here.
import { createSiteVersionStore, demoActorA, demoActorB, seedDemoSites } from '../site-versions/index.ts';
import type { PublicResolution, SiteVersionStore } from '../site-versions/index.ts';
import { matchesSitesSlugCheck } from './slug.ts';

export interface StoreRegistry {
  /** Every known store address (published or not). Used for uniqueness checks and as the sitemap candidate list. */
  slugs(): Promise<string[]>;
  /** The live published snapshot, `paused`, or `none`. Never a draft. */
  resolve(slug: string): Promise<PublicResolution>;
}

/** Registry over a site-version store. `listSlugs` supplies the enumeration the public interface does not have. */
export function registryFromSiteVersions(store: SiteVersionStore, listSlugs: () => Promise<string[]>): StoreRegistry {
  return {
    slugs: listSlugs,
    // Fail closed: anything that is not a valid slug never reaches the store lookup.
    resolve: async (slug) => (matchesSitesSlugCheck(slug) ? store.resolvePublished(slug) : { status: 'none' }),
  };
}

const KEY = Symbol.for('aimp.hosts.defaultRegistry');
type Holder = { [KEY]?: Promise<StoreRegistry> };

/**
 * Keep one promise in `holder[key]`. If it rejects, the cache is cleared so the next call retries instead of
 * serving a failed promise forever.
 */
export function memoizeUnlessRejected<T, K extends PropertyKey>(holder: { [P in K]?: Promise<T> }, key: K, make: () => Promise<T>): Promise<T> {
  const existing = holder[key];
  if (existing) return existing;
  const p = make();
  holder[key] = p;
  p.catch(() => { if (holder[key] === p) delete holder[key]; });
  return p;
}

/**
 * The registry the running app uses today: the two DEMO stores, each published once. The database-backed registry
 * (published site_versions rows) replaces this by implementing StoreRegistry. Kept on globalThis so every route
 * bundle in one server process sees the same store (and any pause or rollback applied to it).
 *
 * IMPORTANT: both demo stores are `demo: true`, which is noindex. Until a DB-backed registry replaces this one, the
 * LIVE sitemap and robots output has no store URLs (sitemaps are empty, store robots.txt says Disallow) by design.
 * The sitemap and robots logic is proven with non-demo fixtures in test/aimp-hosts-seo.test.ts.
 */
export function getDefaultRegistry(): Promise<StoreRegistry> {
  return memoizeUnlessRejected(globalThis as unknown as Holder, KEY, async () => {
    const store = createSiteVersionStore();
    await seedDemoSites(store);
    const list = async () => {
      const out: string[] = [];
      for (const actor of [demoActorA, demoActorB]) {
        const r = await store.listSites(actor);
        if (r.ok) out.push(...r.value);
      }
      return out;
    };
    return registryFromSiteVersions(store, list);
  });
}
