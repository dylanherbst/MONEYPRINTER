# VENTRA handoff

Shared state between Claude Code and Codex. The assistant that stops updates this file; the one that starts reads it. Template and rules: `docs/agents/CODEX_HANDOFF.md`.

- **Updated:** 2026-11-03
- **Last editor:** claude
- **Repo:** /Users/dylan/Developer/VENTRA-FEATURES

## Current task (approved scope only)

Stage 2 agent-system setup (agents, skills, docs, handoff). Configuration and documentation only. Do NOT start Course Creator or any feature work until the owner approves.

## Acceptance criteria

See `docs/agents/STATUS.md` for what has been verified.

## Git state (auto)

<!-- git-state:start -->
_Generated 2026-11-03 16:47 by `ventra-handoff snapshot`. Do not hand-edit this block._
- Branch: `chore/agent-setup-handoff`
- HEAD: `f4d57c1 chore: add agent setup, Claude/Codex handoff and role agents`
- Lock: claude (pid 49645, 0 min old)
- Uncommitted changes:
```text
D  .claude/agents/backend.md
D  .claude/agents/feature.md
D  .claude/agents/frontend.md
D  .claude/agents/qa.md
 M .gitignore
 M AGENTS.md
 M CLAUDE.md
 M HANDOFF.md
?? .claude/
?? docs/
?? scripts/agents/
```
- Diff stat vs HEAD:
```text
 .claude/agents/backend.md  |  6 ----
 .claude/agents/feature.md  |  6 ----
 .claude/agents/frontend.md |  6 ----
 .claude/agents/qa.md       |  6 ----
 .gitignore                 |  6 ++--
 AGENTS.md                  | 35 +++++++++++++----------
 CLAUDE.md                  | 70 ++++++++++++++++++++++++----------------------
 HANDOFF.md                 | 41 ++++++++++++++-------------
 8 files changed, 82 insertions(+), 94 deletions(-)
```
- Recent commits:
```text
f4d57c1 chore: add agent setup, Claude/Codex handoff and role agents
f8cfd9f feat(course-creator): add account save and load
476be49 Connect configurable authenticated AI generation and integrate isolated course UI and persistence
a5ac294 Add browser regression for course authoring and reload persistence
fe8a1ad Keep restored course textarea accessible names stable
```
<!-- git-state:end -->

## Changed files and why

Stage 2 files only: `CLAUDE.md`, `AGENTS.md`, `.claude/agents/`, `.claude/skills/ventra-*`, `.claude/settings.json`, `docs/agents/`, `scripts/agents/`, `.gitignore`. No product code.

## Tests run and results

See `docs/agents/STATUS.md`.

## Blockers

- Codex: ChatGPT usage limit until 2026-11-04 14:48; a Codex inspection of this repo is not yet verified.
- Mac permissions (Accessibility, Screen Recording) not verified.
- Telegram bot token was pasted into chat; rotate via @BotFather `/revoke`, then run `ventra-telegram-token`.

## Next steps

1. Owner reviews Stage 2 and approves the first development task.
2. Rotate the Telegram token.
3. After the Codex limit resets, run `ventra-codex` and confirm it inspects this file.

## Do not touch

`VENTRA-CLEAN`, `.env*`, OpenClaw leftovers.
