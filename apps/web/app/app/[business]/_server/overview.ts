// Adapters for the Business Overview page (AMP-081, screen 10, H01): they feed the AMP-080 read model (`OverviewDeps`) from the
// in-memory DEMO runtime the /start journey fills. Plain functions that take the runtime as an argument, so they run in the
// node tests without Next. Every read passes the workspace AND the business; orders (listed per workspace) are filtered again here
// and by `collectOverviewSnapshot`.
//
// What is really wired, and what is not (see `OVERVIEW_SOURCES`):
//   wired   steps (seeds, brand, products, catalogue), store (site versions), orders (optional source), approvals and activity
//           (optional source), business name and currency
//   absent  analytics (visits stay "Not measured yet"; no counter exists)
//   wired only when the runtime carries the store (AMP-093, through the AMP-091 adapters): seller readiness (`rt.sellers`),
//           fulfilment and money events (`rt.fulfilment`). The /start runtime has neither today (AMP-103 / AMP-107), so a /start
//           business still reads as "payments not connected" with nothing to deliver. That is the truth, not a placeholder number.
import type { BrandStore } from '../../../../lib/aimp/branding/store.ts';
import { getApprovedBrand } from '../../../../lib/aimp/branding/service.ts';
import type { CatalogueService } from '../../../../lib/aimp/catalogue/service.ts';
import type { OperationContext } from '../../../../lib/aimp/catalogue/types.ts';
import type { ProductService } from '../../../../lib/aimp/products/service.ts';
import type { Order } from '../../../../lib/aimp/orders/types.ts';
import type { FulfilmentStore } from '../../../../lib/aimp/fulfilment/types.ts';
import {
  createAbsentVisitsSource, createFulfilmentSource, createOverviewCache, createSellerSource, getBusinessOverview,
} from '../../../../lib/aimp/overview/index.ts';
import type {
  BusinessOverview, OverviewBuildSteps, OverviewCache, OverviewDeps, OverviewOrder, OverviewScope, OverviewStore, Tenanted,
} from '../../../../lib/aimp/overview/index.ts';
import type { SellerAccountStore } from '../../../../lib/aimp/sellers/store.ts';
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
  /** Optional (AMP-093). When the runtime has a seller account store, payments readiness is read from it; otherwise "not connected". */
  sellers?: Pick<SellerAccountStore, 'get'>;
  /** Optional (AMP-093). When the runtime has a fulfilment store, deliveries, refunds and disputes are read from it; otherwise none. */
  fulfilment?: Pick<FulfilmentStore, 'list' | 'listMoneyEvents'>;
  /** Optional. The /start runtime's order store (the one the Orders page and test purchases use). Its orders are always included, whichever page built the shared cache first. */
  orderDemo?: { orders: { list(workspaceId: string): Promise<Order[]> }; fulfilmentStore?: Pick<FulfilmentStore, 'list' | 'listMoneyEvents'> };
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

export interface OverviewSourceStatus {
  steps: 'wired'; store: 'wired'; orders: string; approvals: string; activity: string;
  /** No visit counter exists anywhere yet, so this is always absent (visits read as "Not measured yet", never 0). */
  analytics: 'absent';
  fulfilment: 'wired' | 'absent';
  moneyEvents: 'wired' | 'absent';
  seller: 'wired' | 'absent (not connected)';
}

/** What is really read for THIS runtime (AMP-093). Seller, fulfilment and money events are real only when the runtime carries the store. */
export function overviewSources(rt: Pick<OverviewRuntime, 'sellers' | 'fulfilment'>): OverviewSourceStatus {
  return {
    steps: 'wired', store: 'wired', orders: 'wired when the checkout demo is on', approvals: 'wired when the automation demo is on',
    activity: 'wired when the automation demo is on', analytics: 'absent',
    fulfilment: rt.fulfilment ? 'wired' : 'absent', moneyEvents: rt.fulfilment ? 'wired' : 'absent',
    seller: rt.sellers ? 'wired' : 'absent (not connected)',
  };
}

/** The sources for a runtime with no seller or fulfilment store, which is what the /start runtime is today (AMP-103 / AMP-107). */
export const OVERVIEW_SOURCES: OverviewSourceStatus = overviewSources({});

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

/**
 * Whether the approvals read failed, per workspace + business (AMP-109). `failed` is the latest read; `shown` is the value that
 * belongs to the saved copy the cache is serving (a later failed re-read keeps the older copy, so it keeps that copy's value).
 */
export interface ApprovalsHealth { failed: Set<string>; shown: Map<string, boolean> }
export const createApprovalsHealth = (): ApprovalsHealth => ({ failed: new Set(), shown: new Map() });
const scopeKey = (s: OverviewScope): string => `${s.workspaceId}/${s.businessId}`;
const healthOf = new WeakMap<OverviewCache, ApprovalsHealth>();

/**
 * `OverviewDeps` over the /start runtime. Seller readiness, fulfilment and money events go through the AMP-091 adapters when the
 * runtime carries the store, and through the "nothing there" stubs when it does not (see `overviewSources`). `extras` may be a
 * function, so a long-lived cache asks for the current optional sources on every read instead of holding the first request's.
 */
export function createRuntimeOverviewDeps(
  rt: OverviewRuntime, ctx: OverviewContexts, extras: OverviewExtras | (() => OverviewExtras), now: () => Date, health?: ApprovalsHealth,
): OverviewDeps {
  const ex = typeof extras === 'function' ? extras : () => extras;
  // AMP-109: with a `health` record, an approvals read that throws or rejects does not fail the whole overview. It reads as an empty
  // list AND is recorded as failed, so the page says "could not be read" and never claims that nothing is waiting. Only the error
  // name is logged. Without a `health` record nobody could say so, so the failure is passed on as before.
  const readApprovals = async (s: OverviewScope): Promise<ApprovalView[]> => {
    const approvals = ex().approvals;
    if (!approvals) { health?.failed.delete(scopeKey(s)); return []; }
    if (!health) return approvals(s);
    try {
      const list = await approvals(s);
      health.failed.delete(scopeKey(s));
      return list;
    } catch (e) {
      health.failed.add(scopeKey(s));
      console.error('[app overview] could not read approvals:', e instanceof Error ? e.name : 'unknown error');
      return [];
    }
  };
  return {
    orders: { list: async (s) => {
      const extra = ex().orders;
      const [fromExtras, fromStart] = await Promise.all([extra ? extra(s.workspaceId) : [], rt.orderDemo ? rt.orderDemo.orders.list(s.workspaceId) : []]);
      const seen = new Set<string>();
      return [...fromExtras, ...fromStart].filter((o) => (seen.has(o.id) ? false : (seen.add(o.id), true))).map(toOverviewOrder);
    } },
    fulfilment: (rt.fulfilment ?? rt.orderDemo?.fulfilmentStore) ? createFulfilmentSource((rt.fulfilment ?? rt.orderDemo?.fulfilmentStore)!) : { list: async () => [], moneyEvents: async () => [] },
    seller: rt.sellers ? createSellerSource(rt.sellers) : { readiness: async () => deriveReadiness(null) },
    store: { get: async (s) => (await readStore(rt, s)).store },
    steps: { get: (s) => readBuildSteps(rt, ctx, s) },
    automation: {
      approvals: readApprovals,
      activity: async (s) => { const activity = ex().activity; return activity ? activity(s) : []; },
    },
    analytics: createAbsentVisitsSource(),
    business: { currency: async () => 'AUD' },
    now,
  };
}

/** When the numbers were read, for the "Last updated" line. Times only; no error text. */
export interface OverviewFreshness {
  refreshedAt: string; ageMs: number; stale: boolean; refreshFailed: boolean;
  /** The approvals list could not be read for these numbers: approvals are unknown, not none (AMP-109). */
  approvalsFailed?: boolean;
}

export type OverviewLookup =
  | { found: false }
  | {
    found: true; overview: BusinessOverview; businessName: string | null; storeStatus: StoreStatus; freshness?: OverviewFreshness;
    /** True when the approvals list could not be read: the overview then carries no approvals, which means unknown, not zero. */
    approvalsFailed?: boolean;
  };

/** The page re-reads a business once its saved copy is older than this. A failed re-read keeps the older copy and says so. */
export const OVERVIEW_REFRESH_AFTER_MS = 5_000;

let shared: { rt: OverviewRuntime; cache: OverviewCache } | null = null;

/**
 * The ONE overview cache for this server process. It is keyed by workspace + business inside `createOverviewCache`, so one business
 * never gets another's snapshot. A different runtime object (a test, a rebuilt demo runtime) gets a fresh cache, never the old one's data.
 */
export function sharedOverviewCache(rt: OverviewRuntime, ctx: OverviewContexts, extras: OverviewExtras | (() => OverviewExtras), now: () => Date = () => new Date()): OverviewCache {
  if (!shared || shared.rt !== rt) {
    const health = createApprovalsHealth();
    shared = { rt, cache: createOverviewCache({ deps: createRuntimeOverviewDeps(rt, ctx, extras, now, health), refreshAfterMs: OVERVIEW_REFRESH_AFTER_MS }) };
    healthOf.set(shared.cache, health);
  }
  return shared.cache;
}

/** The page's read: unknown business => `found: false` (nothing read or cached); otherwise the cached overview and when it was read. */
export async function loadCachedBusinessOverview(cache: OverviewCache, rt: OverviewRuntime, ctx: OverviewContexts, businessId: string): Promise<OverviewLookup> {
  if (!isKnownBusiness(rt, businessId)) return { found: false };
  const scope: OverviewScope = { workspaceId: ctx.workspaceId, businessId };
  const [c, businessName, { status }] = await Promise.all([cache.get(scope), readBusinessName(rt, ctx, businessId), readStore(rt, scope)]);
  const health = healthOf.get(cache);
  const k = scopeKey(scope);
  const latest = health?.failed.has(k) ?? false;
  // A failed re-read serves the older copy, so the older copy's value is kept; otherwise the copy shown is the latest read.
  if (health && !c.refreshFailed) health.shown.set(k, latest);
  const approvalsFailed = health ? (health.shown.get(k) ?? latest) : false;
  return {
    found: true, overview: c.overview, businessName, storeStatus: status, approvalsFailed,
    freshness: { refreshedAt: c.refreshedAt, ageMs: c.ageMs, stale: c.stale, refreshFailed: c.refreshFailed, ...(approvalsFailed ? { approvalsFailed } : {}) },
  };
}

/** One call for the page: unknown business => `found: false`; otherwise the AMP-080 overview for that business only. */
export async function loadBusinessOverview(
  rt: OverviewRuntime, ctx: OverviewContexts, extras: OverviewExtras, businessId: string, now: () => Date = () => new Date(),
): Promise<OverviewLookup> {
  if (!isKnownBusiness(rt, businessId)) return { found: false };
  const scope: OverviewScope = { workspaceId: ctx.workspaceId, businessId };
  const health = createApprovalsHealth();
  const [overview, businessName, { status }] = await Promise.all([
    getBusinessOverview(createRuntimeOverviewDeps(rt, ctx, extras, now, health), scope), readBusinessName(rt, ctx, businessId), readStore(rt, scope),
  ]);
  return { found: true, overview, businessName, storeStatus: status, approvalsFailed: health.failed.has(scopeKey(scope)) };
}
