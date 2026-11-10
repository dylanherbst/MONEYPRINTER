# Front-office API contracts (AI Setter and AI Receptionist)

The shapes named here (`Contact`, `Message`, `PendingAction`, ...) are defined once, with runtime validators, in
`apps/web/lib/front-office/contracts.ts`. The UI checks every response with the matching `parse*` function before using
it. Tests: `apps/web/test/front-office-contracts.test.ts` (they also fail if a value list drifts from the database).

Status: **EXISTS** = in the repo today (file given). **PLANNED** = agreed shape, built in the named task. Planned
shapes may gain optional fields; existing fields do not change meaning without a note here.

## Common rules

- **Auth, signed-in endpoints.** Supabase session cookie. Workspace in the query: `?workspace=<uuid>`. Reads run under
  the caller's own token, so row-level security limits them to that workspace. State-changing calls must be same-origin
  JSON (`Content-Type: application/json`).
- **Auth, webhooks.** No user session. Each channel has an id and a key; only the key's SHA-256 is stored. Keys and
  provider tokens never appear in any response.
- **Errors (signed-in endpoints).** `{ "error": "<plain English>", "code": "<code>" }` with the status from
  `lib/api-errors.ts`: `signed_out` 401, `session_revoked` 401, `forbidden_origin` 403, `no_workspace_access` 403,
  `invalid_request` 400, `too_large` 413, `conflict` 409, `rate_limited` 429 (with `Retry-After`), `feature_paused` 423,
  `upstream_failed` 502, `not_configured` 503, `storage_unavailable` 503. Messages never contain provider details.
- **Revision conflicts.** Anything the owner edits carries a `revision`. Send the revision you loaded; `0` creates. Someone
  saved first: `409 conflict`, reload and retry. Nothing is overwritten silently.
- **DEMO / LIVE.** Nothing reaches a real customer unless the owner switched it on with a server flag (names only:
  `FRONT_OFFICE_CHAT_LIVE`, `FRONT_OFFICE_DEMO_LIVE`, `FRONT_OFFICE_SEND_LIVE`, `FRONT_OFFICE_VOICE_LIVE`,
  `FRONT_OFFICE_META_AUTOSEND`). Request data can never turn these on. A connection reports `mode: "LIVE"` only when it is
  `verified`.
- **Operating modes** (`OperatingMode`, per business, per product): `automatic` performs within the business rules;
  `owner_approval` holds the action as a `PendingAction` and commits only after approval; `enquiry_only` answers and
  captures the enquiry but never books, changes, sends or transfers. Default `enquiry_only`. Every book, reschedule,
  cancel, send, follow-up and transfer goes through one shared permission check (A-2), which answers `perform`,
  `hold_for_approval` or `refuse` (`PermissionDecision`).

## Endpoints that exist today

### POST /api/front-office/chat (website chat; Setter demo)
EXISTS: `apps/web/app/api/front-office/chat/route.ts`
- Auth: none (public widget). Origin must be this app or listed in `FRONT_OFFICE_CHAT_ORIGINS`. Rate limited per
  visitor, per client address (demo) and overall.
- Request: `{ visitor: string (16-64 of A-Z a-z 0-9 _ -), message: string (1-2000), id: string (8-64, unique per
  message; a retry with the same id is not recorded twice), demo?: { audit: <saved Growth Audit> } }`. Max 8 KB (40 KB with `demo`).
- Response 200: `ChatReply` (`parseChatReply` fills `demo`, `booked`, `state`, `note` when absent).
  `live: false` means the message was recorded and a person will follow up; `note` says so.
- Errors: `{ error }` (no `code` yet): 400 invalid message, 403 origin, 413 too large, 415 not JSON, 429 busy,
  503 `{ configured: false }` not connected, 503 unavailable.
- DEMO/LIVE: the AI answers only with `FRONT_OFFICE_CHAT_LIVE=1` (demo: `FRONT_OFFICE_DEMO_LIVE=1`). Demo runs on its own
  channel; nothing is sent, booked or scheduled.

### GET /api/front-office/chat?visitor=<id>
EXISTS: same file. The visitor's own conversation for redrawing the widget: `{ messages: { direction, body, at }[] }`
(at most 40). Errors as above.

### GET /api/front-office/settings?workspace=<id>[&template=gym|ventra|custom]
### POST /api/front-office/settings?workspace=<id>
EXISTS: `apps/web/app/api/front-office/settings/route.ts`
- Auth: signed in, workspace **owner** only.
- GET response: `{ settings: AgentSettings, revision: number, saved: boolean, updatedAt?: string }`. Not saved yet:
  the template, `revision: 0`. (`AgentSettings` is defined and validated in `lib/front-office/settings.ts`.)
- POST request: `{ settings: AgentSettings, revision: number }`; response `{ settings, revision, saved: true }`.
- Errors: `no_workspace_access` (not owner), `invalid_request` (first bad field named), `conflict` (revision),
  `storage_unavailable`.

### GET /api/front-office/summary?workspace=<id>&tz=<IANA zone>
EXISTS: `apps/web/app/api/front-office/summary/route.ts`
- Auth: signed in, workspace member. Counts only; no names, numbers or message text.
- Response: `{ summary: FrontOfficeSummary, partial: boolean }` (`lib/front-office/summary.ts`, check with
  `parseSummary`). `partial: true` when the calls or approvals tables are not migrated yet.

### GET /api/front-office/outbox?workspace=<id>
### POST /api/front-office/outbox?workspace=<id>
EXISTS: `apps/web/app/api/front-office/outbox/route.ts` (Instagram and Messenger reply approval; superseded by the
pending-actions queue in A-2, kept working until then).
- Auth: signed in, workspace member.
- GET: `{ items: { id, contact_id, body, prompt_version, created_at, channel_id }[] }` (raw rows, oldest first, at most 100).
- POST: `{ id: uuid, decision: "approved" | "rejected", text?: string (edited reply, max 1000) }` ->
  `{ status: "rejected" | "sent" | "failed", note? }`. Outside Meta's 24-hour window it is approved but not sent.
- Errors: `invalid_request`, `conflict` (already handled or contact opted out).

### Webhooks (not called by the UI)
EXISTS. Shown so the UI knows where data comes from.
- `POST /api/front-office/sms/inbound?channel&key` (Twilio, signed). `apps/web/app/api/front-office/sms/inbound/route.ts`
- `POST /api/front-office/email/inbound?channel&key` (Postmark, basic auth). `.../email/inbound/route.ts`
- `GET|POST /api/front-office/meta/webhook?channel&key` (Meta verify and DMs). `.../meta/webhook/route.ts`
- `POST /api/front-office/voice/vapi[/<channel>]/chat/completions` and `.../webhook` (Vapi custom LLM and call events;
  Bearer = voice channel key). `.../voice/vapi/**/route.ts`, logic in `lib/front-office/vapi-route.ts`. The AI answers only
  with `FRONT_OFFICE_VOICE_LIVE=1`, saved settings, Receptionist and voice switched on.
- `GET|POST /api/front-office/jobs/run` (cron; Bearer secret). Follow-ups and reminders; sent only with `FRONT_OFFICE_SEND_LIVE=1`.

## Planned endpoints

All planned endpoints: signed-in, `?workspace=<id>`, common errors above, lists capped and newest first unless stated.

### Operating modes and the approval queue (A-2 logic, routes A-21)
EXISTS: `apps/web/app/api/front-office/modes/route.ts`, `.../pending-actions/route.ts`, `.../pending-actions/[id]/route.ts`
(shared helpers in `.../pending-actions/shared.ts`). Tests: `apps/web/test/front-office-modes-api.test.ts`.
All take `?workspace=<id>`. Not signed in: `401`. Not a member, not the owner where required, or an item of another
business: the same generic `403 no_workspace_access` (nothing about the other business is returned).
- `GET /api/front-office/modes` -> `{ modes: OperatingModes, revision: number, updatedAt: string | null }`. Member reads.
  Never saved: both `enquiry_only`, `revision: 0`. A stored value the app does not know reads as `enquiry_only`.
- `PUT /api/front-office/modes` `{ modes: { setter, receptionist }, revision }` (same-origin JSON) -> `{ modes, revision,
  saved: true }`. Owner only. Each mode must be `automatic`, `owner_approval` or `enquiry_only` (else `400`).
  `409 conflict` on a stale revision or when the business settings were never saved. Items already held stay held.
- `GET /api/front-office/pending-actions[?status=<PendingActionStatus>][&limit=1..500]` -> `{ items: PendingActionView[] }`.
  Member reads, newest first, default 100. Overdue items are expired before listing. `PendingActionView` is the
  `PendingAction` contract plus `committedAt` and `invalid` (payload `null` when invalid); the idempotency key and
  channel id stay on the server.
- `POST /api/front-office/pending-actions/<id>` `{ decision: "approve" | "reject", note?: string (max 500) }` (same-origin
  JSON) -> `{ outcome: "performed" | "failed" | "rejected" | "expired" | "already_decided", item: PendingActionView }`.
  **Owner only.** Approve performs the held Setter action exactly once through `approvePendingAction` with the same
  executor as a direct action (`createJobsExecutor(createSetterExecutor(...))`) on the channel it came from; texts are a
  dry run unless `FRONT_OFFICE_SEND_LIVE=1`. A repeat decision returns `200 already_decided` and changes nothing; an item
  past its expiry returns `200 expired` and is never performed. `409 conflict` (item stays pending) when it cannot be
  performed here yet: a Receptionist item (no Receptionist approval executor yet), or the item's channel is not
  configured on this server (`FRONT_OFFICE_*_CHANNEL_ID/KEY`).

### Receptionist actions (A-7)
- Existing Vapi endpoints enforce the mode: `owner_approval` holds book, reschedule, cancel and transfer and the caller is
  told honestly ("I have asked the team to confirm"); `enquiry_only` takes a message instead. Each caller turn produces a
  `ReceptionistRunResult` (logged; `pendingActionIds` lists what was held).
- `POST /api/front-office/receptionist/simulate` `{ conversation: { role: "user" | "assistant", content }[], caller?: E.164,
  callId?: string }` -> `{ result: ReceptionistRunResult, call: CallRecord | null }`. Sandbox only: scripted model unless
  the AI is configured, fake or sandbox calendar, nothing sent or dialled. For the receptionist lab.

### Setter actions and follow-ups (A-8)
- The chat, SMS, email and Meta paths enforce the mode for booking, confirmations, follow-up sends and handoffs.
- `POST /api/front-office/setter/simulate` `{ message: string (1-2000), visitor?: string, channel?: ChannelKind }` ->
  `{ result: SetterRunResult, contact: Contact, activity: ActivityEvent[] }`. Sandbox only, same rules as above. For the
  setter lab.

### One customer record and history (A-9)
- `GET /api/front-office/contacts?state=<ContactState>&q=<text>&limit=50&before=<createdAt>` -> `{ items: Contact[] }`.
- `GET /api/front-office/contacts/<id>` -> `{ contact: Contact, bookings: Booking[], calls: CallRecord[] }`; an id from
  another workspace gets the same `invalid_request` answer as an unknown id, so it never reveals that the record exists.
- `GET /api/front-office/conversations` -> `{ items: Conversation[] }`.
- `GET /api/front-office/messages?contact=<id>&before=<createdAt>` -> `{ items: Message[] }` (oldest first, 100 max).
- `GET /api/front-office/activity?contact=<id>` (or the whole workspace without `contact`) -> `{ items: ActivityEvent[] }`.
- `GET /api/front-office/bookings?from=<ISO>&to=<ISO>` -> `{ items: Booking[] }`.
- One contact per person per workspace: phone (E.164) and email (lower case) are unique; no silent merges.

### Lead-to-booking performance (A-10)
- `GET /api/front-office/performance?from=<ISO date>&to=<ISO date>&tz=<IANA>` -> `{ from, to, channels: { channel:
  ChannelKind, enquiries, qualified, booked, attended, lost }[], total: { same counts } }`. Counted only from fo_* rows;
  nothing exists yet: all zeros, never estimates. Shape is finalised (and gets a validator) in A-10.

### Connections and calendar (A-12)
- `GET /api/front-office/connections` -> `{ items: ChannelConnectionState[] }`, one per `ConnectionTarget`. Never returns
  keys, tokens or secrets; `address` is the public number, inbox or page name only. (Channel rows come from the A-5
  inventory; the calendar row from A-12.)
- `GET /api/front-office/calendar/connect` -> redirect to Google consent (owner only). `GET .../calendar/callback`
  stores the connection server-side and redirects to the settings page. `POST .../calendar/disconnect` `{}` ->
  `{ item: ChannelConnectionState }`. Until the owner connects a real account, booking uses a sandbox calendar and the
  calendar row reports `mode: "DEMO"`.

## Field mapping (database -> contract)

The routes map rows; the UI never reads raw columns. `fo_contacts`: `workspace_id` -> `workspaceId`, `web_visitor` ->
`webVisitor`, `instagram_id` -> `instagramId`, `messenger_id` -> `messengerId`, `opted_out_at` -> `optedOutAt` and
`optedOut`, `created_at`/`updated_at` -> `createdAt`/`updatedAt`. `fo_messages`: `contact_id`, `channel_id`,
`prompt_version` -> camelCase; `channel` is the joined `fo_channels.kind`; `provider_id` is internal. `fo_appointments`:
`starts_at`/`ends_at` -> `startsAt`/`endsAt`; `provider_event_id` is internal. `fo_events`: `from_state`/`to_state` ->
`fromState`/`toState`. `fo_calls`: `provider_call_id` and `transcript` are internal (transcript via a later detail call).
