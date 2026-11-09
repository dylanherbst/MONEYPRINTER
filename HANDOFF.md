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

- Last cycle: c-1d830624 at 2026-11-10 04:44 AWST (IN PROGRESS) · dispatched A-2, M-1, M-4, A-3 · committed M-1 0313466e, M-4 434c2a9d, A-2 c145944b
- Integration branch: agent/develop @ c145944b
- Reconciled: cycle c-b47869b9 dispatched A-2, A-3, M-1 and ended with no wrap-up (no files for A-2/A-3; two HTML templates for M-1). Fewer parallel agents this cycle to stay inside the spend cap.
- Verification: repo `scripts/agents/ventra-verify` lint, typecheck, 731 unit, build, workspace-integration PASSED; course/launcher FROZEN. A-2 got ventra-review PASS WITH NOTES plus one fix round.
- Running / implemented (needs reconciling next cycle if this line still says IN PROGRESS): A-3 (setter lab, ventra-feature; scope apps/web/app/tools/setter-lab/**, lib/front-office/setter/lab.ts, test/front-office-setter-lab.test.ts)
- Blocked, needs the owner (new this cycle): A-14: transfer rule — should the AI always hand a customer to a person when asked (recommended), or follow the A-1 contract (enquiry-only never transfers, owner-approval holds it)? Blocks A-7 · A-2: apply migration 202611100001 to LOCAL Supabase and run `npm run test:local-integration` (the Supabase CLI needs approval in coordinator sessions) · M-1: profile package ready for review (handle, waitlist/website links, public email/phone, a larger or SVG logo) · M-4: approve the 30-day calendar (sets Day 1), confirm the "Reported" scheduling limits in the app, decide on camera/voice for the Day 6 Reel
- Blocked, needs the owner (earlier): P0-7: verified but uncommitted. Restore the executable bit on `scripts/agents/ventra-verify` (the edit lost it; the coordinator may not change it), then commit it and run the install script from an owner session · M-0 follow-ups: install ffmpeg or approve the `marketing/` npm install (reels have no audio for now), a white/SVG logo, the CTA waitlist link · A-4 finding: the Receptionist never tells callers to ring 000 in an emergency (wording decision) · P1-6: set a provider-side spending cap on the model key
- Note: pending foreign changes (UI lab, docs retirement, `apps/web/package*.json`, `package.json`, `CLAUDE.md`, `AGENTS.md`, agent/script files, `marketing/BRIEF.md`) were left uncommitted and untouched.
- Next up: A-2 (modes + approval queue, ventra-backend; answer the A-1 open questions first), A-3 (setter lab, ventra-feature), A-0 (audit, ventra-research), M-1/M-4 (marketing)

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
_Generated 2026-11-10 00:59 by `ventra-handoff snapshot`. Do not hand-edit this block._
- Branch: `agent/develop`
- HEAD: `3fb9be6 feat(marketing): brand kit, Instagram templates (carousel, post, story, highlight, reel) and render/reel scripts with size and font checks [M-0]`
- Lock: coordinator (pid 80159, 16 min old)
- Uncommitted changes:
```text
 M .claude/agents/ventra-backend.md
 M .claude/agents/ventra-feature.md
 M .claude/agents/ventra-frontend.md
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
?? .claude/agents/ventra-voice.md
?? "Claude outputs/"
?? apps/web/app/glass-showcase/lgr.css
?? apps/web/app/glass-showcase/liquid-glass-lab.tsx
?? apps/web/app/lab/components/
?? apps/web/app/lab/glass-card/
?? apps/web/components/glass/
```
- Diff stat vs HEAD:
```text
 docs/design/LIQUID_GLASS_SPEC.md                  |  188 ---
 docs/design/reference/dylan-home-dashboard.png    |  Bin 627700 -> 0 bytes
 docs/design/reference/dylan-liquid-glass-kit.png  |  Bin 630505 -> 0 bytes
 docs/design/reference/home-approved.png           |  Bin 2071965 -> 0 bytes
 docs/design/reference/kit-approved.png            |  Bin 1385351 -> 0 bytes
 docs/design/ventra-ui/components.d.ts             |   27 -
 docs/design/ventra-ui/components.js               |  225 ---
 docs/design/ventra-ui/glass.css                   |  249 ----
 docs/design/ventra-ui/tokens.css                  |   15 -
 docs/design/ventra-ui/tokens.json                 |  692 ----------
 package.json                                      |    7 +-
 scripts/agents/install.sh                         |    2 +-
 scripts/agents/ventra-backup                      |    3 +
 scripts/agents/ventra-verify                      |   11 +-
 31 files changed, 1509 insertions(+), 1750 deletions(-)
```
- Recent commits:
```text
3fb9be6 feat(marketing): brand kit, Instagram templates (carousel, post, story, highlight, reel) and render/reel scripts with size and font checks [M-0]
74e037a feat(front-office): Receptionist Test Lab /tools/receptionist-lab runs simulated calls through the real Receptionist pipeline (scripted model, in-memory store, nothing sent) [A-4]
bd9fd25 feat(front-office): shared contracts (types + non-throwing validators) and API_CONTRACTS.md for the UI to bind to [A-1]
4a19e2a fix(front-office): Setter demo chat limited per client address and by a demo-wide ceiling so rotating visitor ids cannot run up model spend [P1-6]
9509701 test(front-office): audit -> enquiry -> offerTimes -> bookSlot sandbox e2e with a fake calendar [P1-3]
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
