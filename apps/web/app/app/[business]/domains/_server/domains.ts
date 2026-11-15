// Server reads for Domains and availability (screen 17, AMP-088). Plain functions that take the runtime and the environment as
// arguments, so they run in the node tests without Next. No address rule lives here: every answer comes from lib/aimp/hosts
// (slug.ts for the name rules, registry.ts for the published state, resolve.ts for the store domain, paths.ts for the page list).
//
// WHAT THE /START DEMO REALLY HAS. The /start runtime (`JourneyRuntime`, app/start/_server/runtime.ts) keeps each business's store
// name in `slugs` and its site versions in `sites`. Those are read here for ONE business. But the public store pages (`/s/<store>`
// and the store subdomains) read `getDefaultRegistry()` (two fixed demo stores), not this runtime, so a store published in /start
// has no address a visitor can open. `PUBLIC_PAGES_SERVE_THIS_RUNTIME` says so and the page says so. See `MISSING_WIRING`.
import { policyPagesList } from '../../../../../lib/aimp/hosts/paths.ts';
import { registryFromSiteVersions } from '../../../../../lib/aimp/hosts/registry.ts';
import { configuredStoreDomains, resolveStoreHost } from '../../../../../lib/aimp/hosts/resolve.ts';
import type { HostEnv } from '../../../../../lib/aimp/hosts/resolve.ts';
import { isClaimableStoreSlug } from '../../../../../lib/aimp/hosts/slug.ts';
import type { SiteVersionStore } from '../../../../../lib/aimp/site-versions/store.ts';
import { isKnownBusiness } from '../../_server/overview.ts';
import type { OverviewRuntime } from '../../_server/overview.ts';
import type { DomainsInput } from '../view-model.ts';

/** The parts of the /start runtime this page reads. `JourneyRuntime` satisfies this. */
export type DomainsRuntime = Pick<OverviewRuntime, 'businesses' | 'seeds' | 'slugs' | 'productIds' | 'sites'>;

/** False today: the public store pages do not read the /start runtime's stores (see the file header). */
export const PUBLIC_PAGES_SERVE_THIS_RUNTIME = false;

/** What is needed before a /start store can be opened by a visitor (reported to the owner, shown nowhere as a promise). */
export const MISSING_WIRING = [
  'a store registry over the /start runtime\'s site versions (registryFromSiteVersions(rt.sites, ...)) used by the public store pages instead of, or beside, getDefaultRegistry()',
  'the production store domain (AIMP_STORE_ROOT_DOMAIN, with its wildcard DNS), which waits on the owner (AMP-033-D)',
  'custom domains (AMP-111): nothing models a seller-owned domain yet, so the page only says "coming later"',
] as const;

/** Only the two store domain names are passed on, never the rest of the environment. */
export const storeEnv = (env: HostEnv): HostEnv => ({ AIMP_STORE_ROOT_DOMAIN: env.AIMP_STORE_ROOT_DOMAIN, AIMP_STORE_TEST_DOMAIN: env.AIMP_STORE_TEST_DOMAIN });

/** The store's built-in address on a configured store domain, proven by resolving it back to this exact store name. */
export function builtInHost(slug: string, env: HostEnv): DomainsInput['host'] {
  for (const domain of configuredStoreDomains(env)) {
    const name = `${slug}.${domain}`;
    const r = resolveStoreHost(name, env);
    if (r.kind === 'store' && r.slug === slug) return { name, via: r.via };
  }
  return null;
}

export type DomainsLookup = { found: false } | { found: true; input: DomainsInput };

/**
 * Unknown business => `found: false`. The store name is looked up by this business id only, and the published state is read
 * for that name only, through the hosts registry (which refuses anything that is not a valid store name and never returns a draft).
 */
export async function loadDomains(rt: DomainsRuntime, env: HostEnv, businessId: string, served: boolean = PUBLIC_PAGES_SERVE_THIS_RUNTIME): Promise<DomainsLookup> {
  if (!isKnownBusiness(rt, businessId)) return { found: false };
  const slug = rt.slugs.get(businessId) ?? null;
  const base = { served, policyPages: policyPagesList };
  if (!slug) return { found: true, input: { ...base, slug: null, slugOk: false, published: 'none', version: null, host: null } };
  const slugOk = isClaimableStoreSlug(slug);
  // `resolve` is the only registry call made here, so the slug list is not needed.
  const registry = registryFromSiteVersions(rt.sites as SiteVersionStore, async () => []);
  const pub = await registry.resolve(slug);
  return {
    found: true,
    input: {
      ...base, slug, slugOk, published: pub.status, version: pub.status === 'live' ? pub.version : null,
      host: slugOk ? builtInHost(slug, storeEnv(env)) : null,
    },
  };
}
