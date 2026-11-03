# VENTRA task register

The only task board. Update a row when its state changes, with evidence. States: Assigned, Running, Implemented, Verified locally, Accepted by review, Approved for release, Deployed. Do not skip or merge states. Real status comes from Git and test results, not from this file alone.

| ID | Task | Owner | State | Branch / commit | Evidence | Blockers |
| --- | --- | --- | --- | --- | --- | --- |
| S2 | Stage 2: agent system, skills, docs, guard hook | Chief of Staff | Verified locally (not yet accepted by owner) | `chore/agent-setup-handoff` | `docs/agents/STATUS.md` | Codex retest after 2026-11-04 14:48; Telegram end-to-end retest; Mac permissions |
| C1 | Course Creator: continue development | (unassigned) | Not started; waiting for owner approval | `feature/course-creator-20261030` | n/a | Owner approval of Stage 2 and of this task |

Existing Course Creator planning notes: `COURSE_CREATOR.md`, `COURSE_CONNECTIONS.md`, `COURSE_NEXT_PHASE.md` (may be stale; verify against the code before use).
