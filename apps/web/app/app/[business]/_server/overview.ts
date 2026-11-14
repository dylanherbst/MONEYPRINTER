// Adapters for the Business Overview page (AMP-081, screen 10, H01): they feed the AMP-080 read model (`OverviewDeps`) from the
// in-memory DEMO runtime the /start journey fills. Plain functions that take the runtime as an argument, so they run in the
// node tests without Next. Every read passes the workspace AND the business; orders (listed per workspace) are filtered again here
// and by `collectOverviewSnapshot`.
//
// What is really wired, and what is not (see `OVERVIEW_SOURCES`):
//   wired   steps (seeds, brand, products, catalogue), store (site versions), orders (optional source), approvals and activity
//           (optional source), business name and currency
//   absent  analytics (visits stay "Not measured yet"), fulfilment and money events (the fulfilment demo is its own fixed world),
//           seller readiness (no seller account exists for a /start business, so payments read as not connected)
import type { BrandStore } from '../../../../lib/aimp/branding/store.ts';
import { getApprovedBrand } from '../../../../lib/aimp/branding/service.ts';
import type { CatalogueService } from '../../../../lib/aimp/catalogue/service.ts';
import type { OperationContext } from '../../../../lib/aimp/catalogue/types.ts';
import type { ProductService } from '../../../../lib/aimp/products/service.ts';
import type { Order } from '../../../../lib/aimp/orders/types.ts';
import { getBusinessOverview } from '../../../../lib/aimp/overview/index.ts';
import type {
  BusinessOverview, OverviewBuildSteps, OverviewDeps, OverviewOrder, OverviewScope, OverviewStore, Tenanted,
} from '../../../../lib/aimp/overview/index.ts';
import { deriveReadiness } from '../../../../lib/aimp/sellers/readiness.ts';
import type { ActivityEntry, ApprovalView } from '../../../../lib/aimp/automation/types.ts';
import type { SiteVersionStore } from '../../../../lib/aimp/site-versions/store.ts';
import type { Actor } from '../../../../lib/aimp/site-versions/store.ts';

/** The parts of the /start runtime the overview reads. `JourneyRuntime` satisfies this. */
export interface OverviewRuntime {
  products: Pick<ProductService, 'listVersions'>;
  brands: BrandStore;
  catalogue: Pick<CatalogueService, 'listApprovedForBusiness'>;
  sites: Pick<SiteVersionStore, 'resolvePublished'>;
  seeds: { has(businessId: string): boolean };
  productIds: { get(businessId: string): string[] | undefined };
  slugs: { get(businessId: string): string | undefined };
  businesses: { has(businessId: string): boolean };
}

/** The contexts the /start runtime uses for the same reads (from `app/start/_server/runtime.ts`). */
export interface OverviewContexts {
  workspaceId: string;
  productCtx: { workspaceId: string; actorId: string };
  brandCtx: { workspaceId: string };
  siteActor: Actor;
  catalogueCtx: (businessId: string) => OperationContext;
}

/** Optional sources the page may add. Each is read for ONE business; an absent source reads as "nothing there". */
export interface OverviewExtras {
  /** Orders for the whole workspace (as the order store lists them); filtered to the business here. */
  orders?: (workspaceId: string) => Promise<Order[]>;
  approvals?: (scope: OverviewScope) => Promise<ApprovalView[]>;
  activity?: (scope: OverviewScope) => Promise<ActivityEntry[]>;
}

/** The two automation reads the overview uses. `AutomationService` satisfies this. */
export interface AutomationReads {
  approvals(ctx: OperationContext, filter?: { status?: ApprovalView['status'] }): Promise<ApprovalView[]>;
  activity(ctx: OperationContext, opts?: { limit?: number }): Promise<{ entries: ActivityEntry[] }>;
}

/**
 * Approvals and activity for ONE business. The context carries the workspace and the business, so the automation service itself
 * returns only that business's records; the scope is never taken from anywhere else.
 */
export function automationExtras(automation: () => AutomationReads, ctxFor: (scope: OverviewScope) => OperationContext, limit = 10): Pick<OverviewExtras, 'approvals' | 'activity'> {
  return {
    approvals: async (s) => automation().approvals(ctxFor(s)),
    activity: async (s) => (await automation().activity(ctxFor(s), { limit })).entries,
  };
}

export const OVERVIEW_SOURCES = {
  steps: 'wired', store: 'wired', orders: 'wired when the checkout demo is on', approvals: 'wired when the automation demo is on',
  activity: 'wired when the automation demo is on', analytics: 'absent', fulfilment: 'absent', moneyEvents: 'absent', seller: 'absent (not connected)',
} as const;

/** True when the server has seen this business: it wrote a seed, brand, product, listing or site, or was admitted by /start. */
export function isKnownBusiness(rt: Pick<OverviewRuntime, 'businesses' | 'seeds' | 'slugs' | 'productIds'>, businessId: string): boolean {
  return rt.businesses.has(businessId) || rt.seeds.has(businessId) || rt.slugs.get(businessId) !== undefined || (rt.productIds.get(businessId)?.length ?? 0) > 0;
}

export async function readBuildSteps(rt: OverviewRuntime, ctx: OverviewContexts, scope: OverviewScope): Promise<OverviewBuildSteps> {
  const { businessId } = scope;
  const ideaChosen = isKnownBusiness(rt, businessId);
  const brandSaved = Boolean(await getApprovedBrand({ store: rt.brands }, ctx.brandCtx, businessId));
  let productApproved = false;
  for (const id of rt.productIds.get(businessId) ?? []) {
    const versions = await rt.products.listVersions(ctx.productCtx, id);
    if (versions.some((v) => v.status === 'approved')) { productApproved = true; break; }
  }
  const catalogueApproved = (await rt.catalogue.listApprovedForBusiness(ctx.catalogueCtx(businessId), businessId)).length > 0;
  return { ideaChosen, brandSaved, productApproved, catalogueApproved };
}

export type StoreStatus = 'no_site' | 'draft' | 'live' | 'paused';

/** The store as the overview needs it. The demo store has no public address yet, so `url` is always null. */
export async function readStore(rt: OverviewRuntime, scope: OverviewScope): Promise<{ store: OverviewStore; status: StoreStatus }> {
  const slug = rt.slugs.get(scope.businessId);
  if (!slug) return { store: { published: false, url: null, publishedAt: null, lastPublishFailed: false }, status: 'no_site' };
  const pub = await rt.sites.resolvePublished(slug);
  if (pub.status === 'live') return { store: { published: true, url: null, publishedAt: pub.publishedAt, lastPublishFailed: false }, status: 'live' };
  return { store: { published: false, url: null, publishedAt: null, lastPublishFailed: false }, status: pub.status === 'paused' ? 'paused' : 'draft' };
}

export async function readBusinessName(rt: OverviewRuntime, ctx: OverviewContexts, businessId: string): Promise<string | null> {
  const brand = await getApprovedBrand({ store: rt.brands }, ctx.brandCtx, businessId);
  return brand?.name ?? null;
}

export const toOverviewOrder = (o: Order): Tenanted<OverviewOrder> => ({
  id: o.id, title: o.title, status: o.status, amountMinor: o.amountMinor, currency: o.currency, createdAt: o.createdAt, paidAt: o.paidAt,
  workspaceId: o.workspaceId, businessId: o.businessId,
});

/** `OverviewDeps` over the /start runtime. */
export function createRuntimeOverviewDeps(rt: OverviewRuntime, ctx: OverviewContexts, extras: OverviewExtras, now: () => Date): OverviewDeps {
  return {
    orders: { list: async (s) => (extras.orders ? (await extras.orders(s.workspaceId)).map(toOverviewOrder) : []) },
    fulfilment: { list: async () => [], moneyEvents: async () => [] },
    seller: { readiness: async () => deriveReadiness(null) },
    store: { get: async (s) => (await readStore(rt, s)).store },
    steps: { get: (s) => readBuildSteps(rt, ctx, s) },
    automation: { approvals: async (s) => (extras.approvals ? extras.approvals(s) : []), activity: async (s) => (extras.activity ? extras.activity(s) : []) },
    business: { currency: async () => 'AUD' },
    now,
  };
}

export type OverviewLookup =
  | { found: false }
  | { found: true; overview: BusinessOverview; businessName: string | null; storeStatus: StoreStatus };

/** One call for the page: unknown business => `found: false`; otherwise the AMP-080 overview for that business only. */
export async function loadBusinessOverview(
  rt: OverviewRuntime, ctx: OverviewContexts, extras: OverviewExtras, businessId: string, now: () => Date = () => new Date(),
): Promise<OverviewLookup> {
  if (!isKnownBusiness(rt, businessId)) return { found: false };
  const scope: OverviewScope = { workspaceId: ctx.workspaceId, businessId };
  const [overview, businessName, { status }] = await Promise.all([
    getBusinessOverview(createRuntimeOverviewDeps(rt, ctx, extras, now), scope), readBusinessName(rt, ctx, businessId), readStore(rt, scope),
  ]);
  return { found: true, overview, businessName, storeStatus: status };
}
