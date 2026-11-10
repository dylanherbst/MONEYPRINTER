# VENTRA handoff

Shared state between Claude Code and Codex. The assistant that stops updates this file; the one that starts reads it. Template and rules: `docs/agents/CODEX_HANDOFF.md`.

- **Updated:** 2026-11-09
- **Last editor:** claude (Cowork, overnight, owner asleep)
- **Repo:** /Users/dylan/Developer/VENTRA-FEATURES

## FOR THE COORDINATOR: send this to Dylan on Telegram (requested by Dylan, 2026-11-09)

Dylan asked for the mobile app preview link to be sent to him on Telegram. Send this one message with the `reply` tool, then delete this section and commit:

> VENTRA mobile app preview (tap the bottom menu to move between screens): https://claude.ai/artifact/GgRt53mn4e5BKMjWSMy2vE
> The real app is on branch feature/mobile-app. To open it on your phone over Wi-Fi: on the Mac run `cd ~/Developer/VENTRA-FEATURES/apps/web && npx next dev --hostname 0.0.0.0`, then open http://<Mac IP>:3000/app. For a link that works anywhere, run `vercel` in apps/web (preview only).

## Master Coordinator (auto)

- Last cycle: c-ef7fc367 at 2026-11-11 00:43 AWST · 4 dispatched (A-9, A-10, A-16, A-29) + 4 reviews · 4 verified and committed · 0 new owner blockers
- Committed on agent/develop: c9bd2c8e A-10 GET /api/front-office/performance · 85405836 A-9 GET contacts + activity, AU phone/email normalisation · bc7cfbe7 A-16 knowledge base (Setter prompt setter/qualify@2, Receptionist answer_faq) · 8deb3478 A-29 Meta 24h window guard (ladder step 3 now 20h). API_CONTRACTS.md A-9/A-10 sections updated (board commit).
- Verification: npm --prefix apps/web test 890/890 (baseline 851), typecheck 0, lint 0. ventra-verify not run this cycle (no migrations or routes outside front-office API; next cycle should run it).
- Owner decisions (non-blocking): approve the seeded objection replies (A-16); allow merging a chat visitor into an existing contact (A-9, needs migration); confirm "one owner task then stop" when the Meta window closes (A-29).
- Backup FAILED again this cycle: `ventra-backup create` exit 1, no output. Newest complete backup still 2026-11-09 21:55. Needs ventra-devops diagnosis or the owner.
- Next up: A-30 (voice, knowledge follow-ups), A-32 (voice, before A-11), A-31 (backend, CRM follow-ups), A-24 presets, A-25 lab persistence (A-9 done), A-26 Receptionist browser voice; W-1 still needs Playwright.

### Previous cycle c-90917b1a
- Last cycle: c-90917b1a at 2026-11-11 00:12 AWST · 7 dispatched (A-21 review, A-22, A-23, A-23h, A-23b + review, W-1 QA + finish) · 5 verified and committed · 0 new owner blockers
- Owner note 2026-11-10 07:35 handled: planned A-22, A-23 (server) + A-23b (UI), A-24..A-28, plus A-29 (Meta 24h window guard from research). A-9 priority raised to 2 (A-25 depends on it).
- Committed on agent/develop: 58f4bc6b A-22 research (docs/agents/FRONT_OFFICE_RESEARCH.md) · 4ea05b17 A-21 modes + approval-queue routes · 0b5bd67b A-23 Live AI Test engine · af563b9c A-23h hardening · 6f905221 A-23b Setter Lab UI.
- Integration branch: agent/develop @ 6f90522 (board commit follows)
- Verification: npm --prefix apps/web test 851/851, typecheck 0, lint 0, next build OK. ventra-verify (after A-23): lint/typecheck/unit/build/workspace-integration PASSED; course-integration + launcher-integration FAILED (pre-existing, frozen features, P0-7). All five changes reviewed by ventra-review: approve with nits.
- Setter Lab Live AI Test (milestone 1, partly): /tools/setter-lab → Live AI Test, signed in, real model through the same Setter agent, sandboxed, A$5/day cap (FRONT_OFFICE_LAB_DAILY_CAP_AUD). NOT YET TRIED with a real call or in a browser (no Playwright; local server fetch needs approval). Cap store is per process until A-25. Lab bookings are in-memory until A-25 (not in CRM yet).
- Running / implemented (needs reconciling next cycle): W-1 implemented, UNCOMMITTED in ~/Developer/VENTRA-WEBSITE. This cycle: QA code PASS WITH NITS; --faint contrast fixed (#647176, ≥4.65:1); docs/agents/SITE_DESIGN.md written in the worktree; contrast test added (748/748). Only the 390/1440 browser check is missing → blocked on tooling (Playwright not installed; curl/npx denied to subagents). Then commit in the worktree (exclude next-env.d.ts, test-results/).
- Review follow-ups not yet tasks: A-21 nits (fetch item by id RPC, revision int4 cap, Receptionist owner_approval items can never be approved yet); A-23b nits (per-user rate limit on Live, getLabUsage anonymous).
- HANDOFF note "send mobile preview link to Dylan on Telegram" still open: no Telegram chat id available in coordinator cycles (only incoming messages carry it).
- W-0: docs/agents/WEBSITE_AUDIT.md. Key risks: checkout is frozen (423) in shared scope-freeze.ts; /api/checkout takes the client price (must look up server-side); glass kit not on frontend/website-ui.
- Blocked, needs the owner: unchanged from c-9286948e (A-14 transfer rule, A-2 local migration, M-1, M-2, M-4, P0-7, M-0 items, A-4 emergency wording, P1-6). New owner needs from W-0: Stripe test keys/products/prices, un-freeze checkout decision, domain + analytics account, legal read of privacy/terms.
- Note: pending foreign changes left uncommitted and untouched (same list as before).
- Blocked, new this cycle: browser checks (W-1, A-23b) need Playwright installed as a dev dependency or the owner to run them.
- Backup FAILED: newest good backup 2026-11-09 21:55; `ventra-backup create` exited 1 with no output (twice) and `ventra-backup verify` reports missing ~/Backups/ventra/ventra-20261111-002936-56732fc.head (partial backup left in place, not deleted). scripts/agents/ventra-backup has uncommitted foreign edits; ventra-devops should diagnose next cycle.
- Next up: A-16 knowledge base (voice) → A-24 presets; A-9 (backend) → A-25 lab persistence; A-26 Receptionist browser voice (voice, after A-16 or in parallel with backend); A-29 window guard; W-1 browser check + commit, then W-2/W-8.

## Current task (approved scope only)

Owner approved the pivot on 2026-11-06 (Ventra Pivot Master Plan + Implementation Tracker): build only the AI front office
(Setter, Sales, Receptionist) and freeze everything else in the backend. Branch `feature/front-office-pivot`, made from
`frontend/glass-dashboard-reference` at b611bed. Work done from a Cowork session (Claude, Linux VM on this Mac's folders).
Committed from the Cowork VM with plain git at the owner's request (ventra-git only runs on the Mac). Same secret scan as ventra-git: 0 hits. Only the files below were staged.

## Production (2026-11-07, owner approved hosting)

- Live: https://www.aiventra.com.au (Vercel team `ventra14`, project `ventra`, Pro trial; GoDaddy DNS A @ 216.198.79.1,
  CNAME www to Vercel). Deployed by the owner with `vercel --prod` from `apps/web` (`.vercelignore` keeps uploads small).
- DB: Supabase "Ventra AI" (ref `radmzhrdgqooukzhtdgg`), all 27 migrations applied via the SQL editor. Auth Site URL
  https://www.aiventra.com.au/workspace. Google OAuth app published.
- Vercel env present: see `docs/agents/OWNER_TODO.md` > Production status. Four secrets were saved as Config and need
  re-saving as Secret. Claude Console balance is A$0 (Setter cannot answer until funded).
- Added on `feature/ventra-website` (not deployed until the owner redeploys): Vercel Cron for the job runner (`vercel.json`,
  GET + `CRON_SECRET`), the runner now covers every configured channel (SMS, chat, email), `docs/agents/sql/create_channels.sql`
  for the owner to create channels, a "person can step in" line on the site chat, and the Sales agent foundation
  (`lib/front-office/sales/`, not wired live).

## VENTRA Glass v2 on glasscn (2026-11-09, owner asked to "use glasscn for whatever uses glass")

- App look is now **VENTRA Glass**, built on glasscn (MIT, kostyniuk/glasscn-components). Reference for building screens: design system https://claude.ai/artifact/GcMeCNBwhLtUB1QBNNsogN (README has the element → glasscn component + glassVariant table). Owner-facing screen designs: https://claude.ai/artifact/MKN6B76iaFZmfNdCWWntfb
- Code: `components/ui/glasscn/*` + `components/ui/*` (shadcn base), `lib/glass-variants.ts`, `lib/utils.ts`, `app/design-system/glass/ventra-glass.css` (Tailwind v4 without preflight + tokens scoped to `.vg-app`), `app/design-system/liquid-glass/components.tsx` (same API as v1, now glasscn), `app.css` (shell + legacy bridge). `globals.css` element rules are now in `@layer base`.
- After pulling: run `npm install` in apps/web (new deps: Tailwind v4, Base UI, lucide-react, fontsource). Vercel installs them itself.
- Commit author for Vercel deploys must be founder@aiventrai.com (the Vercel account email), or the deploy is blocked.

## Mobile app in Liquid Glass (2026-11-09, branch `feature/mobile-app`, off `feature/ventra-website` e011f27)

Owner asked (09 Nov, from the Build Plan + Blueprint + Liquid Glass rules PDFs): start building, mobile first. Not deployed.
The uncommitted pre-Liquid-Glass edits to `design-system/theme.css` + `tokens.css` were parked in `git stash` ("pre-liquid-glass restyle ... parked 2026-11-09"), not deleted.

- App shell rebuilt to the approved look (`app/ui/ventra-shell.tsx`): lit wall → one glass sheet → top bar (wordmark with the new ribbon V, search, notifications, account menu) → content → fixed bottom nav with safe-area inset. From 1024px the nav becomes a glass sidebar with Create and theme. Pearl/Night via `data-theme` on `<html>`.
- Navigation is now the blueprint's five areas: Home `/app` (also `/`), Create, Customers, Grow, Money (`lib/ventra-navigation.ts`). More moved into the account menu. `/app` exists because on aiventra.com.au "/" is the marketing site.
- Library: `app/design-system/liquid-glass/` = tokens.css (scoped to `.vg-app`, type classes prefixed `vg-t-`), glass.css (copy of the approved file), app.css (shell, page patterns, globals.css neutralisers, and the **legacy bridge**), components.tsx (TSX port of components.js + ListRow, SectionHead, PageHead).
- Legacy bridge: screens not rebuilt yet render inside `<Legacy>` (`.ventra-app.vg-legacy`); their `--v-*` tokens point at Liquid Glass tokens so everything sits on the same glass. Tools, workspace, settings, onboarding, services, sales, business, inbox, insights, more use it.
- Native Liquid Glass screens: Home (`app/ui/ventra-home.tsx`), Create/Customers/Grow/Money tops (`app/ui/ventra-areas.tsx`), Growth Audit wizard `/grow/audit`.
- Live numbers: `GET /api/front-office/summary?workspace=&tz=` (members only, RLS, counts only, no contact details; `lib/front-office/summary.ts`), used by `app/ui/live-summary.ts`. Not signed in / not configured = "—" and one honest notice.
- Growth Audit calculator (blueprint §18 formula): `lib/growth-opportunity.ts` + `app/ui/growth-opportunity.tsx`. One question at a time, Back/Skip, resumes from this browser, ranked findings with evidence, confidence and adjustable assumptions, "estimate, not a promise". Test page `/tools/growth-opportunity`.
- AI team settings now has a customer route `/customers/ai-team` (same component as `/tools/front-office-settings`, moved to `app/ui/ai-team-settings.tsx`).
- Installable app: `app/manifest.ts` (start `/app`), `app/icon.png`, `app/apple-icon.png`, `public/brand/*` from the owner's ribbon-V logo; viewport-fit cover + theme colours in `(ventra)/layout.tsx`.
- Tests: new `front-office-summary.test.ts`, `growth-opportunity.test.ts`; `ventra-home.test.ts` updated for the five areas. Cloud container Node 22.23: 610 pass, 0 fail; tsc, eslint and `next build` pass. Playwright at 390px and 1440px, Pearl and Night: no horizontal scroll, no page errors; nav, account menu, search, Create dialog and the full audit flow checked.
- Not done yet: native rebuilds of onboarding, Business/offers, inbox, settings (still on the bridge); live numbers need sign-in + migrations on production; notifications feed is a placeholder card.

## AI front office for gyms + AI Receptionist (2026-11-08, owner decisions)

Owner decided: the Setter and Receptionist are a product for gym clients, tested on Ventra first; voice through Vapi (its
Custom LLM is an HTTP endpoint that works on Vercel; Retell's needs a WebSocket server); the Receptionist answers FAQs,
books/moves/cancels, qualifies new callers, transfers or takes messages. On `feature/ventra-website`, not deployed:

- Migration `202611080001_front_office_receptionist.sql`: `fo_agent_settings` (owner-only `fo_get/save_agent_settings`
  with a revision check, `fo_channel_settings` for webhooks), `fo_calls` + `fo_voice_turn/contact/reply/outcome/end`,
  `fo_reschedule`, `fo_cancel_booking`, event kinds call/booking/message. Not yet applied to production.
- `lib/front-office/settings.ts` + `templates/gym.ts` (gym FAQs and hours deliberately empty) + `templates/ventra.ts`.
  Chat, SMS, email, Meta and the job runner load each channel's business settings (fallback: Ventra's own config).
- `/tools/front-office-settings` + `GET/POST /api/front-office/settings` (owners).
- `lib/front-office/receptionist/` (prompt `receptionist/voice@1`, tools, streamed turns), `lib/front-office/vapi.ts`
  (request/event parsing, chunk format, doc URLs), `lib/front-office/vapi-route.ts`, routes under
  `/api/front-office/voice/vapi/` (env channel) and `/api/front-office/voice/vapi/<channel id>/` (one per business).
  Auth: the voice channel key as Vapi's Bearer token. Answers only with `FRONT_OFFICE_VOICE_LIVE=1` + saved settings with
  Receptionist and phone switched on; otherwise an honest "not switched on" line, a call-back message, hang up.
- Streaming Anthropic client (`anthropicStream`); calendar move/cancel; `rescheduleSlot`, `cancelBooking`.
- Tests: `front-office-receptionist-db` (PGlite), `front-office-receptionist` (scripted model, Vapi fixtures),
  `front-office-ventra-e2e`; `test/live/setter-live.ts` now also replays five Receptionist calls.
- Not verified against a live Vapi call (needs the owner's Vapi account). The exact Vapi request body fields used
  (`call.id`, `call.customer.number`) and the transferCall/endCall function-call shape follow Vapi's docs and support
  threads; confirm on the first test call.

## App UI: Liquid Glass (2026-11-08, owner approved)

- App look is now the real `liquid-glass-react` component (wrapper `apps/web/components/ui/liquid-glass-card.tsx`); rules in `docs/design/UI_BIBLE.md`, kit `apps/web/components/glass/`, live gallery `/lab/components` on branch `ui/lab`. The old Liquid Glass spec, UI guide and reference images were retired on 2026-11-09. Old design-system pages on claude.ai deleted. Live screens still use `app/design-system/*` and `components/ui/glasscn` until rebuilt screen by screen.
- Applies to the app only; `apps/web/app/site/**` (marketing website) is unchanged.
- Not started: porting the app shell and Home to this look (owner said go after approving the kit).

## Acceptance criteria

Tracker Phase 0: 0.1 scope freeze, 0.2 orchestrator, 0.3 lead store + state machine, 0.4 handoff schema,
0.5 SMS webhook, 0.6 outbound log with prompt version, 0.7 gate (a text creates a contact with a state).

## Git state (auto)

<!-- git-state:start -->
_Generated 2026-11-11 01:02 by `ventra-handoff snapshot`. Do not hand-edit this block._
- Branch: `agent/develop`
- HEAD: `8deb347 feat(front-office): Meta 24-hour window guard: gate() and the jobs runner refuse automated Instagram/Messenger sends outside 24h of the last inbound; reroute only with explicit SMS/email consent, else one owner task; never HUMAN_AGENT; ladder step 3 at 20h [A-29]`
- Lock: coordinator (pid 45489, 19 min old)
- Uncommitted changes:
```text
 M .claude/agents/ventra-backend.md
 M .claude/agents/ventra-feature.md
 M .claude/agents/ventra-frontend.md
 M .claude/agents/ventra-qa.md
 M .claude/agents/ventra-setup.md
 M AGENTS.md
 M CLAUDE.md
 M HANDOFF.md
 M apps/web/app/design-system/glass/ventra-glass.css
 D apps/web/app/glass-showcase/card-demo.tsx
 D apps/web/app/glass-showcase/liquid-glass-card.tsx
 M apps/web/app/glass-showcase/page.tsx
 D apps/web/app/lab/lab.css
 D apps/web/app/lab/page.tsx
 M apps/web/package-lock.json
 M apps/web/package.json
 M docs/agents/API_CONTRACTS.md
 M docs/agents/TASKS.md
 M docs/agents/TASK_BOARD.json
 D docs/design/LIQUID_GLASS_SPEC.md
 D docs/design/reference/dylan-home-dashboard.png
 D docs/design/reference/dylan-liquid-glass-kit.png
 D docs/design/reference/home-approved.png
 D docs/design/reference/kit-approved.png
 D docs/design/ventra-ui/components.d.ts
 D docs/design/ventra-ui/components.js
 D docs/design/ventra-ui/glass.css
 D docs/design/ventra-ui/tokens.css
 D docs/design/ventra-ui/tokens.json
 M package.json
 M scripts/agents/install.sh
 M scripts/agents/ventra-backup
 M scripts/agents/ventra-verify
?? .claude-sync/
?? .claude/agents/ventra-marketing.md
?? .claude/agents/ventra-store.md
?? .claude/agents/ventra-voice.md
?? .claude/agents/ventra-web-design.md
?? .codex/agents/ventra-marketing.toml
?? .codex/agents/ventra-store.toml
```
- Diff stat vs HEAD:
```text
 docs/design/LIQUID_GLASS_SPEC.md                  | 188 ------
 docs/design/reference/dylan-home-dashboard.png    | Bin 627700 -> 0 bytes
 docs/design/reference/dylan-liquid-glass-kit.png  | Bin 630505 -> 0 bytes
 docs/design/reference/home-approved.png           | Bin 2071965 -> 0 bytes
 docs/design/reference/kit-approved.png            | Bin 1385351 -> 0 bytes
 docs/design/ventra-ui/components.d.ts             |  27 -
 docs/design/ventra-ui/components.js               | 225 -------
 docs/design/ventra-ui/glass.css                   | 249 --------
 docs/design/ventra-ui/tokens.css                  |  15 -
 docs/design/ventra-ui/tokens.json                 | 692 ----------------------
 package.json                                      |   7 +-
 scripts/agents/install.sh                         |   2 +-
 scripts/agents/ventra-backup                      |   3 +
 scripts/agents/ventra-verify                      |  11 +-
 33 files changed, 184 insertions(+), 1705 deletions(-)
```
- Recent commits:
```text
8deb347 feat(front-office): Meta 24-hour window guard: gate() and the jobs runner refuse automated Instagram/Messenger sends outside 24h of the last inbound; reroute only with explicit SMS/email consent, else one owner task; never HUMAN_AGENT; ladder step 3 at 20h [A-29]
bc7cfbe feat(front-office): business knowledge base (services, prices, offers, policies, objection rules) in agent settings; Setter prompt and Receptionist answer_faq answer listed prices and refuse unlisted ones; expired offers filtered in code; template seeds only state what templates say [A-16]
8540583 feat(front-office): one customer record read path: GET /api/front-office/contacts and /activity, AU phone and email normalisation, read-side dedupe, local-crm import plan (no writes), PGlite RLS tests [A-9]
c9bd2c8 feat(front-office): lead-to-booking performance from fo_* rows at GET /api/front-office/performance; paged reads, cohort-scoped events/appointments, attended null with reason, null ratios on zero denominators [A-10]
7ad03ae chore(coordinator): cycle c-90917b1a backup failure note
```
<!-- git-state:end -->

## Changed files and why

- `docs/agents/SCOPE_FREEZE.md`, `docs/agents/PARKED.md`: tracker 0.1.
- `apps/web/lib/scope-freeze.ts` (new), `lib/api-errors.ts` (`feature_paused` = 423): backend freeze.
  Paused: `/api/courses`, `/api/courses/generate`, `/api/workspace/courses`, `/api/workspace/course-generation`,
  `/api/checkout` (423), `/api/stripe/webhook` (503 so Stripe retries), and every launcher draft kind except
  crm-contacts, crm-pipeline, lead-forms, lead-scoring, lead-followups, booking-page, notification-prefs. No data deleted.
  Override for local debugging only: `VENTRA_SCOPE_FREEZE=off`.
- `supabase/migrations/202611060001_front_office.sql` (new): fo_channels, fo_contacts (state machine), fo_messages
  (prompt version required on automated sends), fo_events, fo_handoffs, and the RPCs fo_create_channel,
  fo_list_channels, fo_ingest_sms, fo_log_dispatch, fo_log_outbound, fo_set_state, fo_record_handoff. Not applied anywhere.
- `apps/web/lib/front-office/` (new): state.ts, handoff.ts, router.ts, opt-out.ts, twilio.ts, orchestrator.ts.
- `apps/web/app/api/front-office/sms/inbound/route.ts` (new): Twilio webhook. Needs TWILIO_AUTH_TOKEN (and
  FRONT_OFFICE_PUBLIC_ORIGIN behind a proxy). `lib/rate-limit.ts`: smsWebhookGlobal limiter.
- `apps/web/app/tools/front-office/page.tsx` (new): isolated DEMO test page.
- Tests: new `test/scope-freeze.test.ts`, `test/front-office.test.ts`, `test/front-office-db.test.ts`;
  `route-audit`, `route-rate-limits`, `workspace-routes` set `VENTRA_SCOPE_FREEZE=off` because they test the logic behind the freeze.
- Left untouched: the 2 uncommitted UI files from the frontend branch (`theme.css`, `next-env.d.ts`).

### Phase 1 (calendar and booking, tracker 1.2 and 1.3), owner chose Google Calendar on 2026-11-06

- `lib/front-office/calendar/slots.ts`: open slots from weekly hours in the client's time zone, minus busy time, buffer and notice; offers 2-3 spread-out times.
- `lib/front-office/calendar/google.ts`: Google Calendar over REST (OAuth refresh token), free/busy, event insert with invite (`sendUpdates=all`), idempotent by deterministic event id.
  Env: GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN, GOOGLE_CALENDAR_ID.
- `lib/front-office/booking.ts`: offerTimes, bookSlot (re-checks the slot, creates the event, records it, logs then sends the confirmation SMS).
- `lib/front-office/sms-send.ts`: Twilio Messages API sender. Real sends only with FRONT_OFFICE_SEND_LIVE=1 plus TWILIO_ACCOUNT_SID / TWILIO_FROM_NUMBER; otherwise dry run (logged, not sent).
- `supabase/migrations/202611060002_front_office_appointments.sql`: fo_appointments, fo_book (records + moves the contact to booked atomically), fo_booking_for_event.
- `app/tools/front-office-booking/page.tsx`: DEMO slot-offer test page. Tests: `test/front-office-calendar.test.ts`, more in `front-office-db.test.ts`.
- Not yet wired to an agent: the Setter (1.1 qualification prompt) will call offerTimes/bookSlot.

### Phase 1 continued (Setter agent, follow-ups, reminders, handoffs: tracker 1.1, 1.4 to 1.7, 1.10, 1.13)

- `lib/front-office/setter/config.ts`: per-client Setter config (questions as config). Ventra defaults drafted by Claude: OWNER to check.
- `lib/front-office/setter/prompt.ts` (`setter/qualify@1`), `setter/agent.ts` (one turn: context, tool loop, guardrails),
  `lib/front-office/llm.ts` (Anthropic Messages API; ANTHROPIC_API_KEY + FRONT_OFFICE_MODEL, no default model).
- Tools: save_answers, set_stage (qualified only with required answers), offer_times, book_time (only offered times),
  handoff_receptionist (1.7), escalate_human. Booking records the Sales handoff (1.6) and schedules 24 h and 2 h reminders (1.5).
- `lib/front-office/jobs.ts`: follow-up ladder 5 min, 1 h, 1 d, 3 d, 7 d, then monthly (1.4); reminders; no-show rescue
  (`markNoShow`). `POST /api/front-office/jobs/run` (Bearer FRONT_OFFICE_CRON_SECRET) runs due jobs.
- SMS webhook: when the AI is configured, the Setter replies after the webhook answers (`after()`), through the sender
  (logged only unless FRONT_OFFICE_SEND_LIVE=1).
- Migration `202611060003_front_office_setter.sql`: contact answers, fo_contact_context, fo_save_answers, fo_jobs,
  fo_schedule_job, fo_claim_jobs, fo_finish_job; fo_ingest_sms now cancels follow-ups and rescues on any reply.
- Tests: `test/front-office-setter.test.ts` = the scripted Setter set (happy path, angry, wrong number, existing customer,
  discount ask, guardrails, jobs). The model is scripted; a live replay against the real model is still to build.
- Owner actions are listed in `docs/agents/OWNER_TODO.md`.

### Web chat, email and the live replay (tracker 1.8, 1.9, 1.10)

- Migration `202611060004_front_office_chat_email.sql`: web chat visitors as contacts, generic `fo_ingest` for chat and email,
  `fo_save_details` (answers + name/email/mobile, never silently merges records), `fo_chat_history`.
- `POST/GET /api/front-office/chat` + `/tools/front-office-chat` test page: AI answers only with FRONT_OFFICE_CHAT_LIVE=1.
- `lib/front-office/email.ts` (Postmark, assumed) + `POST /api/front-office/email/inbound`: basic-auth secret, only the new
  part of the email is read, replies thread with In-Reply-To. The job runner emails follow-ups to contacts with no mobile.
- Setter is channel-aware (style and length per channel; asks for mobile or email before booking on chat and email).
- `apps/web/test/live/setter-live.ts`: replays the scenarios against the real model (needs the key; not part of `npm test`).

## Tests run and results

2026-11-08: Node 24.21 in the Cowork VM: 601 pass, 0 fail; tsc and eslint pass.
2026-11-07: Node 24.21 in the Cowork VM: 582 pass, 0 fail; tsc and eslint pass. Earlier run (Node 22.23):
- `tsc --noEmit`: pass. `eslint . --max-warnings 0`: pass.
- `node --experimental-strip-types --test test/*.test.ts`: 557 pass, 0 fail (514 before the pivot). Gate 0.7 covered by
  `front-office-db.test.ts` on PGlite with the real migration (fixture Auth, NOT Supabase integration).
- One flaky timing test seen once (`local-service-client-portal-draft`, "source drift"); passes on rerun, untouched code.
- NOT run: `next build` (node_modules hold macOS binaries) and `npm run test:local-integration`.

## Blockers

- Gate 0.7 on a real number needs: the migration applied to the local Supabase stack, a Twilio number, TWILIO_AUTH_TOKEN,
  and a channel created with fo_create_channel. Production steps need owner approval.
- Feature tiles in the UI still show frozen tools (feature-registry.ts is presentation, tested against FEATURES.md); the
  backend refuses them. Hide them in a frontend task if wanted.
- Agent lock in the worktree still names claude pid 49645 (2026-11-03). Run `ventra-handoff status` / `recover` on the Mac.
- Earlier: Telegram token rotation; Codex inspection not verified.

## Next steps

1. Owner: `docs/agents/OWNER_TODO.md` > "Next, in order (production)": Secret re-save, Claude funds, workspace, run
   create_channels.sql, CRON_SECRET, Google refresh token, redeploy, test chat, approvals.
2. Owner: Vapi steps in `docs/agents/OWNER_TODO.md` > "AI Receptionist (Vapi)"; apply migration 202611080001 in the
   Supabase SQL editor; fill in /tools/front-office-settings.
3. Build next: Sales payment step once a provider is chosen (2.9), wire `AgentHooks.sales` on approval, 1.11 reactivation
   (needs consent confirmed), 1.12 Google Business replies (needs profile access).

## Do not touch

`VENTRA-CLEAN`, `.env*`, OpenClaw leftovers.
