# VENTRA handoff

Shared state between Claude Code and Codex. The assistant that stops updates this file; the one that starts reads it.

- **Updated:** 2026-11-03
- **Last editor:** claude
- **Repo:** /Users/dylan/Developer/VENTRA-FEATURES

## Current task

Environment setup only (Claude Code, Telegram, Codex, handoff). No product code has been changed. Do not start a major rewrite until setup is verified.

## Git state

- **Branch:** `chore/agent-setup-handoff` (cut from `feature/course-creator-20261030` at `f8cfd9f`)
- **Uncommitted changes:** new `CLAUDE.md`, `HANDOFF.md`, `.claude/agents/`; edited `AGENTS.md`
- **Untracked, not ours:** `SOUL.md`, `IDENTITY.md`, `USER.md`, `DREAMS.md`, `memory/` (OpenClaw leftovers; leave alone)
- **No Git remote** is configured for this repo.

## Changed files

See `git status`. Setup files only.

## Tests

None run yet for this change. Product tests: `npm test`, `npm run typecheck`, `npm run build`.

## Blockers

- Codex: ChatGPT usage limit hit until 2026-11-04 14:48; `codex exec` inspection of this repo not yet run.
- Mac permissions (Accessibility, Screen Recording) and browser/app interaction test not yet done.
- Telegram bot token was pasted into chat; rotate via @BotFather `/revoke`, then run `ventra-telegram-token`.

## Next steps

1. Rotate the Telegram token and restart `ventra-claude`.
2. After the Codex limit resets, run `ventra-codex` and confirm it reads this file.
3. Resume Course Creator work on `feature/course-creator-20261030`.

## Done

- Telegram paired, owner-only allowlist, two-way test passed (2026-11-03).
