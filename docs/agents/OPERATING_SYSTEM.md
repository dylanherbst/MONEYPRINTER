# VENTRA AI operating system (Stage 3), checked 2026-11-03

## Roles

| Stage 3 role | Implemented as | Writes code | Notes |
| --- | --- | --- | --- |
| Coordinator | Main session (Chief of Staff, `CLAUDE.md`) | no | Plans, delegates, records in `TASKS.md`. Subagents cannot spawn subagents, so the Coordinator must be the main session. |
| Frontend | `ventra-frontend` | yes | Uses `docs/DESIGN.md`; design plugins on demand |
| Backend | `ventra-backend` | yes | |
| Feature | `ventra-feature` | yes | Builds the isolated test page |
| Testing | `ventra-qa` | no | Runs lint, typecheck, tests, build, browser checks |
| Code Review | `ventra-review` | no | Reviews the real diff before QA |
| Research | `ventra-research` | no | Spec and acceptance criteria |
| DevOps | `ventra-devops` | no | Health, backups, CI check, audits, release review; never deploys |
| Connections | `ventra-setup` | limited | Extra role from Stage 2 |

Concurrency on this 8 GB Mac: one writing agent plus at most one read-only helper. One writer per worktree (`ventra-handoff` lock). Use a separate worktree (`ventra-git branch`) only when two writers are truly needed; raise the limit only after measuring (dashboard System checks: CPU, memory, disk).

## Already in place before Stage 3 (kept unchanged)

Bash and edit guard hooks, `ventra-git`, approval inbox with macOS authentication, Codex handoff, Telegram bridge, VENTRA Control dashboard (agents, workflows, jobs, schedules, approvals, Codex), plugin set (`PLUGINS.md`). See `AUTOMATION_POLICY.md`.

## Added in Stage 3

- Agents `ventra-review`, `ventra-devops`.
- `ventra-backup create|verify|list`: git bundle (all branches and history) plus a secret-free file archive into `~/Backups/ventra` (mode 700, never overwritten). `verify` restores the newest bundle into a temp clone and checks the commit.
- Dashboard System checks now show CPU load, memory free, disk free and running Next.js dev servers (real values).
- `ventra-statusline`: model, branch and CPU load for the Claude Code status line.

## Test pipeline and retry rule

Required gate for every task: `npm run lint`, `typecheck`, `test`, `build`, then `ventra-git checks`. Also run the changed feature's `apps/web/test/<feature>-browser.mjs` (Playwright, 375 px and desktop) instead of all of them. A coding agent may repair a routine failure at most 3 times; then record BLOCKED in `HANDOFF.md` and stop that task. Failures are never hidden and gates are never skipped.

## Recovery from an interrupted task

1. `ventra-handoff status`, `git status`, read `HANDOFF.md`.
2. `ventra-handoff recover` only if the lock holder is gone.
3. Restore files from `ventra-backup`: `git clone ~/Backups/ventra/<name>.bundle /tmp/restore` (history) or extract the `.files.tar.gz` (working files). Never restore over a live worktree without the owner.

## Remote access

Official: run `claude remote-control --name ventra` in a Terminal on this Mac, then open the session in claude.ai/code or the Claude mobile app. It stays up only while that terminal process runs; it is not a background service. Telegram already works through `ventra-claude` (allowlisted owner only, approvals only in the Command Center).

## Scheduled work

Dashboard schedules (read-only jobs) run only while this Mac is awake and logged in. Claude Desktop scheduled tasks are separate. No schedules are created yet; see the report for proposed jobs.

## Codex fallback

`codex` CLI 0.166.0 is installed and signed in with ChatGPT (subscription sign-in, not an API key). Handoff: `/ventra-codex-handoff`. Last known limit: retry after Nov 4 2:48 PM. API billing is never used without your explicit permission.

## Limits

- The dashboard is a zero-dependency Node and plain JavaScript app, not React and TypeScript. It was kept to preserve its tested security model (77 tests) and low memory use on an 8 GB Mac; rewriting it is possible on request.
- Dashboard repo `VENTRA-DASHBOARD` is not an approved repository for `ventra-git`; only the owner can add it to `~/.ventra-dashboard/git-policy.json`.
- Production protection on GitHub is unavailable for this private repo on the free plan (`GITHUB_PROTECTION.md`).
