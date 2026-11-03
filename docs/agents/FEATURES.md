# VENTRA feature list and status

Source for the VENTRA Control "Features" page. Checked 2026-11-03 against the code and the test results on branch `chore/plugin-setup`. Statuses are evidence-based, not percentages:

- **Working**: runs end to end in a real browser or against the real local database, checked this session (`ventra-verify` passes).
- **Local draft**: built and unit-tested (and often browser-tested earlier), but saves only in this browser. No live backend, AI or provider is connected. Not re-run in a browser this session.
- **Blocked**: built, but needs a key, account or owner decision before it can be verified.
- **Not started**: no working code.

| Phase | Module | Feature | Status | Evidence | Next or needs |
| --- | --- | --- | --- | --- | --- |
| 1 | Platform | Sign up, sign in, sign out (account API) | Working | `test:local-integration` PASS against real local Supabase (signup, login, save/load, revoke) | No screen for it in the main app yet; page exists at `/workspace` |
| 1 | Platform | Three customer routes (Education, Independent, Grow) | Working | Browser check of chooser, save, reload, Home; 5 unit tests; `ventra-review` APPROVE | none |
| 1 | Platform | Personalised onboarding and dashboard | Working | Route shown on Home (production build); setup plan changes per route | Dev-mode Home hydration quirk (not investigated) |
| 1 | Platform | Account data saving (profile, offers) | Working | Workspace API round trip, tenant isolation, stale revision, staff read-only: PASS on real local Supabase | UI sync of offers beyond `/workspace` page |
| 1 | Platform | Teams, permissions, billing, notifications | Not started | Only owner/staff roles exist in the database | Phase 4 |
| 1 | Education | Course Creator (create, edit, save, reload, update, delete) | Working | Browser check on the isolated page; unit tests | none |
| 1 | Education | Course saved to account | Working | `course-api-integration` PASS (save, load, update, stale rejected, other user denied) | none |
| 1 | Education | AI course generation | Blocked | Route exists, rate-limited, mock-tested only | Needs an OpenAI key (costs money) and a workspace-membership check |
| 1 | Education | Lesson quizzes, certificates, sales page, workshop and coaching plans | Local draft | `local-education-*` modules with unit tests | Account sync, learner portal |
| 1 | Education | Student portal, progress tracking, video lessons | Not started | Learner preview only (no logins) | Phase 2 |
| 1 | Test pages | Isolated test pages with DEMO/LIVE badges | Working | `/tools/course-creator`, `/tools/onboarding-routes`, `/tools/checkout` | Add to remaining features |
| 2 | Business Launcher | Pricing scenario saved to your account | Working | Real browser against real local Supabase: sign up, create workspace, save scenario locally, save to account (rev 1), update (rev 2), delete browser copy then load from account (identical content), delete account copy. `launcher-api-integration` PASS (cross-user and anonymous denied, stale revision rejected, delete). PGlite security test. `ventra-verify` all steps | Existing browser-local data is kept as the working copy; account copy is explicit. No automatic import of old drafts |
| 2 | Business Launcher | Business plan draft saved to your account | Working | Real browser on `/tools` against real local Supabase: filled the real editor, saved locally, saved to account, deleted the browser copy, loaded from account: identical content. Same `launcher-api-integration` PASS and PGlite security test | none beyond the shared limits above |
| 2 | Business Launcher | Skill assessment, market evidence, offer validation, brand direction saved to your account | Working | Real browser on `/tools` against real local Supabase, each through its real editor: filled and saved locally, saved to account (rev 1), deleted the browser copy, loaded from account, restored content semantically identical to the original (the database reorders JSON keys, so the text is not byte-for-byte the same). Same API and security tests | AI generation not connected (manual drafting); account copy is explicit, no automatic sync |
| 2 | Business Launcher | AI Business Advisor | Not started | Growth Audit is a manual form | Needs AI provider key |
| 2 | Services | Service offers and pricing | Local draft | `local-offers` unit tests; account save on `/workspace` | none |
| 2 | Services | Proposals, agreements, invoices, client portal, project board | Local draft | `service-proposals` (unit + browser test), `local-service-*` unit tests | Real invoicing, e-signature, client login |
| 2 | Website and store | Website pages, templates, storefront, link-in-bio | Local draft | `local-website-*`, `local-storefront`, `local-link-in-bio` unit tests | No publishing, custom domains or AI site generation |
| 2 | Checkout | Test-mode Stripe checkout | Blocked | Real HTTP checks: DEMO without a key, live key refused, wrong origin 403 | Needs your Stripe TEST key in `apps/web/.env.local` |
| 2 | Checkout | Payment webhook and orders | Blocked | Real HTTP checks: signed accepted, retry deduplicated, tampered rejected, live refused | Needs `STRIPE_WEBHOOK_SECRET`; orders are in memory only until you approve a database table |
| 2 | CRM and sales | Contacts, sales pipeline | Local draft | `local-crm-*` unit tests plus browser tests (earlier runs) | Account sync |
| 2 | CRM and sales | Unified inbox, appointments, booking calendar | Not started | Inbox page says "not connected" | Needs a calendar/email provider account |
| 3 | Voice Receptionist | AI answering calls and bookings | Not started | Inbox lists availability only | Needs a voice/phone provider account |
| 3 | Growth | Lead capture forms, growth plan, manual audit | Local draft | `local-lead-forms`, `local-growth-plan`, Growth Audit page | No automated lead discovery or outreach |
| 3 | Growth | AI appointment setter, lead scoring | Not started | none | Needs AI provider and consent rules |
| 3 | Content Studio | Ad concepts, community space (manual drafts) | Local draft | `local-ad-concepts`, `local-community-space` with unit and browser tests | AI generation, calendar, scheduling |
| 3 | Marketing | Email campaigns, funnels, nurture sequences | Not started | none | Needs an email provider |
| 3 | Marketing | Customer follow-up automation | Not started | none | Phase 3 |
| 4 | Automation | Visual workflow builder | Not started | Automation page says execution is not connected | Phase 4 |
| 4 | Analytics | Revenue dashboard and AI insights | Not started | Home shows "no verified data" tiles | Needs connected payment and lead data |
| 4 | Memberships | Memberships and advanced integrations | Not started | Community space is a local draft only | Phase 4 |
