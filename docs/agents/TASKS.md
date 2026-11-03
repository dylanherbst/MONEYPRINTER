# VENTRA task register

The only task board. Update a row when its state changes, with evidence. States: Assigned, Running, Implemented, Verified locally, Accepted by review, Approved for release, Deployed. Do not skip or merge states. Real status comes from Git and test results, not from this file alone.

| ID | Task | Owner | State | Branch / commit | Evidence | Blockers |
| --- | --- | --- | --- | --- | --- | --- |
| S2 | Stage 2: agent system, skills, docs, guard hook | Chief of Staff | Verified locally (not yet accepted by owner) | `chore/agent-setup-handoff` | `docs/agents/STATUS.md` | Codex retest after 2026-11-04 14:48; Telegram end-to-end retest; Mac permissions |
| C1 | Course Creator: QA-only baseline pass (no code changes) | `ventra-qa` | Implemented (existing code); NOT verified locally: QA FAIL (partial) | code identical to `feature/course-creator-20261030` @ `f8cfd9f` | `QA_COURSE_CREATOR_BASELINE.md` | broken browser test; no DEMO/LIVE badges; account/AI paths unproven (Docker/Supabase not running) |
| C2 | Fix stale selector in `apps/web/test/course-creator-browser.mjs` (test file only) | `ventra-feature` | Verified locally (not yet accepted by owner) | working tree on `chore/agent-setup-handoff`, uncommitted | dev run 4 of 4 exit 0; independent `ventra-qa`: 3 consecutive passes, negative check fails correctly, lint/typecheck/269 tests pass (Node 26) | none; account half of the test is mocked |
| A1 | Automation and approval policy (guards, guarded Git, approvals) | Chief of Staff | Verified locally (not yet accepted by owner) | `chore/automation-policy` | `AUTOMATION_POLICY.md`, 29 agent tests, 77 dashboard tests, live hook tests | GitHub protection needs GitHub Pro or a separate dev repo; no remote linked; local and GitHub histories differ |

Existing Course Creator planning notes: `COURSE_CREATOR.md`, `COURSE_CONNECTIONS.md`, `COURSE_NEXT_PHASE.md` (may be stale; verify against the code before use).
