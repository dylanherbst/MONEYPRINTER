# VENTRA Development Rules

- Work on VENTRA only.
- This checkout has exactly ONE code-writing agent.
- Do not reuse protected OpenClaw or Codex sessions.
- Do not spawn other coding agents.
- The old project directories are read-only references.
- Preserve every existing VENTRA feature and integration.
- Apply the approved V5 subtle teal glass UI.
- Run builds and tests before reporting success.
- Never expose, commit or print credentials.
- Never deploy or delete projects without approval.
- Never let multiple agents write to this checkout.
- Record real blockers instead of repeating confirmation loops.

## Handoff between Claude and Codex

- Claude Code and Codex share this checkout, but only one edits at a time.
- Take the lock before editing: `ventra-handoff acquire claude` or `ventra-handoff acquire codex`. Stop if it refuses.
- Read `HANDOFF.md` before starting. Continue from the saved Git state.
- Before stopping, update `HANDOFF.md`, then run `ventra-handoff release`.
- `VENTRA-CLEAN` (main) is protected: never edit it.
- Every feature needs an isolated test page using real production functionality.
