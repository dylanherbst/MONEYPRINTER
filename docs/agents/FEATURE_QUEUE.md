# Feature queue

Ordered work for the feature agent. When one item finishes (code, tests, commit), the Chief of Staff verifies it with `ventra-verify`, updates `FEATURES.md`, and starts the next unchecked item immediately. Only features that need no outside key or account are queued; anything that needs a provider stays in `ROADMAP.md` as blocked.

Rules for every item: build it as a local, clearly labelled DEMO feature with the existing account-sync pattern, unit tests and an isolated test page; never mark it Working until the Chief of Staff has round-tripped it in a real browser against the real local database; new migrations are written but applied only by the owner.

| # | Feature | Kind | State | Notes |
| --- | --- | --- | --- | --- |
| 1 | Account sync for service and education drafts | wiring + migration 0004 | Done (9 of 10, verified by ventra-verify; browser round trips pending migration 0004) | Skipped the lesson quiz: it is nested in the course draft, not its own store |
| 2 | Lead qualification and rule-based lead scoring | new draft + sync | Done, awaiting verification | Rules the owner writes (no AI); scores CRM contacts; explains each score |
| 3 | Sales reporting from CRM deals | computed report | Queued | Pipeline totals by stage and month from saved deals; no invented numbers |
| 4 | Content calendar and social post drafts | new draft + sync | Queued | Manual drafts, no publishing |
| 5 | Email campaign and nurture sequence drafts | new draft + sync | Queued | Drafts only, nothing is sent |
| 6 | Funnel drafts (steps linking lead form, offer, checkout) | new draft + sync | Queued | Planning view, no execution |
| 7 | Booking page drafts (availability rules) | new draft + sync | Queued | No calendar provider; shows DEMO |
| 8 | Student progress tracking | tables + API + UI | Queued | Migration written, not applied; learner preview only |
| 9 | Persistent orders table for the Stripe webhook | migration + RPC proposal | Queued | Written and tested in PGlite, NOT applied; owner decides on the server-side key |
| 10 | Visual workflow builder (draft only) | new draft + sync | Queued | No execution engine |
