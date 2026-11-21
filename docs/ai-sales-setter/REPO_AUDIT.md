# AI Sales Setter: repo audit (22 Nov 2026)

Repo `~/Developer/AIMONEYPRINTER` (Mac mini), branch `aimp/mobile-launch-m1`, app `apps/web` (Next.js 16.4.1, React 19.3.1, TypeScript, node:test with `--experimental-strip-types`). About 30 files carry uncommitted front-end work by another session; none are touched by this work.

## What exists and is reused

| Area | Where | Reuse |
|---|---|---|
| Owner workspace + nav | `app/app/[business]/*`, `workspace-nav-items.ts` | Setter page added under Settings links |
| Demo runtime (in-memory, gated by `AIMP_TOOLS_ENABLED`) | `app/start/_server/runtime.ts` (`availability`, `checkBusiness`) | Same gate for the setter test lab |
| Email enquiry Inbox (approve/reject drafts) | `lib/aimp/storeops/inbox`, `app/app/[business]/inbox` | Pattern only; DM inbox is separate (different channel, different rules) |
| Signed webhook pattern (raw body first) | `lib/aimp/checkout/signature.ts`, `app/api/aimp/webhooks/payments` | Same approach: verify raw body before parsing |
| Checkout / verified payments | `lib/aimp/checkout`, `lib/aimp/payments/stripe.ts` | Purchases counted only from verified events |
| LLM provider registry (fixture without key) | `lib/aimp/providers` | Agent model interface stays replaceable |
| Zernio adapter | `lib/aimp/social/zernio.ts` | Not used by the setter (first-party Meta path chosen) |
| Supabase migrations | `supabase/migrations` | New migration file written, not applied |

## What does not exist (built or stubbed in this run)

Instagram OAuth, token encryption, Meta webhook receiver, event ledger/dedupe, eligibility engine, agent decision schema + policy gate, DM conversations, CRM leads, setter analytics, simulator. No zod in dependencies, so validation is hand-written.

## Real-world blockers

- No real auth/session: workspace comes from the demo runtime (see `claude/aimp-launch-gap-audit.md`). Production must take workspace from the verified session.
- No database in use: in-memory stores behind a repository interface; SQL migration provided for later.
- No Meta app, keys, or App Review.
