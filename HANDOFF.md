# VENTRA handoff

Shared state between Claude Code and Codex. The assistant that stops updates this file; the one that starts reads it. Template and rules: `docs/agents/CODEX_HANDOFF.md`.

- **Updated:** 2026-11-06
- **Last editor:** claude
- **Repo:** /Users/dylan/Developer/VENTRA-FEATURES

## Current task (approved scope only)

Owner approved the pivot on 2026-11-06 (Ventra Pivot Master Plan + Implementation Tracker): build only the AI front office
(Setter, Sales, Receptionist) and freeze everything else in the backend. Branch `feature/front-office-pivot`, made from
`frontend/glass-dashboard-reference` at b611bed. Work done from a Cowork session (Claude, Linux VM on this Mac's folders).
Committed from the Cowork VM with plain git at the owner's request (ventra-git only runs on the Mac). Same secret scan as ventra-git: 0 hits. Only the files below were staged.

## Acceptance criteria

Tracker Phase 0: 0.1 scope freeze, 0.2 orchestrator, 0.3 lead store + state machine, 0.4 handoff schema,
0.5 SMS webhook, 0.6 outbound log with prompt version, 0.7 gate (a text creates a contact with a state).

## Git state (auto)

<!-- git-state:start -->
_Generated 2026-11-03 16:47 by `ventra-handoff snapshot`. Do not hand-edit this block._
- Branch: `chore/agent-setup-handoff`
- HEAD: `f4d57c1 chore: add agent setup, Claude/Codex handoff and role agents`
- Lock: claude (pid 49645, 0 min old)
- Uncommitted changes:
```text
D  .claude/agents/backend.md
D  .claude/agents/feature.md
D  .claude/agents/frontend.md
D  .claude/agents/qa.md
 M .gitignore
 M AGENTS.md
 M CLAUDE.md
 M HANDOFF.md
?? .claude/
?? docs/
?? scripts/agents/
```
- Diff stat vs HEAD:
```text
 .claude/agents/backend.md  |  6 ----
 .claude/agents/feature.md  |  6 ----
 .claude/agents/frontend.md |  6 ----
 .claude/agents/qa.md       |  6 ----
 .gitignore                 |  6 ++--
 AGENTS.md                  | 35 +++++++++++++----------
 CLAUDE.md                  | 70 ++++++++++++++++++++++++----------------------
 HANDOFF.md                 | 41 ++++++++++++++-------------
 8 files changed, 82 insertions(+), 94 deletions(-)
```
- Recent commits:
```text
f4d57c1 chore: add agent setup, Claude/Codex handoff and role agents
f8cfd9f feat(course-creator): add account save and load
476be49 Connect configurable authenticated AI generation and integrate isolated course UI and persistence
a5ac294 Add browser regression for course authoring and reload persistence
fe8a1ad Keep restored course textarea accessible names stable
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

## Tests run and results

Run in the Cowork Linux VM with Node 22.23 (the project pins 24.21; run `ventra-verify` on the Mac to confirm):
- `tsc --noEmit`: pass. `eslint . --max-warnings 0`: pass.
- `node --experimental-strip-types --test test/*.test.ts`: 539 pass, 0 fail (514 before the pivot, 529 after Phase 0). Gate 0.7 covered by
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

1. Owner runs `ventra-verify` on the Mac (next build + local Supabase integration were not run in the VM).
2. Owner: create a Google Cloud OAuth client and a refresh token for the bookings calendar; put the 4 GOOGLE_CALENDAR_* values in the server env.
3. Phase 1 next: 1.1 qualification prompt as config (the Setter agent that calls offerTimes/bookSlot), 1.4 follow-up ladder, 1.5 reminders.

## Do not touch

`VENTRA-CLEAN`, `.env*`, OpenClaw leftovers.
