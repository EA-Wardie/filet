#!/usr/bin/env bash
# Runs filet in a bubblewrap sandbox with a fake /home/demo home directory,
# so screenshots don't show your username, files or config.
# Usage: scripts/demo.sh [dark|ivory|sky|fuchsia]
set -euo pipefail

SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_PATH")")"
THEME="${1:-dark}"

if ! command -v bun >/dev/null; then
  echo "error: bun is required." >&2
  exit 1
fi

BUN_PATH="$(readlink -f "$(command -v bun)")"

if [[ "$(head -c 4 "$BUN_PATH")" != $'\x7fELF' ]]; then
  echo "error: $BUN_PATH is not the bun binary (a version manager shim?). Set PATH so bun resolves to the real binary." >&2
  exit 1
fi

case "$THEME" in
  dark) BG="#0C0C0C" FG="#fafafa" BORDER="#d4d4d4" ACCENT="#0369a1" ;;
  ivory) BG="#e5e5e5" FG="#0a0a0a" BORDER="#262626" ACCENT="#0369a1" ;;
  sky) BG="#075985" FG="#f0f9ff" BORDER="#d4d4d4" ACCENT="#ec4899" ;;
  fuchsia) BG="#701a75" FG="#fdf4ff" BORDER="#d4d4d4" ACCENT="#0369a1" ;;
  *)
    echo "error: unknown theme '$THEME' (expected dark, ivory, sky or fuchsia)." >&2
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
accent = "$ACCENT"
EOF

# /home is replaced with an empty tmpfs, so the real home directory is hidden.
bwrap --dev-bind / / --tmpfs /home \
  --ro-bind "$BUN_PATH" /home/.filet/bun \
  --ro-bind "$PROJECT_DIR" /home/.filet/app \
  --bind "$DEMO_HOME" /home/demo \
  --setenv HOME /home/demo --setenv USER demo --setenv LOGNAME demo \
  --chdir /home/demo \
  /home/.filet/bun /home/.filet/app/src/main.ts
