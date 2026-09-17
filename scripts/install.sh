#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_SRC="$SCRIPT_DIR/filet"
BIN_DIR="$HOME/.local/bin"
BIN_DEST="$BIN_DIR/filet"
APPS_DIR="$HOME/.local/share/applications"
DESKTOP_DEST="$APPS_DIR/filet.desktop"
ICON_SRC="$SCRIPT_DIR/icon.png"
ICON_DIR="$HOME/.local/share/filet"
ICON_DEST="$ICON_DIR/icon.png"

if [[ ! -f "$BIN_SRC" ]]; then
  echo "error: $BIN_SRC not found. Run 'bun run build' first." >&2
  exit 1
fi

mkdir -p "$BIN_DIR" "$APPS_DIR" "$ICON_DIR"

cp "$BIN_SRC" "$BIN_DEST"
chmod +x "$BIN_DEST"

if [[ -f "$ICON_SRC" ]]; then
  cp "$ICON_SRC" "$ICON_DEST"
fi

cat > "$DESKTOP_DEST" <<EOF
[Desktop Entry]
Type=Application
Name=Filet
Comment=Terminal file explorer
Exec=$BIN_DEST
Icon=$ICON_DEST
Terminal=true
Categories=Utility;FileManager;
EOF

chmod +x "$DESKTOP_DEST"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPS_DIR"
fi

echo "Installed $BIN_DEST and $DESKTOP_DEST"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) echo "warning: $BIN_DIR is not on your PATH. Add it to your shell profile to run 'filet' directly." ;;
esac
