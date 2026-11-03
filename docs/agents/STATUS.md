# VENTRA agent system: verified status

Checked 2026-11-03 on this Mac. "Verified" means I ran a real check this session and saw the result. Re-check before relying on anything that may have changed (processes, logins, limits).

## Verified working

| Item | Evidence |
| --- | --- |
| Claude Code 2.1.317 | `claude --version` |
| 6 specialist agents load | headless Claude run listed `ventra-backend, -feature, -frontend, -qa, -research, -setup` |
| 7 workflow skills | `ventra-bug-fix, -connections, -daily-overview, -feature-acceptance, -new-feature, -ui-design`, then `-codex-handoff` after a fix (it was wrongly hidden from Claude) |
| Research delegation | `ventra-research` subagent really ran read-only and returned file-level findings |
| Feature → QA workflow | `ventra-feature` created a temp file, `ventra-qa` independently verified content and `git status`, I re-checked it by hand, then deleted only that file |
| Edit guard hook | live headless run: Write to an `.env.*` file was blocked with the guard message; no file created. Script test also blocks `VENTRA-CLEAN`, `.openclaw`, and edits while Codex holds the lock |
| Lock logic | temp-repo tests: dead-pid lock reclaimed, live lock blocks other agent, `recover` safe on live lock |
| Repository intact | all 6 branch tips unchanged except the new chore branch; no diff in `apps/`, `supabase/`; `VENTRA-CLEAN`, `VENTRA-UI`, `VENTRA-BACKEND` have no changes |
| Telegram access | owner-only `allowlist` (1 user), no pending codes, token file mode 600; two-way message test passed earlier (owner confirmed a reply) |
| Agent Teams | off (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` unset) |
| Codex CLI | 0.166.0, `codex login status`: Logged in using ChatGPT |
| GitHub CLI | logged in as `dylanherbst`; the repo has no remote |

## Not working or not verified

| Item | Status |
| --- | --- |
| Codex inspecting VENTRA-FEATURES | BLOCKED: ChatGPT usage limit until 2026-11-04 14:48. Retest with `ventra-codex` |
| Codex handoff end to end | Not demonstrated yet (commands and lock tested; Codex run blocked by the limit) |
| Telegram after the Stage 2 fix | Poller process was restarted and seen running; a fresh end-to-end message test is still needed |
| Mac permissions (Accessibility, Screen Recording) and app/browser interaction | Not verified; needs the owner's macOS permission dialogs |
| `NEW SIMPLE VENTRA BUILD.pdf` | NOT FOUND on this Mac. Other VENTRA PDFs in Downloads are older and were not used as the blueprint |
| Supabase, AI provider and other app integrations | Not checked (`.env*` files are deliberately not read). Status: unknown |
| Telegram bot token | Owner action: it was pasted into chat; rotate via @BotFather `/revoke` then `ventra-telegram-token` |

## Known risks

- **One Telegram poller only.** A second plugin server for the same bot kills the first. The plugin is therefore disabled globally and enabled only by `ventra-claude`. Do not run extra `claude --channels` sessions; close old ones.
- **Context bloat.** `~/.claude/agents` holds 282 old agent files (outside this repo), causing the "agent descriptions over 15k tokens" warning in every session. Owner decision pending: move them to a backup folder.
- The edit hook covers Edit/Write/NotebookEdit, not arbitrary shell commands (those use normal permission prompts).
- Stage 2 files live on `chore/agent-setup-handoff` and are not in the other branches until merged (owner decision).
- Untracked OpenClaw leftovers remain in `VENTRA-FEATURES` (`SOUL.md`, `IDENTITY.md`, `USER.md`, `DREAMS.md`, `memory/`); `~/.openclaw` exists and was not touched.
