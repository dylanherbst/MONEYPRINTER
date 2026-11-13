# AiMoneyPrinter — engineering workspace

Standalone git repository `~/Developer/AIMONEYPRINTER`, branch `aimp/foundation` (split from VENTRA `agent/develop` @ 04e0080 with full history on 13 Nov 2026). No remote yet (GitHub token pending).
VENTRA is archived; this is the only active product. The old worktree link is kept as `.git-ventra-worktree-link.bak` (ignored). Source of truth for scope: *AiMoneyPrinter Master Business Plan (Nov 2026)*.

## Done (12 Nov 2026)
- Phase 0 audit of all VENTRA branches (baseline = `agent/develop`; 1106 tests, 1101 pass, 5 todo, typecheck clean).
- Provider/cost research (Stripe Connect AU, Pinterest v5, Ayrshare, Vercel Platforms, Trigger.dev, Resend, Supabase, OpenAI, fal, ACL/Spam Act/GST).
- `apps/web/lib/aimp/contracts.ts` — §12.4 workflow contracts, statuses, business models → engines.
- `apps/web/lib/aimp/opportunity-scoring.ts` + `test/aimp-opportunity-scoring.test.ts` — §B02 deterministic rubric v1 (5/5 pass, tsc + eslint clean).
- `docs/aimp/proposed/aimp_commerce_core.sql` — §12.3 commerce core (businesses, products, assets, merchant accounts, stripe_events, orders, order_items, fulfilments, usage_ledger, audit_events) with RLS. PROPOSAL; validated in PGlite on top of s01. Not in `supabase/migrations`.

## Storefront renderer (12 Nov 2026, plan §D01–D03, §D06 basics)
- Routes `/s/[store]` (home, `products/[product]`, `policies/[policy]`, `contact`), `proxy.ts` maps `<slug>.$AIMP_STORE_ROOT_DOMAIN` → `/s/<slug>` (off when unset).
- `lib/aimp/storefront/{schema,tenant,load,demo-store}.ts`: validated config (AI output can't inject markup/themes/sections), reserved subdomains, fail-closed loader, single buy-button rule (`checkoutBuilt=false`, demo can never charge).
- DEMO store `slow-morning`; test page `/tools/storefront`. Tests: 1119 total, 1114 pass, 5 todo, 0 fail; tsc + eslint clean; `next build` passes. Mobile/desktop screenshots, no horizontal overflow.
- Next: load published configs from DB (`site_versions`), real product covers from factory, Stripe checkout route then flip `checkoutBuilt`.

## Website (12 Nov 2026, per AiMoneyPrinter WEBSITE Plan PDF)
- `/plant-lab` (lab route, noindex): hero with pinned copy/CTAs, 400vh seed→planted→sprout→tree 3D story, real-output "Watch AI build a business" demo, how it works (with honest Live / In pilot / Coming labels), business models, pilot pricing, "what we will never promise", FAQ, final CTA. `/plant-lab/build`: 3-step Choose → Preview → Save & Launch flow (blueprint preview, labelled).
- 3D: Blender 5.2 script `assets-src/plant/build_plant.py` → `public/plant/plant.glb` (quantised, 760 KB / 435 KB gzip) + `branches.json`; `plant.blend` editable. three.js 0.186.1 scene in `app/plant-lab/_scene/` renders on demand from one progress scalar (`lib/aimp/plant/timeline.ts`, tested continuous + reversible); pointer tilt + tap pulse via springs; RAF stops when settled; pauses offscreen/hidden; disposes on unmount.
- Fallbacks: authored WebP stills (captured from the same scene) for first paint, no-JS, no-WebGL and prefers-reduced-motion.
- Brand on site is the working name "Seedline" (`lib/aimp/site-config.ts`) until legal/Stripe review. `PRODUCT.md` (Impeccable) at apps/web.
- Evidence: 1131 tests (1126 pass, 5 todo), tsc + eslint clean, `next build` passes; scroll checkpoints 0/.2/.4/.55/.7/.85/1 captured desktop + iPhone 13; scrolling back to 0 is pixel-identical; no horizontal overflow at 320/375/430/768/1280/1440.
- Open: real-device iPhone Safari + Lighthouse runs; homepage integration after approval; preview not yet carried into signup.

## 13 Nov 2026
- O2-3 fixed (plan step 2): `app/api/workspace/route.ts` session cookies now `Path=/api` so `/api/front-office/*` and other `requireWorkspace` routes receive them; legacy `Path=/api/workspace` cookies are expired on every set/clear so a stale token can't shadow the new one. Test `test/workspace-cookie-path.test.ts` (fails before, passes after).
- Agents: `skills:` preloads + an AiMoneyPrinter section added to every `.claude/agents/ventra-*.md` (phase ownership per the roadmap). `web-design-guidelines` symlinked into `.claude/skills` so frontend/web-design/QA/review can preload it.
- Evidence (Mac VM): 1136 tests, 1131 pass, 0 fail, 5 todo; tsc clean; eslint clean on changed files. Not run: full lint, `next build`. Committed as 8ce30e5 when the repo was split.

## Next, in order (one writer at a time)
1. Merge remaining branch work: backend/ventra-api-20261030 courses diff; cherry-pick 7393505; decide design system, then liquid-glass commits.
2. ~~Fix auth cookie path (O2-3)~~ — done 13 Nov.
3. Replace `lib/scope-freeze.ts` active list with AiMoneyPrinter modules (needs owner OK).
4. Move commerce-core SQL into migrations; persist webhook orders; Stripe Accounts v2 + direct charges.
5. Public multi-tenant storefront route (host-based middleware, `{slug}.<domain>`).
6. Document engine (C02) for one pilot niche → real PDF output + QA.
7. Signed-download fulfilment (E04) via Supabase Storage + Resend; Trigger.dev jobs.
8. Pinterest direct integration (F05) once Standard access is granted.

## Constraints carried from VENTRA rules
No raw push; owner approval for merges to protected branches, deploys, prod migrations, env vars, payments, publishing, spend.
Never read `.env*`. Every feature gets a `/tools/<feature>` test page. Evidence (lint/typecheck/test/build) before "done".
