# D03 Publish smoke test (AMP-035)

Code: `apps/web/lib/aimp/publish-check/` (`check.ts`, `publish.ts`). Tests: `apps/web/test/aimp-publish-check-*.test.ts`.

## Inputs

`publishWithCheck(deps, { actor: { workspaceId, userId }, businessId, storeSlug, note?, expectedRevision? })`

`deps = { versions, check }`
- `versions`: the site-versions API (`publish`, `rollback`, `pause`, `history`, `resolvePublished`).
- `check` (`PublishCheckDeps`): `resolveLive(slug)` (public resolver), `loadPage(slug, ref)`, `checkout: CheckoutProbe`, optional `checkoutAvailable` (defaults to the storefront `checkoutBuilt` flag).

Helpers: `createPageLoader(loadStore)` (page must come from the published snapshot and have its content), `createCheckoutProbe(deps)` (see below).

`runPublishCheck(checkDeps, { workspaceId, businessId, storeSlug, versionId })` is the pure check on its own.

## Result

- Check: `{ ok: true, checks: [{check, detail}], skipped: [{check, detail}] }` or `{ ok: false, failed: [{check, reason}], checks, skipped }`.
- Publish: `{ ok: true, outcome: 'published', version, checks, skipped }` or `{ ok: false, outcome, message, failed, version?, rolledBackTo?, rollbackErrors? }`.
  Outcomes: `rolled_back`, `unpublished`, `rollback_failed`, `not_published` (store refused, paused, or no access), `unchanged_check_failed`.
  `message` is plain English and names every failed check.

## Checks

1. `live-version`: the public resolver serves this store address and exactly the version just published (not paused, not another slug).
2. `page:home`, `page:product:<slug>` for each product, `page:policy:refund|privacy|terms`, `page:contact`: loaded through `loadPage`.
3. `checkout:<slug>` for every product, only when the storefront would show a buy button (`purchaseState`: not a demo store, charges enabled, checkout built). Otherwise reported under `skipped` with the reason.
   The probe repeats the checkout service preconditions without side effects: store directory matches workspace and business, approved listing of that business, readable stored price, `checkoutGate` (provider on and seller `ready`), payments adapter present. A store with no seller connected fails with the seller gate's own message.

A check that throws counts as failed; raw error text never reaches the message.

## Rollback rule

Failed check after publish:
- a version was live before: `rollback` to it (a new version that copies it), then confirm the public resolver serves it. Outcome `rolled_back`.
- nothing was live before: `pause` the store, then confirm the resolver says paused. Outcome `unpublished`. The owner must resume before publishing again (a paused store is refused up front, `not_published`).
- the rollback or pause fails, or does not take effect: outcome `rollback_failed` with `rollbackErrors`; the message says the store may still be live.
- publish was a no-op (draft equals live): nothing is undone; outcome `unchanged_check_failed`.

## Isolation

The actor's workspace is enforced by the site-versions store (another workspace gets `not_published` and no check runs). The probe refuses a store address that belongs to a different workspace or business before any catalogue read.

## Job

`publish-site` in `lib/aimp/jobs/handlers.ts` uses this when `HandlerDeps.publishSite` is set (input `{ storeSlug }`, business from the job). A failed check fails the job permanently with the message. Not set: the old DEMO stubs run unchanged.

## Not real yet

- No production caller sets `HandlerDeps.publishSite`; the demo job wiring (`jobs/demo.ts`) still uses stubs.
- Pages are loaded through the storefront loader and checked for content, not fetched over HTTP from a rendered server.
- Checkout is checked by preconditions; no payment session is created (`startCheckout` writes a pending order). While `checkoutBuilt` is false, checkout is reported as skipped.
- The storefront product slug to catalogue listing mapping does not exist yet; the probe takes it as `listingIdFor`.
- The site-versions store is in memory; the database-backed store is a separate task.
