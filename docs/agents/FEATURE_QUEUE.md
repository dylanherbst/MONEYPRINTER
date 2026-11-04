# Feature queue

Ordered work for the feature agent. When one item finishes (code, tests, commit), the Chief of Staff verifies it with `ventra-verify`, updates `FEATURES.md`, and starts the next unchecked item immediately. Only features that need no outside key or account are queued; anything that needs a provider stays in `ROADMAP.md` as blocked.

Rules for every item: build it as a local, clearly labelled DEMO feature with the existing account-sync pattern, unit tests and an isolated test page; never mark it Working until the Chief of Staff has round-tripped it in a real browser against the real local database; new migrations are written but applied only by the owner.

| # | Feature | Kind | State | Notes |
| --- | --- | --- | --- | --- |
| 1 | Account sync for service and education drafts | wiring + migration 0004 | Done (9 of 10, verified by ventra-verify; browser round trips pending migration 0004) | Skipped the lesson quiz: it is nested in the course draft, not its own store |
| 2 | Lead qualification and rule-based lead scoring | new draft + sync | Done, awaiting verification | Rules the owner writes (no AI); scores CRM contacts; explains each score |
| 3 | Sales reporting from CRM deals | computed report | Done, awaiting verification | Pipeline totals by stage and month from saved deals; no invented numbers |
| 4 | Content calendar and social post drafts | new draft + sync | Done, awaiting verification | Manual drafts, no publishing |
| 5 | Email campaign and nurture sequence drafts | new draft + sync | Done, awaiting verification | Drafts only, nothing is sent |
| 6 | Funnel drafts (steps linking lead form, offer, checkout) | new draft + sync | Done, awaiting verification | Planning view, no execution |
| 7 | Booking page drafts (availability rules) | new draft + sync | Done, awaiting verification | No calendar provider; shows DEMO |
| 8 | Student progress tracking | tables + API + UI | Done, awaiting verification | Migration written, not applied; learner preview only |
| 9 | Persistent orders table for the Stripe webhook | migration + RPC proposal | Done (proposal written, NOT applied), awaiting owner decision | Written and tested in PGlite, NOT applied; owner decides on the server-side key |
| 10 | Visual workflow builder (draft only) | new draft + sync | Done, awaiting verification | No execution engine. Migration 202611030012 written, not applied. Queue complete: next items to be chosen |
| 11 | Business overview analytics (computed from saved data) | computed report | Done, awaiting verification | Contacts to deals to won, lead-score mix, campaign and content counts, per currency; no invented numbers; no migration |
| 12 | Integrations status (real checks) | server route + UI | Done, awaiting verification | Env checks and one Supabase health probe; Stripe and OpenAI never verified (no paid or test call); no secrets exposed; browser check not run |
| 13 | Team members list (read-only) | api + UI | Done, awaiting verification | GET /api/workspace/team (RLS member_read, no migration, no emails, user ids not exposed); Settings > Team and /tools/team-members; browser check not run |
| 14 | Launch checklist saved to account | wiring + migration | Done, awaiting verification | Migration 202611030013 written, NOT applied (owner applies) |
| 15 | Lesson quiz saved to account | wiring + migration | Done, awaiting verification | Own kind `lesson-quiz` holds quizzes keyed by lesson id, applied back into the local course draft by lesson id. Migration 202611030014 written, NOT applied (owner applies); /tools/lesson-quiz; browser check not run |
| 16 | Service offers and pricing saved to account | wiring + migration | Done, awaiting verification | Offers list synced as an array via kind `service-offers`, validated with restoreLocalOffers. Migration 202611030015 written, NOT applied (owner applies); /tools/service-offers; browser check not run |
| 17 | Growth plan saved to account | wiring + migration | Done, awaiting verification | Growth plan (per business) synced as kind `growth-plan`, validated with restoreGrowthPlan; the separate manual growth audit is NOT included (different fixed key, not per business). Migration 202611030016 written, NOT applied (owner applies); /tools/growth-plan; browser check not run |
| 18 | Manual growth audit saved to account | wiring + migration | Done, awaiting verification | Fixed storage key, own kind `growth-audit` (new migration 0017, owner applies); left out of item 17. Done: kind `growth-audit`, validated with restoreAudit; migration 202611030017 written, NOT applied (owner applies); /tools/growth-audit; browser check not run |
| 19 | Notifications centre (in-app, read-only from saved data) | computed view | Done, awaiting verification | Lists real events from saved data (new leads, overdue invoices, upcoming bookings); no email/push, no invented items; no migration. Computed by lib/notifications.ts from saved contacts, content calendar and invoice draft; shown in Insights > Overview; /tools/notifications; upcoming bookings omitted (no saved appointments exist); browser check not run |
| 20 | Account data export (download my data) | api + UI | Done, awaiting verification | Authenticated route returns all the owner's saved drafts as one JSON file; read-only; no migration. GET /api/workspace/export?workspace= (lp-access cookie + RLS, no service key); button in Settings > Profile; /tools/account-export; browser check not run |
