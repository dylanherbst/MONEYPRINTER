// Products page (screen 12, AMP-083). Pure helpers: no React, no Next, no storage, so node:test loads them.
// Nothing here is a product or pricing rule. What a product is, and its price, come from the product and catalogue services;
// this file only decides how that is grouped and worded for the screen.
//
// STATUS. The product service has no "archived" state and no archive operation, so the three filters are:
//   active    the product has an approved listing in the catalogue (the store can sell it)
//   draft     everything else that exists: still being built or reviewed, or approved but not listed yet
//   archived  always empty today (the services cannot archive); the page says so
import { formatMoney } from '../../../../lib/aimp/overview/format.ts';
import type { ProductVersion } from '../../../../lib/aimp/products/types.ts';
import type { CatalogueListing } from '../../../../lib/aimp/catalogue/types.ts';

export const statusFilters = ['all', 'active', 'draft', 'archived'] as const;
export type StatusFilter = (typeof statusFilters)[number];
export type ProductStatus = 'active' | 'draft' | 'archived';

export const filterNames: Record<StatusFilter, string> = { all: 'All', active: 'Active', draft: 'Draft', archived: 'Archived' };
export const statusNames: Record<ProductStatus, string> = { active: 'Active', draft: 'Draft', archived: 'Archived' };

/** Reads `?status=` safely: a missing, repeated or unknown value is "all". */
export function parseFilter(raw: string | string[] | undefined): StatusFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return (statusFilters as readonly string[]).includes(v ?? '') ? (v as StatusFilter) : 'all';
}

export const filterHref = (businessId: string, f: StatusFilter): string => `/app/${businessId}/products${f === 'all' ? '' : `?status=${f}`}`;

/** What the server reads for one product, straight from the services. */
export interface ProductSource {
  id: string;
  /** Blueprint title, or null when the blueprint is no longer in the registry. */
  typeTitle: string | null;
  versions: Pick<ProductVersion, 'version' | 'status' | 'qaPassed' | 'spec'>[];
  listing: Pick<CatalogueListing, 'version' | 'status' | 'priceMinor' | 'currency'>[];
}

export interface ProductRow {
  id: string;
  name: string;
  type: string;
  status: ProductStatus;
  statusLabel: string;
  /** Why it has this status, in plain words. */
  detail: string;
  price: string;
  priceNote: string;
}

const NO_PRICE = 'No price yet';

export function buildRow(src: ProductSource, currencyFallback = 'AUD'): ProductRow {
  const latest = src.versions[src.versions.length - 1];
  const approvedVersion = src.versions.find((v) => v.status === 'approved');
  const approvedListing = src.listing.find((l) => l.status === 'approved');
  const latestListing = src.listing[src.listing.length - 1];
  const active = Boolean(approvedListing);

  let detail: string;
  if (active) detail = 'Approved and in your catalogue.';
  else if (approvedVersion) detail = latestListing ? 'The product is approved. Its listing still needs your approval.' : 'The product is approved but has no listing yet.';
  else if (latest && !latest.qaPassed) detail = 'Failed a check. Rebuild it in guided set-up.';
  else detail = 'Built, waiting for your approval.';

  let price = NO_PRICE;
  let priceNote = 'Set when you write the listing.';
  const shown = approvedListing ?? latestListing;
  if (shown) {
    price = formatMoney({ amountMinor: shown.priceMinor, currency: shown.currency || currencyFallback });
    priceNote = approvedListing ? (latestListing && latestListing.version !== approvedListing.version ? 'Approved price. A newer draft price is waiting.' : 'Approved price.') : 'Draft price, not approved yet.';
  }
  return {
    id: src.id,
    name: (latest?.spec.title ?? '').trim() || 'Untitled product',
    type: src.typeTitle ?? 'Product',
    status: active ? 'active' : 'draft',
    statusLabel: active ? statusNames.active : statusNames.draft,
    detail, price, priceNote,
  };
}

export const buildRows = (sources: ProductSource[]): ProductRow[] => sources.map((s) => buildRow(s));

export const applyFilter = (rows: ProductRow[], f: StatusFilter): ProductRow[] => (f === 'all' ? rows : rows.filter((r) => r.status === f));

export const filterCounts = (rows: ProductRow[]): Record<StatusFilter, number> => ({
  all: rows.length, active: rows.filter((r) => r.status === 'active').length, draft: rows.filter((r) => r.status === 'draft').length, archived: 0,
});

export const ARCHIVE_NOTE = "Archiving isn't available yet. For now, products can't be put away from this page.";
export const BUNDLES_NOTE = 'Bundles are not available yet.';

export interface EmptyCopy { title: string; text: string }

/** Plain-English empty state per filter. `total` is the number of products the business has at all. */
export function emptyCopy(f: StatusFilter, total: number): EmptyCopy {
  if (f === 'archived') return { title: 'Nothing is archived', text: ARCHIVE_NOTE };
  if (total === 0) return { title: 'No products yet', text: 'Add your first product below. It is built from the idea you chose in guided set-up.' };
  switch (f) {
    case 'active': return { title: 'No active products yet', text: 'A product becomes active once you approve it and approve its listing. Look under Draft to see what is waiting.' };
    case 'draft': return { title: 'No drafts', text: 'Everything you have built is already active.' };
    default: return { title: 'No products yet', text: 'Add your first product below.' };
  }
}

export interface CreatePlan {
  canCreate: boolean;
  /** Why not, in plain words; empty when allowed. */
  reason: string;
  remaining: number;
}

/** Whether another product can be added, from how many exist, the demo limit, and whether the business has an idea to build from. */
export function planCreate(input: { hasSeed: boolean; count: number; max: number }): CreatePlan {
  const remaining = Math.max(0, input.max - input.count);
  if (!input.hasSeed) return { canCreate: false, reason: 'Choose your business idea in guided set-up first. Products are built from it.', remaining };
  if (remaining === 0) return { canCreate: false, reason: `This demo is limited to ${input.max} products per business.`, remaining };
  return { canCreate: true, reason: '', remaining };
}
