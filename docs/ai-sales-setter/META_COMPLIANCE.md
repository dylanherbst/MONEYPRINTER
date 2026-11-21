# Meta compliance notes (checked 22 Nov 2026 against developers.facebook.com)

Path: **Instagram API with Instagram Login** (graph.instagram.com). Never mix with Facebook Login / Page tokens (graph.facebook.com).

## Verified from official docs
- Authorize: `https://www.instagram.com/oauth/authorize` with `client_id`, `redirect_uri` (exact match), `response_type=code`, `scope`, `state`. Code valid 1 hour, single use; strip trailing `#_`.
- Short-lived token: `POST https://api.instagram.com/oauth/access_token` (client_id, client_secret, grant_type=authorization_code, redirect_uri, code).
- Long-lived (60 days): `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token` (server side). Refresh: `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token` when at least 24h old and still valid.
- Scopes: `instagram_business_basic`, `instagram_business_manage_messages` (requested). `instagram_business_manage_comments` NOT requested (no verified comment feature on this path).
- Advanced Access (App Review) needed for accounts we do not own; Standard Access only for accounts added in the App Dashboard.
- Send: `POST https://graph.instagram.com/v25.0/<IG_ID>/messages`, Bearer token, body `{"recipient":{"id":"<IGSID>"},"message":{"text":"..."}}`; text UTF-8, max 1000 bytes. Version is configurable (`META_GRAPH_VERSION`, default v25.0).
- Window: "Your app has 24 hours to respond to any message sent from an Instagram user". Only after the user messages first.
- Webhooks: GET `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`; POST header `X-Hub-Signature-256: sha256=<hex>` over the raw payload with the App Secret (implemented as HMAC-SHA256, the standard construction; the page text says "SHA256 signature using the payload and your app's App Secret"). Retries up to 36 hours, so dedupe. Up to 1000 updates per batch.
- Automated-chat disclosure may be legally required (California, Germany). Owner decision (22 Nov 2026): no disclosure line by default; `discloseAi` turns it on per business, and Setup warns about the legal requirement. Replies are written to read like the owner texting. The setter never claims to be human: if asked "are you a bot?" it answers honestly that it is the automated assistant and offers a person; replies claiming to be human are blocked.

## NOT verified (blocked until a live test event or doc confirms)
- **Instagram Login messaging webhook payload shape.** The Instagram webhook reference page could not be fetched. The parser assumes the Messenger-platform shape (`object: "instagram"`, `entry[].id` = our professional account id, `entry[].messaging[]` with `sender.id`, `recipient.id`, `timestamp`, `message.mid`, `message.text`, `message.is_echo`). Unknown shapes are rejected and logged, never guessed. Confirm with the first real test event before enabling auto-send.
- **Private replies (comment-to-DM): BLOCKED on this path.** The official page requires Facebook Login, a linked Page, `pages_messaging`, a Page token and `graph.facebook.com`. Not built. If ever built it must be one message per comment, within 7 days, and no follow-up unless the person replies.
- **Human agent tag:** not used for automation, ever.
- **Conversation routing / thread ownership:** prerequisites are Page-based; unclear for Instagram-Login-only apps. The setter keeps a per-connection `threadOwnershipConfirmed` flag that must be true before auto-send.

## Product rules enforced in code
Automation off by default (`draft_only`); owner must explicitly enable auto-replies; pause + tenant kill switch stop all sends; STOP/unsubscribe opts out immediately; no cold DMs, no scraping, no follower export; purchases/bookings only from verified provider events.
