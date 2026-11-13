import { NextResponse, type NextRequest } from 'next/server';
import { storeRewritePath, storeSlugFromHost } from './lib/aimp/storefront/tenant';

// Multi-tenant storefront routing (plan §D01/§D05). `<slug>.<AIMP_STORE_ROOT_DOMAIN>` is served from /s/<slug>, so a
// store subdomain can only ever reach its own store pages. With the env var unset (default) nothing is rewritten.
export function proxy(request: NextRequest) {
  const slug = storeSlugFromHost(request.headers.get('host'), process.env.AIMP_STORE_ROOT_DOMAIN);
  if (!slug) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = storeRewritePath(slug, url.pathname);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/|api/|favicon.ico|icon.png|apple-icon.png|manifest.webmanifest).*)'],
};
