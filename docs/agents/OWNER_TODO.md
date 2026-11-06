# Owner to-do: logins, keys and approvals

Things only the owner can do. Building continues around them; each line says what it unblocks.
Never paste a secret into a chat: put values in the server environment (`.env.local` on the Mac, or the host's env settings).

## Run on the Mac

- [ ] `ventra-verify` on `feature/front-office-pivot` (runs `next build` and the local Supabase integration, which the Cowork VM cannot).
- [ ] `ventra-handoff status`, then `ventra-handoff recover` if the Nov 3 lock (pid 49645) is stale.
- [ ] Apply the front-office migrations to the LOCAL Supabase stack only: `supabase migration up` (files `202611060001` to `202611060003`). Production migrations need a release review.

## Logins and keys (server env)

| Needed for | Values | Where to get them |
| --- | --- | --- |
| Inbound SMS webhook (0.5, gate 0.7) | `TWILIO_AUTH_TOKEN` | Twilio console, Account info |
| Sending SMS (1.3 to 1.5) | `TWILIO_ACCOUNT_SID`, `TWILIO_FROM_NUMBER` (E.164, the number leads text) | Twilio console; buy an AU mobile number |
| Webhook URL signing behind a proxy or tunnel | `FRONT_OFFICE_PUBLIC_ORIGIN` (e.g. `https://ventra.example.com`) | Your public URL |
| Google Calendar (1.2, 1.3) | `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` | Google Cloud console: enable Calendar API, OAuth client (web), consent screen; get a refresh token for the bookings calendar with scopes `calendar.events` + `calendar.freebusy` |
| Setter AI (1.1) | `ANTHROPIC_API_KEY`, `FRONT_OFFICE_MODEL` (exact Claude model id to use) | console.anthropic.com; pick the model id from the models page |
| Follow-up and reminder runner (1.4, 1.5) | `FRONT_OFFICE_CRON_SECRET` (32+ random characters), `FRONT_OFFICE_CHANNEL_ID`, `FRONT_OFFICE_CHANNEL_KEY` | Generate the secret yourself; channel id and key come from `fo_create_channel` |
| Something that calls the runner every minute | `POST /api/front-office/jobs/run` with `Authorization: Bearer <FRONT_OFFICE_CRON_SECRET>` | A cron on the host, or the VENTRA dashboard's Scheduled jobs |

## One-time setup

- [ ] Create Ventra's SMS channel: as the workspace owner, call `fo_create_channel(<workspace id>, 'sms', '<Twilio number>', '<new 40-character key>')`. Keep the key; it goes in the webhook URL and `FRONT_OFFICE_CHANNEL_KEY`.
- [ ] Twilio number, "A message comes in": `POST https://<public origin>/api/front-office/sms/inbound?channel=<channel id>&key=<channel key>`.
- [ ] Share the bookings Google Calendar with the account that made the refresh token (if they differ).

## Decisions and approvals

- [ ] Approve live sending to real people: set `FRONT_OFFICE_SEND_LIVE=1` (until then every message is logged, not sent). Test on your own phone first.
- [ ] Check the Setter's questions and wording for Ventra in `apps/web/lib/front-office/setter/config.ts` (drafted by Claude from the master plan; assumed a 30-minute strategy call by phone, Mon to Fri 9 am to 5 pm Perth).
- [ ] AU Spam Act: confirm leads texting the number counts as consent for replies, and that past-lead reactivation (1.11) has consent before it is switched on.
- [ ] Master plan decisions still open: payment provider (Phase 2), Sales escalation threshold, first three target clients, organic channels to start.
- [ ] Approve a Git remote if you want the branch pushed.
