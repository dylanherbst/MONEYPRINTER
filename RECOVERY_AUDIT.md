# VENTRA recovery audit — 30 October 2026

## Current state and provenance

Working checkout: `/Users/dylan/Developer/VENTRA-CLEAN`. Sole writing developer; no additional agents, protected sessions, deployments, process takeovers, or writes to older repositories.

The recovery records identify `0270b19` (29 October, 02:03 AWST). Before changes, file-content comparison found the app, libraries, tests, scripts and migrations identical to `/Users/dylan/ventra-forward-20261029`. This checkout itself has an unborn `main` branch: there is no local commit history and the source is untracked. No commit or staging was performed.

Read `AGENTS.md`, both recovery records, nested app rules, installed Next.js CSS guidance, both supplied desktop/mobile references and `APP-HEALTH-DIAGNOSIS.md` before editing. The reference directory contains two screenshots and a diagnosis, not a separate V5 specification. Visual acceptance here means comparison to those supplied screenshots; no claim of compliance with an unavailable separate design document.

Read-only comparison covered app, library, test, script and migration files in LAUNCHPAD, ventra-before-20261028, ventra-forward-20261029 and ventra-home-20261028. No missing core library, API or migration was found relative to LAUNCHPAD. Its old root page is replaced by the recovered shell and preserved `/tools` authoring/demo route; Supabase CLI branch metadata was deliberately not copied.

`ventra-home-20261028` at `86f9820df99d2394feb75d86b2e815ba06b664b8` contains later work absent from the recovered forward source: reference-aligned home/navigation, Services/Create/detail pages, manual Grow research/content/campaign composition, customer focus correction, and privacy-conscious unsaved-edit recovery. Integrated the 22 differing/missing app/lib/test files listed below into this checkout. Reviewed key behavior differences and ran fresh validation. Existing base APIs, migrations and original editors remain present. Updated stale README and added a repeatable browser verification script.

## Essential feature inventory

| Area | Present behavior | Verification |
| --- | --- | --- |
| Business setup | Education/business pathways, resumable setup, revision/conflict checks, local notes | Unit tests; rendered restore/navigation |
| Website and selling | Website pages/templates, offers, pricing, storefront, link-in-bio, lead capture | Existing unit tests; website/Create route handlers and responsive route checks |
| Education | Course/lesson drafts, quizzes/learner preview, sales pages, coaching, workshops, certificates, creator workflow | Existing unit tests; delivery route renders |
| CRM | Contacts, consent, follow-up notes, pipeline | Unit tests; rendered save/cancel focus and conflict preservation |
| Service operations | Proposal, agreement, invoice, project-board and client-portal drafts | Existing unit tests; invoice route renders |
| Business planning | Brand, market evidence, offer validation, business plan and skill assessment | Existing unit tests; rendered research save |
| Growth | Manual research, content concepts and source/consent-aware local campaign tasks | Unit tests; rendered save/reload/cancel/source drift/quota/profile conflict and consent refusal |
| Audit/dashboard | Manual Growth Audit, reference dashboard, service categories/search, honest unavailable KPIs | Unit tests; rendered filters, service detail actions and audit destination |
| Original demo | Synthetic course/offer/store publication, role/grant and learner-progress model | Existing tests; `/tools` responsive rendering |
| Account foundation | Auth UI, `/api/workspace`, Supabase client, tenant-isolated migration | Fixture PostgreSQL tests pass; live Supabase checks blocked |

These are local authoring/planning capabilities, not functioning external AI, payment, calendar, voice, social or publishing integrations. No credentials were imported. Existing environment contracts/storage keys were retained.

## Exact validation results

All npm commands used `./scripts/project`: Node **24.21.0**, npm **11.19.0**. System Node differs, so use the wrapper.

- Dependency install: `npm --prefix apps/web ci --ignore-scripts --no-audit --no-fund`, exit **0**, 131 packages installed. `npm ls --depth=0`, exit **0**, no missing/invalid dependencies. Lockfile unchanged. No vulnerability-advisory audit was performed.
- Baseline tests: **257 passed**, 0 failed, 0 skipped, exit **0**.
- Final tests: **261 passed**, 0 failed, 0 skipped, exit **0**. Includes actual fixture PostgreSQL migration/role isolation through PGlite; this is not live Supabase Auth/PostgREST evidence.
- Production build: `npm run build`, exit **0**, Next.js **16.4.1** Turbopack; compiled in **3.0 s**, TypeScript **3.9 s**, **16/16** static generation entries. Route table: 15 static entries including not-found, plus dynamic `/api/workspace`. No application build errors found.
- `npm run typecheck`: exit **0**. `npm run lint`: exit **0**, zero warnings.
- Browser script syntax: `node --check scripts/recovery-browser.mjs`, exit **0**.
- Fresh headless Chromium verification: **94 recorded checks**, exit **0**, no uncaught page exceptions/unexpected console errors, no failed page/assets requests, no external application requests. Three expected browser console resource errors came from the explicitly disconnected `/api/workspace` 503 and are recorded separately.
- Home overflow checked at **1440, 1024, 768, 390, 375 and 320 px**. Keyboard/header checks also at **1280 px**. **21 route/tab combinations** rendered without horizontal page overflow at **1440, 390 and 320 px**. This includes account and original tools routes, not every editor state.
- Browser scenarios verified directory filtering/empty/reset, service favourite/share/manual-audit actions, Create editor links, skip focus/search preservation, dialog focus trapping/Escape/restore, menu navigation/history, customer focus, profile conflicts, recovery snapshots and concealed-field exclusion, Grow local save/reload/cancel and refusal paths.
- Directly inspected new full-page **1440×900** and **390×900** screenshots against supplied references. Layout, teal accents, glass cards and mobile ordering correspond; empty-state text naturally differs from references containing saved records. No physical phone or Safari/WebKit check was performed.
- Backend suites: `test:integration` and `test:api-integration` each exit **2**, reporting missing isolated Supabase test configuration; no live integration checks ran. API smoke confirms HTTP **503**, `configured:false`.

## Preview and evidence

Production build ID: `bGKjfD45Y6yDPqfZFyEH3`.

Running preview: **http://127.0.0.1:3100** from this checkout's `apps/web`, using `next start`, loopback only. Started a new process; did not stop/reuse old preview servers. Sandbox required approval to bind localhost and launch fresh Chromium; both approved actions succeeded.

Reproduce server: `./scripts/project npm --prefix apps/web run start -- --port 3100` after build. Root forwarding scripts do not accept custom port arguments correctly, so use this exact app-level command. The initial root custom-port invocation failed before starting a server; the documented app-level command works.

Evidence (ignored local artifacts): `docs/recovery/verification/home-1440.png`, `home-390.png`, and `results.json`. Test logs are in `/tmp/ventra-*.log`. An initial browser run reached its final check but treated expected backend 503 console messages as failures; the runner now classifies only that exact endpoint/status separately, and the full rerun passed. `failure.png` is a prior diagnostic, not final success evidence.

## Secrets and generated files

Reviewed recovery changes and scanned 481 non-ignored text files for common private-key/token/JWT signatures without printing values. Only two private-key header examples in existing security rules matched; neither contains key material. No credential findings from this bounded scan; this is not an exhaustive security certification. No files were committed or staged.

Verified Git ignores for `node_modules`, `.next`, `*.tsbuildinfo`, `.env.local`, coverage and generated browser evidence. Recovery visual references/evidence remain locally available under the existing ignored `/docs/` rule. Never force-add environment files or generated output.

## Remaining blockers and limits

1. Live backend verification requires an approved, isolated local Supabase instance and test environment values. No backend was created or changed. Cross-account Auth/PostgREST integration remains unverified in this workspace.
2. Real AI generation, automation execution, payments, calendar, voice/messages, social publishing and analytics feeds require authorized provider integrations. They are represented honestly as unavailable; dashboard metrics are not fabricated.
3. Supplied reference screenshots are verified visually; a separate approved V5 source/spec is absent. Physical mobile/browser-engine coverage and exhaustive testing of every original editor remain outside the completed bounded checks.
4. Initial repository has no commits. A future initial commit needs a fresh staged-file secret review; this recovery leaves all changes reviewable and uncommitted.

## Integrated source manifest

- `apps/web/app/ui/ventra-pages.tsx`
- `apps/web/app/ui/ventra-context.tsx`
- `apps/web/app/ui/crm-contacts.tsx`
- `apps/web/app/ui/ventra-services.tsx`
- `apps/web/app/ui/ventra-grow.tsx`
- `apps/web/app/ui/ventra-shell.tsx`
- `apps/web/app/ui/ventra-home.tsx`
- `apps/web/app/ui/ventra-service-components.tsx`
- `apps/web/app/(ventra)/create/page.tsx`
- `apps/web/app/(ventra)/services/page.tsx`
- `apps/web/app/(ventra)/services/growth-audit/page.tsx`
- `apps/web/app/design-system/primitives.tsx`
- `apps/web/app/design-system/refresh.css`
- `apps/web/lib/local-growth-plan.ts`
- `apps/web/lib/ventra-navigation.ts`
- `apps/web/test/ventra-ui-reference.scenarios.json`
- `apps/web/test/ventra-ui-refresh.scenarios.json`
- `apps/web/test/ventra-home.test.ts`
- `apps/web/test/ventra-grow.scenarios.json`
- `apps/web/test/ventra-recovery-privacy.scenarios.json`
- `apps/web/test/local-growth-plan.test.ts`
- `apps/web/test/ventra-phase4.scenarios.json`
