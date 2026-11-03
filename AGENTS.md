# VENTRA Development Rules

Shared by Claude Code and Codex.

- Work on VENTRA only. SETORA is paused.
- This checkout has exactly ONE code-writing agent at a time.
- Do not reuse protected OpenClaw or Codex sessions. Do not read or use the untracked OpenClaw leftovers (`SOUL.md`, `IDENTITY.md`, `USER.md`, `DREAMS.md`, `memory/`).
- Do not spawn other coding agents.
- `VENTRA-CLEAN` (`main`) is protected: never edit, commit, merge or reset it. Other `VENTRA-*` folders are read-only references.
- Preserve every existing VENTRA feature and integration.
- Apply the approved V5 subtle teal glass UI.
- `apps/web` uses a Next.js with breaking changes: read `apps/web/node_modules/next/dist/docs/` before coding.
- Every feature needs an isolated test page (`apps/web/app/tools/<feature>/`) using real production logic.
- Run lint, typecheck, tests and build before reporting success. Report evidence (command + result), not descriptions.
- Never expose, commit or print credentials. Never read `.env*` files.
- Never deploy, delete, spend money, publish, force-push or push to a protected branch without owner approval. Commit and push only with `ventra-git` (never raw `git commit` or `git push`); production-class actions go through `ventra-approval request` and `ventra-approval run` (see `docs/agents/AUTOMATION_POLICY.md`).
- Codex is not covered by Claude Code's hooks, so these rules are your own responsibility: never push to `main`, never force, never touch the guard, policy or settings.
- Record real blockers once instead of repeating confirmation loops.

## Handoff between Claude and Codex

Full procedure: `docs/agents/CODEX_HANDOFF.md`.

- Only the lock holder edits. `ventra-claude` / `ventra-codex` take the lock; `ventra-handoff status` shows it. Stop if it is held.
- Read `HANDOFF.md` and run `git status` before starting. Continue only the approved task from the saved Git state.
- Before stopping: update `HANDOFF.md` (changed files, tests, blockers, next steps) and run `ventra-handoff snapshot`. The lock is released when the session exits.
- Stuck lock: `ventra-handoff recover`. Never force a lock whose session is still working.

Team structure and quality gates: `docs/agents/ARCHITECTURE.md`, `docs/agents/WORKFLOWS.md`. Task register: `docs/agents/TASKS.md`.
