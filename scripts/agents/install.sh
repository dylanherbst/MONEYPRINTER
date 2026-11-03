#!/bin/bash
# Install VENTRA helper commands into ~/.local/bin (real copies, so they survive branch switches).
set -e
d="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.local/bin"
for f in ventra-handoff ventra-claude ventra-codex; do install -m 755 "$d/$f" "$HOME/.local/bin/$f"; done
echo "Installed: ventra-handoff ventra-claude ventra-codex -> ~/.local/bin"
