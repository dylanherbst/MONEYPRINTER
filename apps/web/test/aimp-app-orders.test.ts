// Orders queue and order detail (screens 19 and 20, AMP-086; H19 H20). The server reads, the view model and the action guard run against
// the REAL owner-orders service on the real fulfilment fixture world (in-memory stores), built the way the owner-orders tests build it.
// The /start runtime has no order store, so the page's own source is null: that honest state is tested too (and what it would need).
// Server actions are not run here (actions.ts imports Next-only modules), but the guard that decides whether and with what the service
// runs is, and the last tests run the two service calls the action makes for an allowed request.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import {
  BAD_REQUEST, NO_BUSINESS, NO_ORDER, NO_ORDERS_YET, guardOrderAction, isOrderActionKind, isOrderId, isRequestKey,
} from '../app/app/[business]/orders/_server/order-guard.ts';
import { MISSING_WIRING, loadOrder, loadOrders, ordersSource } from '../app/app/[business]/orders/_server/orders.ts';
import type { OrdersRuntime, OrdersSource } from '../app/app/[business]/orders/_server/orders.ts';
import {
  ACTOR_AUTOMATIC, ACTOR_PERSON, ACTOR_UNKNOWN, ACTOR_YOU, DEMO_NOTE, NO_STORE_TEXT, NO_STORE_TITLE, REFUND_NOTE, actorLabel, buildDetail, buildList, buildRow, emptyCopy, newRequestKey, orderHref, ordersHref, parseCursor, parseFilter,
} from '../app/app/[business]/orders/view-model.ts';
import { workspaceNavHref, workspaceNavItems } from '../app/app/[business]/workspace-nav-items.ts';
import { createFulfilmentWorld } from '../lib/aimp/fulfilment/demo.ts';
import { signMoneyEvent } from '../lib/aimp/fulfilment/refund-events.ts';
import { reissueAccess, resendDelivery } from '../lib/aimp/owner-orders/index.ts';
import { ownerOrdersDeps, seedOrder } from '../lib/aimp/owner-orders/demo.ts';

const START = Date.parse('2026-11-14T10:00:00Z');
const ON = { available: true, reason: '' };
const OFF = { available: false, reason: 'Demo storage is off.' };
const OWNER = 'demo-owner';

async function setup() {
  const w = await createFulfilmentWorld({ now: () => new Date(START) });
  const a = w.stores.a;
  const b = w.stores.b;
  const rt: OrdersRuntime = {
    businesses: new Set([a.businessId, b.businessId, 'biz-second']), seeds: new Map(), slugs: new Map(), productIds: new Map(),
  };
  const source: OrdersSource = { deps: ownerOrdersDeps(w), workspaceId: a.workspaceId, actorId: OWNER };
  const guard = (businessId: unknown, orderId: unknown, kind: unknown, key: unknown, over: { source?: OrdersSource | null; availability?: typeof ON } = {}) =>
    guardOrderAction({ availability: over.availability ?? ON, rt: () => rt, source: () => (over.source === undefined ? source : over.source) }, businessId, orderId, kind, key);
  return { w, a, b, rt, source, guard };
}

/** Narrows a lookup to the "orders are available" branch (fails the test otherwise). */
function availablePage(r: Awaited<ReturnType<typeof loadOrders>>) {
  if (!r.found || !r.available) throw new assert.AssertionError({ message: 'expected an available orders page' });
  return r;
}

// ---- the honest state of the /start demo ----
test('a runtime without order stores has no orders source, so the list says no orders can exist yet and no order can be opened', async () => {
  const rt: OrdersRuntime = { businesses: new Set(['biz-a']), seeds: new Map(), slugs: new Map(), productIds: new Map() };
  assert.equal(ordersSource(rt), null);
  const list = await loadOrders(rt, ordersSource(rt), 'biz-a', { filter: 'all', cursor: null });
  assert.deepEqual(list, { found: true, available: false });
  assert.deepEqual(await loadOrder(rt, ordersSource(rt), 'biz-a', 'ord_1'), { found: false });
  assert.deepEqual(await loadOrders(rt, null, 'unknown', { filter: 'all', cursor: null }), { found: false }, 'an unknown business is unknown, not "no orders"');
  assert.match(NO_STORE_TITLE, /No orders can exist in the demo yet/);
  assert.match(NO_STORE_TEXT, /not a count of zero sales/);
  assert.ok(MISSING_WIRING.length >= 3);
});

test('AMP-103: the real /start runtime file now builds an order store and fulfilment service (in orders-runtime.ts) and the source reads them', () => {
  const src = readFileSync(new URL('../app/start/_server/runtime.ts', import.meta.url), 'utf8');
  assert.match(src, /orderDemo: createStartOrders\(/);
  const wiring = readFileSync(new URL('../app/start/_server/orders-runtime.ts', import.meta.url), 'utf8');
  assert.match(wiring, /createMemoryOrderStore/);
  assert.match(wiring, /createFulfilmentService/);
});

// ---- the server reads on the real service ----
test('the list holds only this business\'s orders, newest first, with buyer-safe summaries and counts', async () => {
  const { w, a, rt, source } = await setup();
  w.email.failNext(1);
  const failed = await w.buy('a');
  const ok = await w.buy('a');
  const otherStore = await w.buy('b');
  await seedOrder(w.orders, { id: 'ord-second', workspaceId: a.workspaceId, businessId: 'biz-second', createdAt: '2026-11-14T09:00:00Z', paid: true });

  const r = await loadOrders(rt, source, a.businessId, { filter: 'all', cursor: null });
  assert.ok(r.found && r.available);
  const ids = r.page.orders.map((o) => o.id);
  assert.deepEqual([...ids].sort(), [failed.orderId, ok.orderId].sort());
  assert.ok(!ids.includes(otherStore.orderId) && !ids.includes('ord-second'));
  assert.deepEqual(r.page.counts, { all: 2, needs_attention: 1, delivered: 1, refunded: 0 }, 'the failed delivery needs attention; delivered counts only the paid and delivered one');
  const raw = JSON.stringify(r.page);
  assert.doesNotMatch(raw, /buyer-a@example\.test/, 'only the masked address is read');

  const second = await loadOrders(rt, source, 'biz-second', { filter: 'all', cursor: null });
  assert.ok(second.found && second.available);
  assert.deepEqual(second.page.orders.map((o) => o.id), ['ord-second'], 'the other business in the same workspace sees only its own order');
});

test('a filter and a cursor are passed to the service; a bad cursor falls back to the first page', async () => {
  const { w, a, rt, source } = await setup();
  for (let i = 0; i < 3; i++) await w.buy('a');
  const delivered = await loadOrders(rt, source, a.businessId, { filter: 'delivered', cursor: null });
  assert.ok(delivered.found && delivered.available && delivered.page.total === 3);
  const refunded = await loadOrders(rt, source, a.businessId, { filter: 'refunded', cursor: null });
  assert.ok(refunded.found && refunded.available && refunded.page.total === 0);
  const bad = await loadOrders(rt, source, a.businessId, { filter: 'all', cursor: 'not a cursor!' });
  assert.ok(bad.found && bad.available && bad.page.orders.length === 3);
});

test('AMP-102: after a bad or unknown cursor page 1 is shown, so there is no "Back to the newest orders" link; a real cursor keeps it', async () => {
  const { w, a, rt, source } = await setup();
  for (let i = 0; i < 3; i++) await w.buy('a');
  assert.equal(availablePage(await loadOrders(rt, source, a.businessId, { filter: 'all', cursor: null })).cursor, null);
  // 'bm9wZQ' is well-formed base64url that decodes to no cursor; the others are malformed.
  for (const cursor of ['not a cursor!', 'bm9wZQ', '%%%', 'x'.repeat(301)]) {
    for (const filter of ['all', 'delivered'] as const) {
      const r = availablePage(await loadOrders(rt, source, a.businessId, { filter, cursor }));
      assert.equal(r.cursor, null, `${cursor.slice(0, 20)}: no cursor was really used`);
      assert.equal(r.page.orders.length, 3, 'page 1 is shown');
      const vm = buildList(a.businessId, r.page, r.cursor);
      assert.equal(vm.firstPageHref, null, `${cursor.slice(0, 20)} ${filter}: no link back to the page already shown`);
    }
  }
  // A real cursor from the service is reported back, so page 2 keeps its link to the newest orders.
  const { listOwnerOrders } = await import('../lib/aimp/owner-orders/index.ts');
  const first = await listOwnerOrders(source.deps, { workspaceId: a.workspaceId, businessId: a.businessId, actorId: OWNER }, { limit: 2 });
  assert.ok(first.nextCursor);
  const real = availablePage(await loadOrders(rt, source, a.businessId, { filter: 'all', cursor: first.nextCursor }));
  assert.equal(real.cursor, first.nextCursor);
  assert.equal(buildList(a.businessId, real.page, real.cursor).firstPageHref, `/app/${a.businessId}/orders`);
  // The page hands buildList the cursor loadOrders reports, not the one in the address.
  const page = readFileSync(new URL('../app/app/[business]/orders/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /buildList\(business, found\.page, found\.cursor\)/);
});

test('AMP-102: a prototype-key order id is not found by loadOrder: it never throws and never returns an inherited value', async () => {
  const { w, a, rt, source } = await setup();
  await w.buy('a');
  for (const id of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', 'prototype']) {
    for (const biz of [a.businessId, 'biz-second']) {
      const r = await loadOrder(rt, source, biz, id);
      assert.deepEqual(r, { found: false }, `${biz} ${id}`);
      assert.equal(Object.hasOwn(r, 'order'), false, id);
    }
    assert.deepEqual(await loadOrder(rt, null, a.businessId, id), { found: false }, `${id} with no source`);
  }
});

test('AMP-102: a zero-decimal currency is not divided by 100: a JPY order of 1500 minor units reads "JPY 1500" in the row and the detail', async () => {
  const { w, a, rt, source } = await setup();
  // The order type only allows AUD today, so the JPY order is written to the real order store with a cast (the store does not check
  // the currency) and marked paid through the same store step the webhook uses. Everything after that is the real read model.
  const { order } = await w.orders.createPending({
    id: 'ord-jpy', workspaceId: a.workspaceId, businessId: 'biz-second', storeSlug: 'slug-biz-second', listingId: 'lst-ord-jpy', listingVersion: 1,
    productId: 'prod-ord-jpy', productVersion: 1, title: 'Yen product', amountMinor: 1500, currency: 'JPY' as 'AUD', sellerAccountId: 'acct-biz-second',
    buyerEmail: 'seed-buyer@example.test', idempotencyKey: 'key-ord-jpy', createdAt: '2026-11-14T09:00:00Z',
  });
  await w.orders.attachSession(order.id, { id: 'cs_ord-jpy', url: 'https://pay.example.test/session' });
  const paid = await w.orders.applyPaid({ eventId: 'evt_ord-jpy', sessionId: 'cs_ord-jpy', amountMinor: 1500, currency: 'JPY', at: '2026-11-14T09:00:00Z' });
  assert.equal(paid.outcome, 'paid');

  const list = availablePage(await loadOrders(rt, source, 'biz-second', { filter: 'all', cursor: null }));
  const summary = list.page.orders.find((o) => o.id === 'ord-jpy');
  assert.ok(summary);
  assert.deepEqual([summary.amountMinor, summary.currency], [1500, 'JPY'], 'the read model passes the order through unchanged');
  const row = buildRow('biz-second', summary);
  assert.equal(row.amount, 'JPY 1500');

  const d = await loadOrder(rt, source, 'biz-second', 'ord-jpy');
  assert.ok(d.found);
  const vm = buildDetail('biz-second', d.order);
  assert.equal(vm.facts.find((f) => f.label === 'Amount')?.value, 'JPY 1500');
  assert.deepEqual(vm.lineItems.map((l) => l.amount), ['JPY 1500']);
  assert.doesNotMatch(JSON.stringify([row, vm]), /JPY 15(\.00)?"/, 'never 15 yen');
});

test('AMP-102: the timeline names the actor the event records: automatic steps, the person looking, another person, or not recorded', async () => {
  const { w, a, rt, source, guard } = await setup();
  const paid = await w.buy('a');
  const g = await guard(a.businessId, paid.orderId, 'reissue', 'k-actor');
  assert.ok(g.ok);
  const sent = await reissueAccess(g.source.deps, g.scope, g.orderId, g.requestKey);
  assert.ok(sent.ok);
  const d = await loadOrder(rt, source, a.businessId, paid.orderId);
  assert.ok(d.found);
  const reissued = d.order.timeline.find((t) => t.kind === 'link_reissued');
  assert.equal(reissued?.actor, OWNER, 'the service records the id of the person who acted');
  const actorOf = (vm: ReturnType<typeof buildDetail>, kind: string) => vm.timeline.find((t) => t.kind === kind)?.actor;

  const mine = buildDetail(a.businessId, d.order, OWNER);
  assert.equal(actorOf(mine, 'link_reissued'), ACTOR_YOU, 'the person looking did it');
  assert.equal(actorOf(mine, 'paid'), ACTOR_AUTOMATIC);
  assert.equal(actorOf(mine, 'delivery_email_sent'), ACTOR_AUTOMATIC);

  const someoneElse = buildDetail(a.businessId, d.order, 'another-person');
  assert.equal(actorOf(someoneElse, 'link_reissued'), ACTOR_PERSON, 'a different person is never called "You"');
  const unknownViewer = buildDetail(a.businessId, d.order);
  assert.equal(actorOf(unknownViewer, 'link_reissued'), ACTOR_PERSON, 'with no viewer known, nobody is called "You"');
  assert.ok(!unknownViewer.timeline.some((t) => t.actor === ACTOR_YOU));
  assert.doesNotMatch(JSON.stringify([mine.timeline, someoneElse.timeline]), new RegExp(OWNER), 'the raw user id is never shown');

  assert.equal(actorLabel('system'), ACTOR_AUTOMATIC);
  assert.equal(actorLabel('system:refund-event', 'system:refund-event'), ACTOR_AUTOMATIC, 'a system actor is never "You"');
  for (const none of ['', '   ', undefined, null, 5]) assert.equal(actorLabel(none, OWNER), ACTOR_UNKNOWN, String(none));
  assert.equal(actorLabel(OWNER, ''), ACTOR_PERSON);
  // The page passes the server-side actor of the orders source, never anything from the request.
  const page = readFileSync(new URL('../app/app/[business]/orders/[orderId]/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /buildDetail\(business, found\.order, viewerId\)/);
  assert.match(page, /viewerId = source\?\.actorId \?\? null/);
});

test('AMP-102: the action list has the same list reset as the other lists on the page', () => {
  const css = readFileSync(new URL('../app/app/[business]/orders/orders.css', import.meta.url), 'utf8');
  for (const cls of ['apo-filters', 'apo-list', 'apo-timeline', 'apo-actions']) {
    const rule = css.match(new RegExp(`\\.${cls} \\{([^}]*)\\}`))?.[1] ?? '';
    assert.match(rule, /list-style: none; padding: 0; margin: 0;/, cls);
  }
});

test('an order opens only inside its own business: another business, another workspace, an unknown or a bad id all read as not found', async () => {
  const { w, a, b, rt, source } = await setup();
  const mine = await w.buy('a');
  const theirs = await w.buy('b');
  await seedOrder(w.orders, { id: 'ord-second', workspaceId: a.workspaceId, businessId: 'biz-second', createdAt: '2026-11-14T09:00:00Z', paid: true });

  const own = await loadOrder(rt, source, a.businessId, mine.orderId);
  assert.ok(own.found);
  assert.equal(own.order.id, mine.orderId);
  assert.equal(own.order.businessId, a.businessId);
  // both directions
  assert.deepEqual(await loadOrder(rt, source, a.businessId, theirs.orderId), { found: false }, 'store b order under business a (other workspace)');
  assert.deepEqual(await loadOrder(rt, source, a.businessId, 'ord-second'), { found: false }, 'same workspace, other business');
  const second = await loadOrder(rt, source, 'biz-second', 'ord-second');
  assert.ok(second.found, 'and the other business can open its own order');
  assert.deepEqual(await loadOrder(rt, source, 'biz-second', mine.orderId), { found: false });
  const sourceB: OrdersSource = { ...source, workspaceId: b.workspaceId };
  assert.ok((await loadOrder(rt, sourceB, b.businessId, theirs.orderId)).found);
  assert.deepEqual(await loadOrder(rt, sourceB, b.businessId, mine.orderId), { found: false });
  for (const id of ['nope', '', '../x', 'a b', 'x'.repeat(300)]) assert.deepEqual(await loadOrder(rt, source, a.businessId, id), { found: false }, id);
  assert.deepEqual(await loadOrder(rt, source, 'not-a-known-business', mine.orderId), { found: false });
});

// ---- view model ----
test('rows show a buyer-safe summary: title, amount in the money format, payment and delivery state, date, a masked buyer', async () => {
  const { w, a, rt, source } = await setup();
  w.email.failNext(1);
  const failed = await w.buy('a');
  const r = await loadOrders(rt, source, a.businessId, { filter: 'all', cursor: null });
  assert.ok(r.found && r.available);
  const row = buildRow(a.businessId, r.page.orders[0]);
  assert.equal(row.id, failed.orderId);
  assert.match(row.amount, /^A\$\d+(\.\d{2})?$/);
  assert.equal(row.payment.label, 'Paid');
  assert.equal(row.delivery.label, 'Delivery failed');
  assert.equal(row.delivery.tone, 'danger');
  assert.match(row.buyer, /^b\*\*\*@/);
  assert.match(row.created, /^2026-11-14 \d\d:\d\d UTC$/);
  assert.equal(row.href, `/app/${a.businessId}/orders/${failed.orderId}`);
  assert.doesNotMatch(JSON.stringify(row), /buyer-a@example\.test/);
});

test('the list view model has the filter tabs with counts, a summary, paging links and a clear empty state', async () => {
  const { w, a, rt, source } = await setup();
  const none = await loadOrders(rt, source, a.businessId, { filter: 'all', cursor: null });
  assert.ok(none.found && none.available);
  const empty = buildList(a.businessId, none.page);
  assert.equal(empty.rows.length, 0);
  assert.equal(empty.empty?.title, 'No orders yet');
  assert.equal(empty.summary, 'No orders to show');
  assert.deepEqual(empty.tabs.map((t) => [t.filter, t.count, t.current]), [['all', 0, true], ['needs_attention', 0, false], ['delivered', 0, false], ['refunded', 0, false]]);

  for (let i = 0; i < 3; i++) await w.buy('a');
  const some = await loadOrders(rt, source, a.businessId, { filter: 'all', cursor: null });
  assert.ok(some.found && some.available);
  const vm = buildList(a.businessId, some.page);
  assert.equal(vm.rows.length, 3);
  assert.equal(vm.empty, null);
  assert.equal(vm.summary, 'Showing 3 of 3 orders');
  assert.equal(vm.nextHref, null);
  assert.equal(vm.firstPageHref, null);
  assert.equal(vm.tabs.find((t) => t.filter === 'delivered')?.href, `/app/${a.businessId}/orders?filter=delivered`);

  const filtered = await loadOrders(rt, source, a.businessId, { filter: 'refunded', cursor: null });
  assert.ok(filtered.found && filtered.available);
  const fvm = buildList(a.businessId, filtered.page);
  assert.equal(fvm.empty?.title, 'No refunded orders', 'a filter with nothing in it says so, and it is not the "no orders yet" copy');
  assert.equal(fvm.tabs.find((t) => t.current)?.filter, 'refunded');
});

test('paging: a page cut gives a link to older orders that carries the filter and an opaque cursor', async () => {
  const { w, a } = await setup();
  for (let i = 0; i < 3; i++) await w.buy('a');
  const { listOwnerOrders } = await import('../lib/aimp/owner-orders/index.ts');
  const page = await listOwnerOrders(ownerOrdersDeps(w), { workspaceId: a.workspaceId, businessId: a.businessId, actorId: OWNER }, { limit: 2 });
  const vm = buildList(a.businessId, page);
  assert.equal(vm.summary, 'Showing 2 of 3 orders');
  assert.ok(vm.nextHref?.startsWith(`/app/${a.businessId}/orders?cursor=`));
  const cursor = new URL(vm.nextHref!, 'http://x').searchParams.get('cursor');
  assert.equal(parseCursor(cursor ?? undefined), cursor);
  const next = await listOwnerOrders(ownerOrdersDeps(w), { workspaceId: a.workspaceId, businessId: a.businessId, actorId: OWNER }, { limit: 2, cursor });
  const nvm = buildList(a.businessId, next, cursor);
  assert.equal(nvm.rows.length, 1);
  assert.equal(nvm.nextHref, null);
  assert.equal(nvm.firstPageHref, `/app/${a.businessId}/orders`);
  assert.deepEqual(new Set([...vm.rows, ...nvm.rows].map((r) => r.id)).size, 3);
});

test('query parsing is safe and links are built from ids, never from free text', () => {
  assert.equal(parseFilter('delivered'), 'delivered');
  assert.equal(parseFilter(['refunded', 'x']), 'refunded');
  for (const bad of [undefined, '', 'nope', '__proto__', ['bad']]) assert.equal(parseFilter(bad as string | string[] | undefined), 'all');
  assert.equal(parseCursor(undefined), null);
  assert.equal(parseCursor(''), null);
  assert.equal(parseCursor('x'.repeat(400)), null);
  assert.equal(ordersHref('biz-a'), '/app/biz-a/orders');
  assert.equal(ordersHref('biz-a', 'needs_attention'), '/app/biz-a/orders?filter=needs_attention');
  assert.equal(orderHref('biz-a', 'ord 1/../x'), '/app/biz-a/orders/ord%201%2F..%2Fx');
  assert.equal(emptyCopy('all', 0).title, 'No orders yet');
  assert.equal(emptyCopy('needs_attention', 4).title, 'Nothing needs your attention');
  assert.match(newRequestKey(() => 'a1b2-c3d4 ;$$'), /^own-[A-Za-z0-9._:-]+$/);
  assert.ok(isRequestKey(newRequestKey(() => crypto.randomUUID())));
});

test('the detail view model: delivered order allows a new link but not a resend; a failed delivery allows both; no tokens, links or full emails', async () => {
  const { w, a, rt, source } = await setup();
  const delivered = await w.buy('a');
  w.email.failNext(1);
  const failed = await w.buy('a');

  const d1 = await loadOrder(rt, source, a.businessId, delivered.orderId);
  assert.ok(d1.found);
  const vm1 = buildDetail(a.businessId, d1.order);
  assert.equal(vm1.delivery.label, 'Delivered');
  assert.equal(vm1.payment.label, 'Paid');
  assert.deepEqual(vm1.actions.map((x) => [x.kind, x.allowed]), [['resend', false], ['reissue', true]]);
  assert.match(vm1.actions[0].reason, /already sent/);
  assert.equal(vm1.access.stateLabel, 'A download link works');
  assert.equal(vm1.access.grants.length, 1);
  assert.equal(vm1.backHref, `/app/${a.businessId}/orders`);
  assert.ok(vm1.timeline.some((t) => t.label === 'Payment confirmed'));
  assert.equal(vm1.refund.stateLabel, 'No refund');
  assert.equal(vm1.refund.note, REFUND_NOTE);
  assert.equal(vm1.lineItems.length, 1);
  const text = JSON.stringify(vm1);
  assert.doesNotMatch(text, /buyer-a@example\.test/);
  assert.doesNotMatch(text, /\/api\/aimp\/fulfilment\/download|token|signature/i);

  const d2 = await loadOrder(rt, source, a.businessId, failed.orderId);
  assert.ok(d2.found);
  const vm2 = buildDetail(a.businessId, d2.order);
  assert.equal(vm2.delivery.label, 'Delivery failed');
  assert.deepEqual(vm2.actions.map((x) => x.allowed), [true, true]);
  assert.ok(vm2.deliveryError, 'the last problem is shown in plain words');
  assert.doesNotMatch(vm2.deliveryError ?? '', /Error:|at .*\.ts/);
  assert.equal(vm2.access.stateLabel, vm2.access.grants.length ? 'A download link works' : 'No link sent yet', 'the access card follows the service\'s grants');
  assert.ok(vm2.attention, 'the failed delivery is flagged in plain words');
});

test('a refunded order shows the refund state only, withdraws the actions, and says no refund is issued here', async () => {
  const { w, a, rt, source } = await setup();
  const paid = await w.buy('a');
  const order = (await w.orders.get(a.workspaceId, paid.orderId))!;
  await w.fulfilment.handleRefundEvent(signMoneyEvent(w.webhookSecret, { eventId: 'evt_page_refund', type: 'charge.refunded', order }, w.now()));
  const d = await loadOrder(rt, source, a.businessId, paid.orderId);
  assert.ok(d.found);
  const vm = buildDetail(a.businessId, d.order);
  assert.equal(vm.payment.label, 'Refunded');
  assert.equal(vm.refund.stateLabel, 'Refunded');
  assert.ok(vm.refund.events.length >= 1);
  assert.deepEqual(vm.actions.map((x) => x.allowed), [false, false]);
  assert.match(vm.refund.note, /No refunds are issued from here/);
  assert.ok(!vm.actions.some((x) => /refund/i.test(x.label)), 'there is no refund button');
});

// ---- the action guard ----
test('guard: demo storage off, bad ids, unknown business and no source refuse before anything is read or run', async () => {
  const { w, a, guard } = await setup();
  const paid = await w.buy('a');
  const run = async (...args: Parameters<typeof guard>) => { const g = await guard(...args); return g.ok ? 'ok' : g.message; };
  assert.equal(await run(a.businessId, paid.orderId, 'reissue', 'k1', { availability: OFF }), OFF.reason);
  assert.equal(await run('bad id!', paid.orderId, 'reissue', 'k1'), NO_BUSINESS);
  assert.equal(await run(undefined, paid.orderId, 'reissue', 'k1'), NO_BUSINESS);
  assert.equal(await run('biz-unknown', paid.orderId, 'reissue', 'k1'), NO_BUSINESS);
  for (const id of ['', '../x', 'a b', 5, null, 'x'.repeat(161)]) assert.equal(await run(a.businessId, id, 'reissue', 'k1'), NO_ORDER, String(id));
  // AMP-102: prototype keys are well-formed ids, so they reach the service; they must read as an unknown order, for both actions.
  for (const id of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf']) {
    for (const kind of ['resend', 'reissue']) assert.deepEqual(await guard(a.businessId, id, kind, `k-${kind}`), { ok: false, message: NO_ORDER }, `${id} ${kind}`);
  }
  assert.equal(w.email.outbox().length, 1, 'only the delivery email of the real purchase was sent');
  assert.equal(await run(a.businessId, paid.orderId, 'reissue', 'k1', { source: null }), NO_ORDERS_YET);
  assert.equal(await run(a.businessId, paid.orderId, 'refund', 'k1'), BAD_REQUEST, 'there is no refund action');
  assert.equal(await run(a.businessId, paid.orderId, undefined, 'k1'), BAD_REQUEST);
  assert.equal(await run(a.businessId, paid.orderId, 'reissue', ''), BAD_REQUEST);
  assert.equal(await run(a.businessId, paid.orderId, 'reissue', 'x'.repeat(81)), BAD_REQUEST);
  assert.equal(await run(a.businessId, paid.orderId, 'reissue', 'a b'), BAD_REQUEST);
  assert.equal(await run(a.businessId, paid.orderId, 'reissue', 'k1'), 'ok');
  assert.ok(isOrderId('ord_1') && !isOrderId('..') && isOrderActionKind('resend') && !isOrderActionKind('refund'));
});

test('guard: an order of another business or workspace, or an unknown id, is "not found" in both directions and causes no side effect', async () => {
  const { w, a, b, source, guard } = await setup();
  const mine = await w.buy('a');
  const theirs = await w.buy('b');
  await seedOrder(w.orders, { id: 'ord-second', workspaceId: a.workspaceId, businessId: 'biz-second', createdAt: '2026-11-14T09:00:00Z', paid: true });
  const outbox = w.email.outbox().length;
  const audit = (await w.fulfilment.audit({ workspaceId: a.workspaceId, businessId: a.businessId, actorId: OWNER })).length;

  for (const [biz, id] of [[a.businessId, theirs.orderId], [a.businessId, 'ord-second'], [a.businessId, 'missing-order'], ['biz-second', mine.orderId]] as const) {
    for (const kind of ['resend', 'reissue']) {
      const g = await guard(biz, id, kind, `k-${kind}`);
      assert.deepEqual(g, { ok: false, message: NO_ORDER }, `${biz} ${id} ${kind}`);
    }
  }
  assert.equal(w.email.outbox().length, outbox, 'no email was sent');
  assert.equal((await w.fulfilment.audit({ workspaceId: a.workspaceId, businessId: a.businessId, actorId: OWNER })).length, audit, 'no audit row was written');

  const own = await guard(a.businessId, mine.orderId, 'reissue', 'k-own');
  assert.ok(own.ok);
  assert.deepEqual(own.scope, { workspaceId: a.workspaceId, businessId: a.businessId, actorId: OWNER }, 'workspace and actor come from the server source');
  const sourceB: OrdersSource = { ...source, workspaceId: b.workspaceId };
  const g2 = await guard(b.businessId, theirs.orderId, 'reissue', 'k-b', { source: sourceB });
  assert.ok(g2.ok);
  assert.deepEqual(await guard(b.businessId, mine.orderId, 'reissue', 'k-b2', { source: sourceB }), { ok: false, message: NO_ORDER });
});

test('guard: it refuses an action the service says is not allowed, with the service\'s own reason', async () => {
  const { w, a, guard } = await setup();
  const delivered = await w.buy('a');
  const g = await guard(a.businessId, delivered.orderId, 'resend', 'k1');
  assert.equal(g.ok, false);
  assert.match(!g.ok ? g.message : '', /already sent/);
  const unpaid = await w.startOrder('a');
  const u = await guard(a.businessId, unpaid.orderId, 'reissue', 'k2');
  assert.equal(u.ok, false);
  assert.match(!u.ok ? u.message : '', /not completed|nothing to send/);
});

test('an allowed request runs the real service exactly as the action does: resend delivers once, a repeat of the key sends nothing more', async () => {
  const { w, a, guard } = await setup();
  w.email.failNext(1);
  const failed = await w.buy('a');
  assert.equal(w.email.outbox().length, 0);
  const g = await guard(a.businessId, failed.orderId, 'resend', 'k-resend');
  assert.ok(g.ok);
  const run = () => resendDelivery(g.source.deps, g.scope, g.orderId, g.requestKey);
  const r1 = await run();
  assert.deepEqual([r1.ok, r1.ok && r1.outcome], [true, 'sent']);
  const r2 = await run();
  assert.deepEqual([r2.ok, r2.ok && r2.outcome], [true, 'duplicate']);
  assert.equal(w.email.outbox().length, 1);
});

test('an allowed reissue runs the real service: one new link is emailed and the earlier one stops working', async () => {
  const { w, a, guard, rt, source } = await setup();
  const paid = await w.buy('a');
  const g = await guard(a.businessId, paid.orderId, 'reissue', 'k-reissue');
  assert.ok(g.ok);
  const r = await reissueAccess(g.source.deps, g.scope, g.orderId, g.requestKey);
  assert.equal(r.ok && r.outcome, 'sent');
  assert.equal(r.ok && r.revokedLinks, 1);
  const d = await loadOrder(rt, source, a.businessId, paid.orderId);
  assert.ok(d.found);
  assert.equal(d.order.access.activeCount, 1);
  assert.equal(d.order.access.reissues, 1);
});

// ---- wiring in the owner workspace ----
test('Orders is a link in the workspace bar and both pages, the action and the styles exist; an unbuilt page is never a link', () => {
  const orders = workspaceNavItems.find((i) => i.label === 'Orders');
  assert.ok(orders);
  assert.equal(workspaceNavHref('biz-a', orders), '/app/biz-a/orders');
  // Website and Payments became links with AMP-087 and AMP-088 (checked in aimp-app-workspace-nav.test.ts).
  assert.equal(workspaceNavHref('biz-a', { label: 'Later', segment: 'later', ready: false }), null);
  for (const f of ['page.tsx', 'orders-view.tsx', 'actions.ts', 'orders.css', '[orderId]/page.tsx', '[orderId]/order-detail-view.tsx']) {
    assert.ok(existsSync(new URL(`../app/app/[business]/orders/${f}`, import.meta.url)), f);
  }
});

test('the pages carry the DEMO label and honest copy: no earnings language, no invented numbers', () => {
  assert.match(DEMO_NOTE, /lost when the server restarts/);
  const files = ['orders-view.tsx', '[orderId]/order-detail-view.tsx', 'view-model.ts'].map((f) => readFileSync(new URL(`../app/app/[business]/orders/${f}`, import.meta.url), 'utf8'));
  for (const src of files) assert.doesNotMatch(src, /guarantee|earn \$|make money|passive income/i);
  assert.match(files[0], />DEMO</);
  assert.match(files[1], />DEMO</);
  assert.match(files[1], /orderAction/);
  assert.doesNotMatch(files[1], /issueRefund|createRefund/);
});
