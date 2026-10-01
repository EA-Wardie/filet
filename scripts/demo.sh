#!/usr/bin/env bash
# Runs filet in a bubblewrap sandbox with a fake /home/demo home directory,
# so screenshots don't show your username, files or config.
# Usage: scripts/demo.sh [dark|light|blue|purple]
set -euo pipefail

SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_PATH")")"
BUN_PATH="$(readlink -f "$(command -v bun)")"
THEME="${1:-dark}"

case "$THEME" in
  dark) BG="#0C0C0C" FG="#fafafa" BORDER="#d4d4d4" ;;
  light) BG="#e5e5e5" FG="#0a0a0a" BORDER="#262626" ;;
  blue) BG="#075985" FG="#f0f9ff" BORDER="#d4d4d4" ;;
  purple) BG="#701a75" FG="#fdf4ff" BORDER="#d4d4d4" ;;
  *)
    echo "error: unknown theme '$THEME' (expected dark, light, blue or purple)." >&2
    exit 1
    ;;
esac

if ! command -v bwrap >/dev/null; then
  echo "error: bwrap (bubblewrap) is required." >&2
  exit 1
fi

DEMO_HOME="$(mktemp -d)"
trap 'rm -rf "$DEMO_HOME"' EXIT

mkdir -p \
  "$DEMO_HOME"/{Documents,Downloads,Music,Videos} \
  "$DEMO_HOME"/Pictures/{Development,Personal,Screenshots,Wallpapers} \
  "$DEMO_HOME"/Projects/{filet,website} \
  "$DEMO_HOME"/.config/filet

printf '# Notes\n\n- Buy groceries\n- Fix the bike\n' >"$DEMO_HOME/Documents/notes.md"
printf 'name,amount\nrent,1200\nfood,400\n' >"$DEMO_HOME/Documents/budget.csv"

cat >"$DEMO_HOME/.config/filet/config.toml" <<EOF
bookmarks = [
    {label = "Projects", mount = "/home/demo/Projects"},
]

[theme]
bg = "$BG"
fg = "$FG"
border = "$BORDER"
success = "#16a34a"
danger = "#dc2626"
EOF

# /home is replaced with an empty tmpfs, so the real home directory is hidden.
bwrap --dev-bind / / --tmpfs /home \
  --ro-bind "$BUN_PATH" /home/.filet/bun \
  --ro-bind "$PROJECT_DIR" /home/.filet/app \
  --bind "$DEMO_HOME" /home/demo \
  --setenv HOME /home/demo --setenv USER demo --setenv LOGNAME demo \
  --chdir /home/demo \
  /home/.filet/bun /home/.filet/app/src/main.ts
