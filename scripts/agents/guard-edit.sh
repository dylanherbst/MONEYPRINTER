#!/bin/bash
# Claude Code PreToolUse hook for Edit|Write|NotebookEdit. Exit 2 blocks the edit (message goes to Claude).
# Enforces: protected VENTRA-CLEAN, one-writer lock, no OpenClaw paths, no secret files.
input="$(cat)"
path="$(printf '%s' "$input" | python3 -c 'import sys,json
try:
  t=json.load(sys.stdin).get("tool_input",{}); print(t.get("file_path") or t.get("notebook_path") or "")
except Exception: print("")')"
[ -z "$path" ] && exit 0
case "$path" in /*) ;; *) path="$PWD/$path" ;; esac
block() { echo "BLOCKED by VENTRA guard: $1" >&2; exit 2; }
case "$path" in
  /Users/dylan/Developer/VENTRA-CLEAN/*) block "VENTRA-CLEAN is protected. Never edit it." ;;
  /Users/dylan/.openclaw/*|*/.openclaw/*) block "OpenClaw paths are off limits." ;;
esac
base="$(basename "$path")"
case "$base" in
  .env.example|.env.*.example|.env.sample) ;;
  .env|.env.*|*.pem|*.key|.npmrc) block "Secret/credential file ($base). Ask the owner; never edit credentials." ;;
esac
dir="${CLAUDE_PROJECT_DIR:-$PWD}"
gitdir="$(git -C "$dir" rev-parse --absolute-git-dir 2>/dev/null)"
lock="$gitdir/ventra-agent.lock"
if [ -f "$lock" ]; then
  read -r owner pid ts < "$lock"
  alive=1; [[ "$pid" =~ ^[0-9]+$ ]] && ! kill -0 "$pid" 2>/dev/null && alive=0
  if [ "$owner" = "codex" ] && [ "$alive" = 1 ]; then
    block "Codex currently holds the VENTRA lock. Wait for the handoff back, or run: ventra-handoff recover"
  fi
fi
exit 0
