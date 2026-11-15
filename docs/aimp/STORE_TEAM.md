# Store team (from the SkillTree reference, 15 Nov 2026)

Source: `SkillTree_Ecommerce_AI_Agents_Breakdown` (video reference, 93 agents, 7 departments). The video's numbers are illustrative; its approval rules are unspecified, so ours are set here.

## Rules we adopted
- Reading and drafting run automatically. Anything a buyer sees (`send`) or that moves money or ad spend (`money`) waits for the owner. No automatic refunds.
- One workflow = one definition: trigger, data, rules, action, output, failure. Catalogue: `apps/web/lib/aimp/storeops/catalog.ts` (17 definitions; `built` / `next` / `later`).
- Digital shops (our default) skip physical-only workflows (stock, reorders, exchanges). "Order tracker" reports delivery status and a resend option instead of parcel tracking.
- Every run leaves one Ops-log line the owner can open on a phone.
- Per-business knowledge (catalogue, policies, suppliers, photos, brand voice) is loaded per run; nothing is shared across businesses.

## Built now (fixtures, no emails sent)
Order status -> verified lookup (sender email must match; wrong reference never reveals another order) -> reply draft (delivered / on its way / payment pending / refunded / hand-off / ask for details) -> Ops-log entry "waiting for you". Code: `lib/aimp/storeops/order-status.ts`, tests `test/aimp-storeops.test.ts`. Inbox tab shows the team map honestly (ready / next / later).

## Next
1. Feed real orders and fulfilment state into `lookupOrder` and show the draft + approve button in the Inbox (approval via `lib/aimp/automation`, new area `support`).
2. Resend download through the existing owner-orders action after approval.
3. Review asker (timer from delivery) and cart follow-up (re-check before send).
4. Home: "Yesterday" metrics, "Waits for you", Ops log.
