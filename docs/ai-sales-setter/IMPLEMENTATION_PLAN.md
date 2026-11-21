# Implementation status and plan (22 Nov 2026)

| Phase | Status |
|---|---|
| 0 Audit, Meta docs, design docs | Done (REPO_AUDIT, META_COMPLIANCE, ARCHITECTURE) |
| 1 Contracts, eligibility, tests, simulator | Built and tested (`lib/aimp/setter`, `test/aimp-setter.test.ts`, 16 tests) |
| 2 OAuth connector + encrypted tokens | Built, not run against Meta (no app/keys). Disconnect/refresh UI not built; `refreshToken` exists |
| 3 Webhook receiver, dedupe, queue | Built. Queue is an in-process per-conversation lock; needs a durable queue with a database |
| 4 Policy engine, AI decision, knowledge, CRM | Built. Default agent is rule-based; `llmAgent` ready for a real model key |
| 5 Inbox, approval, takeover, setup, results | Built as a test lab page at `/app/<business>/setter` (simulated). Not viewed in a browser yet |
| 6 Authorized sending, links, attribution | Sender built; live sending OFF unless `SETTER_LIVE_SEND=1`. Click links built; no redirect route yet |
| 7 App Review packet, observability, beta | Not started |

## Unknowns and blockers
1. Instagram Login webhook payload shape not confirmed from docs (page fetch failed). Confirm with the first real event.
2. Whether token `user_id` / `/me user_id` equals webhook `entry.id`. Confirm on first connection.
3. Private replies (comment-to-DM) need Facebook Login + Page token per docs: BLOCKED, not built.
4. Conversation routing for Instagram-Login-only apps unclear: auto-send requires `threadOwnershipConfirmed`, set manually after checking.
5. No real auth: workspace comes from the demo runtime. Must come from the session before any real customer.
6. No database: in-memory stores (lost on restart); migration `supabase/migrations/202611220001_ai_sales_setter.sql` written, not applied.
7. Meta app, App Review (Advanced Access for `instagram_business_manage_messages`), privacy policy and data-deletion URL needed.
