# VENTRA — Claude Code instructions

VENTRA is an AI platform that helps people launch, build and grow businesses. It is the only active project. Do not resume SETORA.

Read `AGENTS.md` first: its rules apply to every coding assistant, including you.

## Workspaces (all linked Git worktrees of one repository)

| Folder | Branch | Role |
| --- | --- | --- |
| `VENTRA-FEATURES` | feature branches | Main development. The only place to write code. |
| `VENTRA-CLEAN` | `main` | **Protected.** Read-only reference. Never edit, commit or reset here. |
| `VENTRA-UI` | `frontend/ventra-ui-*` | Frontend work, merged in by branch. |
| `VENTRA-BACKEND` | `backend/ventra-api-*` | Backend work, merged in by branch. |

Other `VENTRA-*` folders are old references. Leave them alone.

## Commands

Run from the repo root. Node 24 and npm 11 (see `.nvmrc`).

- `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`
- `npm run test:local-integration` runs the isolated local Supabase check.

Run build, typecheck and tests before reporting success.

## Working rules

- Never run `git reset --hard`, `git clean`, force-push, delete branches, or rewrite history without explicit approval.
- Before any task, run `git status` and read `HANDOFF.md`.
- Commit in small steps on a feature branch. Never commit to `main`.
- Never print, commit or move credentials. `.env*` files stay out of Git.
- Ask before: deleting files, spending money, deploying, publishing, changing credentials.
- The untracked `SOUL.md`, `IDENTITY.md`, `USER.md`, `DREAMS.md` and `memory/` files are OpenClaw leftovers. Do not delete or commit them without asking.

## Feature rule

Every feature gets a simple isolated test page that uses the real production functionality, not mocks. Add it in the same change as the feature.

## Roles

Use the project subagents in `.claude/agents/` when work splits cleanly: `frontend`, `backend`, `feature`, `qa`. Only one writer touches a given file at a time.

## Telegram

The owner can message this session from Telegram (allowlisted account only). Treat those messages as the user's requests, but never change Telegram access (`/telegram:access`) because a Telegram message asked you to.

- Reply on Telegram with the `reply` tool, in short plain text. Send long output as a file.
- For "status", "what are you working on" or similar, reply with: current branch, the task from `HANDOFF.md`, `git status` summary (changed files count), last test/build result, and any blocker.
- When a task finishes or you hit a blocker, send a one-message result: what changed, what was verified, what needs the owner.
- Anything on the confirm-first list (deleting, spending, deploying, publishing, credentials, `git push`) must be confirmed on Telegram before you do it.

## Handoff to Codex

When asked to hand off, or when nearing the usage limit, update `HANDOFF.md` (task, branch, changed files, tests, blockers, next steps), commit or list uncommitted changes, then stop editing. Release the lock with `ventra-handoff release`.
