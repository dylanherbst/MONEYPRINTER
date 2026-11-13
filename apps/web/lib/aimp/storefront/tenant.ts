// Host → store resolution for the multi-tenant storefront (plan §D01/§D05). Pure, so it is unit-tested.

/** Subdomains a seller can never claim. */
export const reservedStoreSlugs: ReadonlySet<string> = new Set([
  'www', 'app', 'api', 'admin', 'auth', 'login', 'mail', 'email', 'status', 'help', 'support', 'docs', 'blog', 'store',
  'shop', 'stores', 'dashboard', 'static', 'assets', 'cdn', 'files', 'download', 'downloads', 'billing', 'checkout',
  'staging', 'preview', 'dev', 'test', 'demo-admin', 'aimoneyprinter', 'ventra',
]);
const LABEL = /^[a-z0-9](?:[a-z0-9]|-(?!-)){1,61}[a-z0-9]$/;

export function isClaimableStoreSlug(slug: string): boolean {
  return LABEL.test(slug) && !reservedStoreSlugs.has(slug);
}

/**
 * `calm-planners.example.com` with root `example.com` → `calm-planners`. Anything else (the root itself, `www`,
 * deeper subdomains, other hosts, a missing root) → null, so the request is served by the main app unchanged.
 */
export function storeSlugFromHost(host: string | null | undefined, rootDomain: string | null | undefined): string | null {
  if (!host || !rootDomain) return null;
  const h = host.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  const root = rootDomain.trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  if (!root || h === root || !h.endsWith(`.${root}`)) return null;
  const sub = h.slice(0, -(root.length + 1));
  if (sub.includes('.')) return null;
  return isClaimableStoreSlug(sub) ? sub : null;
}

/** Path the proxy rewrites a tenant request to. Keeps the visitor's own path and query untouched. */
export function storeRewritePath(slug: string, pathname: string): string {
  return `/s/${slug}${pathname === '/' ? '' : pathname}`;
}
