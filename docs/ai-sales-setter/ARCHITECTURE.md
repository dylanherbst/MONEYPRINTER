# AI Sales Setter architecture (as built, 22 Nov 2026)

One multi-tenant service; the model is a replaceable component with no authority to send.

```
Meta POST /api/webhooks/meta/instagram
  -> verifySignature (raw body, X-Hub-Signature-256)        lib/aimp/setter/webhook.ts
  -> parseInstagramPayload -> NormalizedEvent ig.v1           (unknown shapes refused)
  -> tenant: connectionByAccount(entry.id) -> workspace       lib/aimp/setter/store.ts
  -> dedupe: claimEvent(account, mid)
  -> per-conversation serial lock                              lib/aimp/setter/pipeline.ts
  -> rules first: STOP -> opt out; "real person" -> handoff; owner echo -> takeover
  -> checkEligibility (kill switch, mode, pause, connection, scope, thread ownership, opt-out, takeover, 24h window)  eligibility.ts
  -> agent.decide (rules or LLM, tenant facts only)            agent.ts
  -> validateDecision (strict schema, extra fields rejected)   decision.ts
  -> applyPolicy (links, prices, claims, sources, confidence, 1000 bytes, AI disclosure, no re-pitch)  policy.ts
  -> draft | send | handoff | ignore
  -> deliver: idempotency key per message, re-check eligibility, unseal token, send, retry with backoff, dead-letter  sender.ts
  -> audit + metrics                                           analytics.ts
```

Owner side: `/app/<business>/setter` (Inbox and test, Setup, Results). Sandbox per business in `app/start/_server/setter-runtime.ts`.
OAuth: `/api/integrations/instagram/start` and `/callback` (state signed + bound to an httpOnly nonce cookie, 10 min expiry; token sealed AES-256-GCM).
Outcomes: `clickLink`/`recordClick` (signed redirect, a click only), `recordVerifiedOutcome` (call only from verified Stripe/booking webhooks).
