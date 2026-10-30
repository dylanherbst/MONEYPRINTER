# Research and Connections — 2026-10-30

Roles executed serially by coordinator: nested spawning unavailable (depth 1/1). Research and Connections performed read-only inspection; this report is coordinator-owned. No external accounts created, credentials displayed, deployment or purchases made.

## Simplest reliable stack
Keep existing Supabase Auth/Postgres/RLS and use server-only OpenAI HTTP adapter, avoiding a new SDK. Official docs checked: https://platform.openai.com/docs/api-reference/chat/create (redirects developers.openai.com; Chat Completions supported, Responses recommended for new projects), https://supabase.com/docs/guides/database/postgres/row-level-security (RLS plus grants both required). Existing application has Supabase dependency and workspace session model. JSON mode plus existing course validation rejects invalid output; no fabricated fallback.

## Required user actions
1. Approve/select DEV Supabase project; provide URL and publishable key securely as NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in apps/web/.env.local. Do not send service-role keys to browser. Auth email/password or confirmed test account needed; user must authorize applying migrations to selected DEV DB. No migration applied to remote DB here.
2. Approved OpenAI API project with billing/quota and model access. Server-only OPENAI_API_KEY and OPENAI_MODEL; explicit model selection needed. Never NEXT_PUBLIC AI key. No live call made without configuration.
3. Existing /api/workspace sign-in uses HttpOnly cookies scoped /api/workspace. Browser generation therefore calls /api/workspace/course-generation, same-origin protected; /api/courses/generate also supports Bearer token. Expired access requires sign-in; generation does not refresh cookie itself.
4. Course persistence API GET /api/courses?workspace=UUID; POST {workspace,id,revision,course}, bearer token. revision 0 creates; returned revision required for next write. Backend migration adds RLS and owner-only RPC. Account save/load controls not yet integrated into sandbox; local Save remains browser-only. No publishing/entitlements implemented.

## Honest blockers
No matching AI/Supabase environment variable names or .env.local found in inspected Feature checkout; only .env.example. Live AI, hosted DB/Auth integration and account save/load browser flow unverified. API/database configurable implementation is not live success.

## Runtime
.nvmrc/.node-version and engines pin Node 24.21.0, npm 11.19.0. Actual Node 26.11.1; npm version recorded in final evidence. Passing checks under Node 26 do not establish pinned Node 24 reproducibility. No runtime pin edited; rerun CI under pinned versions before release.

## Attachment limitation
This child has no session-history/media-resolution capability in effective tool catalog. Same provided current media URI twice denotes a duplicate reference, not evidence of two distinct files. Visible task brief was followed; original media body and older 19:03 attachment could not be independently retrieved. Parent must resolve via its available attachment/history tools or request reattachment. No invented attachment contents.
