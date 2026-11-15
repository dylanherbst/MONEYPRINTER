// The owner workspace navigation list as plain data (no React, no Next), so the node tests can check it. The bar itself is
// workspace-nav.tsx. Add a page here when its route exists; a page that is not built yet stays `ready: false` and is not a link.
export interface NavItem { label: string; segment: string; ready: boolean }

export const workspaceNavItems: readonly NavItem[] = [
  { label: 'Overview', segment: '', ready: true },
  { label: 'Dashboard', segment: 'dashboard', ready: true },
  { label: 'Brand', segment: 'brand', ready: true },
  { label: 'Products', segment: 'products', ready: true },
  { label: 'Orders', segment: 'orders', ready: true },
  { label: 'Website', segment: 'website', ready: true },
  { label: 'Domains', segment: 'domains', ready: true },
  { label: 'Payments', segment: 'payments', ready: true },
  { label: 'Marketing', segment: 'marketing', ready: true },
  { label: 'Approvals', segment: 'approvals', ready: true },
  { label: 'Operator', segment: 'operator', ready: true },
];

/** Where a nav item goes for this business, or null while its page is not built (the bar then draws plain "Soon" text, never a link). */
export const workspaceNavHref = (business: string, item: NavItem): string | null =>
  !item.ready ? null : item.segment ? `/app/${business}/${item.segment}` : `/app/${business}`;

/** The first path segment after `/app/<business>`, which decides the highlighted item (so the editor keeps "Products" lit). */
export function currentSegment(pathname: string, business: string): string {
  const base = `/app/${business}`;
  const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/^\//, '') : '';
  return rest.split('/')[0] ?? '';
}
