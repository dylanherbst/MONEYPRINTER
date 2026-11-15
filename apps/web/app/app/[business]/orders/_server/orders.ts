// Server reads for the Orders queue and the order detail (screens 19 and 20, AMP-086; H19 H20). Plain functions that take the runtime and
// the orders source as arguments, so they run in the node tests without Next. No order, delivery or refund rule lives here: every
// state comes from the owner-orders service (lib/aimp/owner-orders, AMP-085), which checks the business before it reads anything.
//
// WHAT THE /START DEMO HAS (AMP-103). The /start runtime (`JourneyRuntime`, app/start/_server/runtime.ts) now also holds an order store
// and a fulfilment service (app/start/_server/orders-runtime.ts) in the same workspace as its businesses, on fixture payments and
// fixture email. `ordersSource` builds the source from them. Orders appear only when something really bought through checkout
// (`createSampleOrders` in that file does so with a labelled sample seller). Nothing is seeded or faked here.
import { OwnerOrdersError, getOwnerOrder, listOwnerOrders } from '../../../../../lib/aimp/owner-orders/index.ts';
import type { OrderFilter, OwnerOrderDetail, OwnerOrdersDeps, OwnerOrdersPage, OwnerOrdersScope } from '../../../../../lib/aimp/owner-orders/index.ts';
import { isKnownBusiness } from '../../_server/overview.ts';
import type { OverviewRuntime } from '../../_server/overview.ts';

/** The parts of the /start runtime these pages read. `JourneyRuntime` satisfies this. */
export type OrdersRuntime = Pick<OverviewRuntime, 'businesses' | 'seeds' | 'slugs' | 'productIds'> & {
  /** The /start runtime's order store and fulfilment service (optional so a runtime without them still reads as "no source"). */
  orderDemo?: { orders: OwnerOrdersDeps['orders']; fulfilment: OwnerOrdersDeps['fulfilment']; now: () => Date; workspaceId: string; actorId: string };
};

/** Where orders come from: the owner-orders dependencies plus the workspace and the person acting. Never from the request. */
export interface OrdersSource { deps: OwnerOrdersDeps; workspaceId: string; actorId: string }

/** What a real source needs that the /start demo does not have (reported to the owner, shown nowhere as a promise). */
export const MISSING_WIRING = [
  'an order store (lib/aimp/orders createMemoryOrderStore or the database store) in the /start runtime, in the same workspace as the /start business',
  'a fulfilment service on that store (lib/aimp/fulfilment createFulfilmentService, with files and email), so delivery state and the two recovery actions work',
  'a path that creates orders for a /start business (checkout and the payment webhook), because a /start business has no seller account yet',
] as const;

/**
 * The orders source for this runtime: the order store and fulfilment service of the /start runtime (`rt.orderDemo`, AMP-103), in the
 * workspace and as the owner the runtime itself uses. Null only for a runtime that has none (an old hot-reloaded one, or a test double).
 * Nothing here comes from the request.
 */
export function ordersSource(rt: OrdersRuntime): OrdersSource | null {
  const o = rt.orderDemo;
  if (!o) return null;
  return { deps: { orders: o.orders, fulfilment: o.fulfilment, now: o.now }, workspaceId: o.workspaceId, actorId: o.actorId };
}

const scopeOf = (s: OrdersSource, businessId: string): OwnerOrdersScope => ({ workspaceId: s.workspaceId, businessId, actorId: s.actorId });

export type OrdersLookup =
  | { found: false }
  | { found: true; available: false }
  /** `cursor` is the cursor the page was really read with: null on page 1, and null when a bad cursor fell back to page 1. */
  | { found: true; available: true; page: OwnerOrdersPage; cursor: string | null };

export interface OrdersQuery { filter: OrderFilter; cursor: string | null }

/** Unknown business => `found: false`. No source => `available: false` (no orders can exist). Only this business's orders are read. */
export async function loadOrders(rt: OrdersRuntime, source: OrdersSource | null, businessId: string, query: OrdersQuery): Promise<OrdersLookup> {
  if (!isKnownBusiness(rt, businessId)) return { found: false };
  if (!source) return { found: true, available: false };
  const scope = scopeOf(source, businessId);
  try {
    return { found: true, available: true, cursor: query.cursor || null, page: await listOwnerOrders(source.deps, scope, { filter: query.filter, cursor: query.cursor }) };
  } catch (e) {
    // A cursor from an old link or one edited by hand: show the first page instead of an error (and report that no cursor was used).
    if (query.cursor && e instanceof OwnerOrdersError && e.code === 'invalid_input') {
      return { found: true, available: true, cursor: null, page: await listOwnerOrders(source.deps, scope, { filter: query.filter }) };
    }
    throw e;
  }
}

export type OrderLookup = { found: false } | { found: true; order: OwnerOrderDetail };

/**
 * The order, only when it belongs to this business. An unknown business, no source, an unknown id and an order of another business
 * all answer `found: false`, so they cannot be told apart.
 */
export async function loadOrder(rt: OrdersRuntime, source: OrdersSource | null, businessId: string, orderId: string): Promise<OrderLookup> {
  if (!isKnownBusiness(rt, businessId) || !source) return { found: false };
  const order = await getOwnerOrder(source.deps, scopeOf(source, businessId), orderId);
  return order ? { found: true, order } : { found: false };
}
