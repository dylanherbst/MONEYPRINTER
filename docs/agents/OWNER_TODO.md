# Owner to-do: logins, keys and approvals

Things only the owner can do. Building continues around them; each line says what it unblocks.
Never paste a secret into a chat: put values in the server environment (`.env.local` on the Mac, or the host's env settings).

## Run on the Mac

- [ ] `ventra-verify` on `feature/front-office-pivot` (runs `next build` and the local Supabase integration, which the Cowork VM cannot).
- [ ] `ventra-handoff status`, then `ventra-handoff recover` if the Nov 3 lock (pid 49645) is stale.
- [ ] Apply the front-office migrations to the LOCAL Supabase stack only: `supabase migration up` (files `202611060001` to `202611060004`). Production migrations need a release review.

## Blocked for now

- [x] Twilio (2026-11-06): account set up by the owner in their own Chrome (the built-in browser fails Twilio's human check). Still to confirm: AU mobile number bought, and its values put in `.env.local`.
- [x] Public URL (2026-11-07): deployed to Vercel (team `ventra14`, project `ventra`, Pro trial) at https://ventra-rho.vercel.app. Production DB is Supabase project "Ventra AI" (ref `radmzhrdgqooukzhtdgg`), all migrations applied. Redeploy from `apps/web` with `vercel --prod`.

- [ ] Google app publishing (2026-11-06): Google needs a home page, privacy policy and a verified domain before the calendar login can be published (otherwise it expires every 7 days). aiventrai.com is a "Coming soon" page. Draft pages are in `/Users/dylan/Developer/aiventrai-site/` (business name and ABN left out for now; add them once registered; have the privacy policy checked). Upload them to the domain's hosting, verify the domain in Google Search Console, then Claude finishes Branding and publishes.

## Logins and keys (server env)

| Needed for | Values | Where to get them |
| --- | --- | --- |
| Inbound SMS webhook (0.5, gate 0.7) | `TWILIO_AUTH_TOKEN` | Twilio console, Account info |
| Sending SMS (1.3 to 1.5) | `TWILIO_ACCOUNT_SID`, `TWILIO_FROM_NUMBER` (E.164, the number leads text) | Twilio console; buy an AU mobile number |
| Webhook URL signing behind a proxy or tunnel | `FRONT_OFFICE_PUBLIC_ORIGIN` (e.g. `https://ventra.example.com`) | Your public URL |
| Google Calendar (1.2, 1.3). Done: project `ventra-front-office`, Calendar API on, OAuth app + web client "Ventra calendar booking" (redirect: OAuth Playground). Left: publish the app, get the refresh token | `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` | Google Cloud console: enable Calendar API, OAuth client (web), consent screen; get a refresh token for the bookings calendar with scopes `calendar.events` + `calendar.freebusy` |
| Setter AI (1.1) | `ANTHROPIC_API_KEY`, `FRONT_OFFICE_MODEL` (exact Claude model id to use) | console.anthropic.com; pick the model id from the models page |
| Follow-up and reminder runner (1.4, 1.5) | `FRONT_OFFICE_CRON_SECRET` (32+ random characters), `FRONT_OFFICE_CHANNEL_ID`, `FRONT_OFFICE_CHANNEL_KEY` | Generate the secret yourself; channel id and key come from `fo_create_channel` |
| Website chat (1.8) | `FRONT_OFFICE_CHAT_CHANNEL_ID`, `FRONT_OFFICE_CHAT_CHANNEL_KEY`; `FRONT_OFFICE_CHAT_ORIGINS` if the widget sits on another site; `FRONT_OFFICE_CHAT_LIVE=1` to let the AI answer | Create a `web-chat` channel with `fo_create_channel` (address = your site, e.g. `ventra.com.au`) |
| Email (1.9) | `POSTMARK_SERVER_TOKEN`, `FRONT_OFFICE_EMAIL_FROM` (verified sender), `FRONT_OFFICE_EMAIL_WEBHOOK_SECRET` (16+ random characters) | Postmark account: a server, a verified sender domain, and an inbound address. Create an `email` channel with `fo_create_channel` |
| Something that calls the runner every minute | `POST /api/front-office/jobs/run` with `Authorization: Bearer <FRONT_OFFICE_CRON_SECRET>` | A cron on the host, or the VENTRA dashboard's Scheduled jobs |

## One-time setup

- [ ] Create Ventra's SMS channel: as the workspace owner, call `fo_create_channel(<workspace id>, 'sms', '<Twilio number>', '<new 40-character key>')`. Keep the key; it goes in the webhook URL and `FRONT_OFFICE_CHANNEL_KEY`.
- [ ] Twilio number, "A message comes in": `POST https://<public origin>/api/front-office/sms/inbound?channel=<channel id>&key=<channel key>`.
- [ ] Postmark inbound webhook URL: `https://ventra:<FRONT_OFFICE_EMAIL_WEBHOOK_SECRET>@<public origin>/api/front-office/email/inbound?channel=<email channel id>&key=<channel key>`. Forward Ventra's enquiry address to the Postmark inbound address.
- [ ] After any change to the Setter's prompt or questions, run the live replay: `ANTHROPIC_API_KEY=... FRONT_OFFICE_MODEL=... node --experimental-strip-types apps/web/test/live/setter-live.ts` (from the repo, env vars in the shell, not in a file). Costs a few cents.
- [ ] Share the bookings Google Calendar with the account that made the refresh token (if they differ).

## Instagram and Messenger (tracker 2.1; code on `feature/ventra-website`)

Code is built: webhook, signature check, 24-hour reply window, approval queue at `/tools/front-office-outbox`. To switch it on:

- [ ] Instagram: make the business account a Professional (Business) account and link it to a Facebook Page.
- [ ] developers.facebook.com: create a Business app with the "Manage messaging and content on Instagram" use case (add Messenger if you want Facebook DMs too). Add yourself as a tester.
- [ ] Put in `.env.local`: `META_APP_SECRET` (App settings > Basic), `META_VERIFY_TOKEN` (make up 20+ random characters), `META_GRAPH_VERSION` (current version shown in Meta's docs, e.g. v23.0), `INSTAGRAM_ACCESS_TOKEN` (generated in the Instagram use case), `MESSENGER_PAGE_TOKEN` (only for Messenger).
- [ ] Create the channels with `fo_create_channel(<workspace>, 'instagram', '<IG account id>', '<40-char key>')` (and 'messenger' with the Page id).
- [ ] Once VENTRA is hosted: webhook URL `https://<public origin>/api/front-office/meta/webhook?channel=<id>&key=<key>`, verify token = META_VERIFY_TOKEN, subscribe to `messages`.
- [ ] Meta App Review for the messaging permission and Business Verification (needs registered business details, likely the ABN) before anyone outside your testers can use it.
- [ ] Optional, later: `FRONT_OFFICE_META_AUTOSEND=1` lets the AI reply without approval. Leave it off for at least the first two weeks (master plan).

## Website (branch `feature/ventra-website`, pages at /site, /site/privacy, /site/terms)

- [ ] Set real prices in `apps/web/lib/site/content.ts` (`plans[].priceMonthlyAud`). Until then the site says "Founding price, confirmed on your call" and offers no checkout.
- [ ] Online checkout (Stripe Express Checkout: Apple Pay, Google Pay, Link) is not built yet: needs real prices, Stripe test keys, then your approval (`NEXT_PUBLIC_SITE_CHECKOUT=1`). Live payments need a separate approval.
- [x] Hosting: live at https://www.aiventra.com.au; app deployed; `aiventra.com.au` (redirects to www) and `www.aiventra.com.au` added in Vercel. GoDaddy DNS: A `@` -> `216.198.79.1`, CNAME `www` -> `fe83dd68d6dd39cf.vercel-dns-017.com` (owner clicks Save).
- [ ] Vercel environment variables (Settings > Environment Variables), then redeploy. Pick the Pro plan before commercial use.
- [x] Google Cloud Branding links + authorised domain saved and app published to production (2026-11-07). Next: get the refresh token in OAuth Playground (see Logins and keys).
- [ ] Have the privacy policy checked. A draft Google Sites site "Ventra website" was started and is unpublished; delete it in sites.google.com if not needed.

## Sales agent (tracker 2.6 to 2.11, foundation built, not live)

Code: `apps/web/lib/front-office/sales/` (offer config, ten-objection playbook, prompt `sales/close@1`, `runSalesTurn`). It quotes only from the config and hands anything else to a person. Nothing calls it yet (the orchestrator's `AgentHooks.sales` hook is not passed by any route).

- [ ] Decide the payment provider (one, e.g. Stripe Payment Links or Square). Until then every close goes to a person to send the agreement and payment details.
- [ ] Set package prices in `lib/front-office/sales/config.ts` (and the matching site plans in `lib/site/content.ts`). With no price the agent never states one.
- [ ] Confirm the escalation threshold: deals above A$2,000 (after discount) go to a person. Draft default; change `escalateAboveAud`.
- [ ] Approve any guarantees or discounts the agent may offer (none today), and the contract/refund terms it may state (none today; it escalates).
- [ ] Review the ten objection responses in the config for Ventra's voice.
- [ ] Approve switching the Sales agent on for booked leads (wires `AgentHooks.sales` in the chat and email routes).

## Decisions and approvals

- [ ] Approve live sending to real people: set `FRONT_OFFICE_SEND_LIVE=1` (until then every message is logged, not sent). Test on your own phone first.
- [ ] Check the Setter's questions and wording for Ventra in `apps/web/lib/front-office/setter/config.ts` (drafted by Claude from the master plan; assumed a 30-minute strategy call by phone, Mon to Fri 9 am to 5 pm Perth).
- [ ] AU Spam Act: confirm leads texting the number counts as consent for replies, and that past-lead reactivation (1.11) has consent before it is switched on.
- [ ] Email provider: Claude assumed Postmark (only `lib/front-office/email.ts` changes if you prefer another).
- [ ] Master plan decisions still open: payment provider (Phase 2), Sales escalation threshold, first three target clients, organic channels to start.
- [ ] Approve a Git remote if you want the branch pushed.
