# Frontend progress (owner master brief, 2026-11-05)

Branch `frontend/glass-dashboard-reference`. Palette: approved V5 teal glass kept (light default; dark is an opt-in teal variant). Design source: `docs/DESIGN.md`.

## Stage 1 (mobile foundation): done, awaiting independent QA
- Shell: five-destination navigation (Home, Create, Grow, Customers, More) in the sidebar and a safe-area bottom bar; avatar/account button and notifications in the mobile header; `/tools` removed from customer navigation (pages still exist).
- Feature registry `lib/feature-registry.ts` (65 entries) with `test/feature-registry.test.ts` checking each status against `docs/agents/FEATURES.md`.
- Components: `design-system/feature-tile.tsx` (FeatureTile, AvailabilityLabel, PlainTile), `design-system/charts.tsx` (Panel, StatCard, BarChart, Donut, ProgressList, FunnelBars, AccentCard), `ui/ventra-hubs.tsx`.
- Hubs: `/create` (route-aware order: Courses & Coaching, Start a Business, Services & Offers, Website & Store), `/grow` (no `tab`), `/customers` (no `tab`), `/more` (new). Tabs views keep a "back to hub" link.
- Home: welcome, one personalised primary action by route, Today (top 3, rest collapsed), route progress (course lessons / launch plan steps / follow-ups and campaign drafts), recent saved work (account activity), recommended tools, business overview labelled Local draft.

## Features connected to verified APIs (unchanged real components)
Contacts, deals, follow-ups, offers, website/storefront drafts, workflow/email/funnel/content drafts, notifications, team, integrations, account activity (all existing editors and `LauncherAccountSync`).

## Draft only (labelled)
Sales reports, business overview (FEATURES.md Local draft).

## Disabled (greyed, reason shown)
AI course generation, video lessons, student accounts, AI business idea helper, public booking, live memberships, AI website, checkout, orders, email sending, AI image/video, lead discovery, running automations, AI receptionist, inbox, calendar, auto-assign, revenue/AI insights, billing.

## Open issues
- Mobile: Start a Business flow tiles (skills, validation, pricing, branding, plan, checklist) still open `/tools` because `BusinessLauncher` has no customer route yet (Stage 2: wrap it).
- Course Creator (`/tools/course-creator`, sandbox profile) is separate from the profile editor under Create > Courses (`/business?tab=delivery`).
- No sticky primary action bar yet on editor pages; keyboard-safe dialogs only checked by reading code.
- Desktop: sidebar/Home desktop layout from step 1-2 of the first brief is in place; Stage 3 refinement not done.
- Not yet browser-checked: every sub-tab in dark; tablet 768 and 1024.

## Next priority
Stage 2: customer route for the Start a Business flow, sticky save actions, confirmation/loading/error states; Stage 3 desktop and tablet pass; Stage 4 QA.
