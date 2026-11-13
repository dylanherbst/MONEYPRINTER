import { headers } from 'next/headers';
import { storeSlugFromHost } from '../../../../lib/aimp/storefront/tenant';

/**
 * Link prefix: '' when the visitor is on the store's own subdomain (proxy.ts rewrote the request), `/s/<slug>` when
 * previewed on the app host. Derived from the host the visitor used; it only changes link paths, never data access.
 */
export async function storeBase(slug: string): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  return storeSlugFromHost(host, process.env.AIMP_STORE_ROOT_DOMAIN) === slug ? '' : `/s/${slug}`;
}
