# VENTRA feature list and status

Source for the Agent Dashboard "Features" page. Checked 2026-11-03 against the code and the test results on branch `chore/plugin-setup`. Statuses are evidence-based, not percentages:

- **Working**: runs end to end in a real browser or against the real local database, checked this session (`ventra-verify` passes). Has a Demo page to open.
- **Local draft**: built and unit-tested (and often browser-tested earlier), but saves only in this browser unless noted. No live backend, AI or provider is connected. Not re-run in a browser this session.
- **Blocked**: built, but needs a key, account or owner decision before it can be verified.
- **Not started**: no working code.

The Demo column is a path in the VENTRA app. The dashboard opens it on the running VENTRA app (start it with `npm run dev` in the repo, or the QA preview).

| Phase | Module | Feature | Status | Demo | Evidence | Next or needs |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Platform | Sign up, sign in, sign out | Working | /workspace | `test:local-integration` PASS against real local Supabase; real browser sign-up and workspace creation | none |
| 1 | Platform | Three customer routes (Education, Independent, Grow) | Working | /tools/onboarding-routes | Browser check of chooser, save, reload, Home; unit tests; `ventra-review` APPROVE | none |
| 1 | Platform | Personalised onboarding and Home | Working | /onboarding | Route shown on Home (production build); plan changes per route | Dev-mode Home hydration quirk (not investigated) |
| 1 | Platform | Account data saving (profile, offers) | Working | /workspace | Workspace API round trip, tenant isolation, stale revision, staff read-only: PASS on real local Supabase | none |
| 1 | Platform | Isolated test pages with DEMO/LIVE badges | Working | /tools/course-creator | `/tools/course-creator`, `/tools/onboarding-routes`, `/tools/checkout`, `/tools/launcher-account` | Add to remaining features |
| 1 | Platform | Teams, permissions, notifications | Not started | | Only owner/staff roles exist in the database | Phase 4 |
| 1 | Platform | Subscriptions and billing for VENTRA itself | Not started | | none | Needs payment provider decisions |
| 1 | Platform | Integrations settings | Local draft | | Settings page lists connections as "not connected" | Real connection tests per provider |
| 1 | Education | Course Creator (create, edit, save, reload, update, delete) | Working | /tools/course-creator | Browser check on the isolated page; unit tests | none |
| 1 | Education | Course saved to account | Working | /tools/course-creator | `course-api-integration` PASS (save, load, update, stale rejected, other user denied) | none |
| 1 | Education | Learner preview of a course | Working | /tools/course-creator | Preview button on the Course Creator page (browser-local, no logins) | Real student portal is separate |
| 1 | Education | AI course generation | Blocked | | Route exists, rate-limited, adapter and validation mock-tested only | Needs an OpenAI key (costs money) and a workspace-membership check |
| 1 | Education | Lesson quizzes | Local draft | | `local-education-lesson-quiz` unit tests | Account sync |
| 1 | Education | Certificates | Local draft | | `local-education-certificate-template` unit tests; account sync wired, migration 202611030004 pending, browser round trip not yet run | Issuing and verification |
| 1 | Education | Course sales page | Local draft | | `local-education-course-sales-page` unit tests; account sync wired, migration 202611030004 pending, browser round trip not yet run | Publishing and checkout |
| 1 | Education | Coaching program and workshop plans | Local draft | | `local-education-coaching-program`, `local-education-workshop-plan` unit tests; account sync wired, migration 202611030004 pending, browser round trip not yet run | Booking and delivery |
| 1 | Education | Video lessons | Not started | | none | Needs video hosting |
| 1 | Education | Student portal and progress tracking | Not started | | Learner preview only | Phase 2 |
| 2 | Business Launcher | Skill self-assessment saved to your account | Working | /tools | Real browser round trip against real local Supabase through the real editor | AI analysis not connected |
| 2 | Business Launcher | Market evidence notebook saved to your account | Working | /tools | Same round trip, semantically identical on reload | No AI niche research |
| 2 | Business Launcher | Offer validation worksheet saved to your account | Working | /tools | Same round trip | none |
| 2 | Business Launcher | Pricing scenario saved to your account | Working | /tools/launcher-account | Real browser round trip including update (rev 2) and delete; `launcher-api-integration` PASS | none |
| 2 | Business Launcher | Brand direction saved to your account | Working | /tools | Same round trip as the other drafts | No logo or image generation |
| 2 | Business Launcher | Business plan draft saved to your account | Working | /tools | Same round trip | AI plan generation not connected |
| 2 | Business Launcher | Guided launch checklist | Local draft | | Setup plan from onboarding is generated per route and saved in the profile | Account progress sync verified only for the profile |
| 2 | Business Launcher | AI business idea generator and AI Business Advisor | Not started | | Growth Audit is a manual form | Needs AI provider key |
| 2 | Services | Service offers and pricing | Local draft | | `local-offers` unit tests; offers save to the account on `/workspace` | Dedicated service package screens |
| 2 | Services | Proposals | Local draft | | `service-proposals` unit and browser tests; account sync wired, migration 202611030004 pending, browser round trip not yet run | Sending and acceptance |
| 2 | Services | Agreements and contracts | Local draft | | `local-service-agreement-draft` unit tests; account sync wired, migration 202611030004 pending, browser round trip not yet run | E-signature |
| 2 | Services | Invoices | Local draft | | `local-service-invoice-draft` unit tests; account sync wired, migration 202611030004 pending, browser round trip not yet run | Real invoicing and payment |
| 2 | Services | Client portal | Local draft | | `local-service-client-portal-draft` unit tests; account sync wired, migration 202611030004 pending, browser round trip not yet run | Client login |
| 2 | Services | Project board | Local draft | | `local-service-project-board` unit tests; account sync wired, migration 202611030004 pending, browser round trip not yet run | Browser round trip |
| 2 | Services | Booking pages | Not started | | none | Needs a calendar provider account |
| 2 | Services | Memberships | Not started | | Community space is a local draft only | Phase 4 |
| 2 | Website and store | Website pages and templates | Working | /business?tab=website | Website page: Real browser against real local Supabase through its real editor: filled and saved locally, saved to account (rev 1), deleted the browser copy, loaded from account, restored content semantically identical | No publishing or domains |
| 2 | Website and store | Storefront and product listings | Working | /tools | Storefront draft: Real browser against real local Supabase through its real editor: filled and saved locally, saved to account (rev 1), deleted the browser copy, loaded from account, restored content semantically identical | Publishing, checkout |
| 2 | Website and store | Link-in-bio page | Working | /tools | Link-in-bio page: Real browser against real local Supabase through its real editor: filled and saved locally, saved to account (rev 1), deleted the browser copy, loaded from account, restored content semantically identical | Publishing |
| 2 | Website and store | AI website generation, drag-and-drop editing, custom domains | Not started | | none | Needs AI key and domain provider |
| 2 | Checkout | Test-mode Stripe checkout | Blocked | | Real HTTP checks: DEMO without a key, live key refused, wrong origin 403 | Needs your Stripe TEST key in `apps/web/.env.local` |
| 2 | Checkout | Payment webhook and orders | Blocked | | Real HTTP checks: signed accepted, retry deduplicated, tampered rejected, live refused | Needs `STRIPE_WEBHOOK_SECRET`; orders are in memory only until you approve a database table |
| 2 | CRM and sales | Contacts saved to your account | Working | /customers | Real browser on `/customers` against real local Supabase: created two contacts through the real form, saved to account, deleted the browser copy, loaded from account, both contacts restored and shown in the list (semantically identical). All 14 draft kinds pass the real API test | none |
| 2 | CRM and sales | Sales pipeline and deals saved to your account | Working | /customers?tab=opportunities | Real browser: created a deal linked to a contact, saved to account, deleted the browser copy, loaded from account, deal restored and shown | none |
| 2 | CRM and sales | Unified inbox | Not started | | Inbox page says "not connected" | Needs email or messaging provider |
| 2 | CRM and sales | Appointments and calendar | Not started | | Home shows "Calendar not connected" | Needs a calendar provider account |
| 2 | CRM and sales | Lead qualification and rule-based scoring | Local draft | /customers?tab=lead-scoring | Unit tests (apps/web/test/local-lead-scoring.test.ts, launcher-drafts tests) pass; rules editor, scored contacts table with reasons, consent cap, isolated page /tools/lead-scoring exist; migration 202611030005 pending, browser round trip not yet run | Browser round trip after the owner applies the migration |
| 2 | CRM and sales | Lead qualification and sales reporting | Not started | | none | Phase 3 |
| 3 | Voice Receptionist | AI answering calls, FAQs, bookings, call summaries | Not started | | Inbox lists availability only | Needs a voice or phone provider account |
| 3 | Growth | Lead capture forms | Working | /tools | Lead form: Real browser against real local Supabase through its real editor: filled and saved locally, saved to account (rev 1), deleted the browser copy, loaded from account, restored content semantically identical | Public forms |
| 3 | Growth | Growth plan and manual audit | Local draft | | `local-growth-plan`, Growth Audit page | No automated lead discovery |
| 3 | Growth | Lead discovery, outreach drafts, AI appointment setter, lead scoring, follow-ups | Not started | | none | Needs AI provider and consent rules |
| 3 | Content Studio | Ad concepts (manual drafts) | Working | /tools | Ad concepts (list): Real browser against real local Supabase through its real editor: filled and saved locally, saved to account (rev 1), deleted the browser copy, loaded from account, restored content semantically identical | AI generation, scheduling |
| 3 | Content Studio | Community space (manual drafts) | Working | /business?tab=delivery | Community draft (shown for profiles with the education pathway): Real browser against real local Supabase through its real editor: filled and saved locally, saved to account (rev 1), deleted the browser copy, loaded from account, restored content semantically identical | Real community features |
| 3 | Content Studio | Social posts, captions, content calendar, AI images and video | Not started | | none | Needs AI provider key |
| 3 | Marketing | Email campaigns, funnels, lead magnets, nurture sequences | Not started | | none | Needs an email provider |
| 4 | Automation | Visual workflow builder, triggers, actions, AI agents | Not started | | Automation page says execution is not connected | Phase 4 |
| 4 | Analytics | Revenue dashboard, conversion and campaign analytics, AI insights | Not started | | Home shows "no verified data" tiles | Needs connected payment and lead data |
