#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"

BIN_SRC="$SCRIPT_DIR/filet"
BIN_DIR="$HOME/.local/bin"
BIN_DEST="$BIN_DIR/filet"
APPS_DIR="$DATA_HOME/applications"
DESKTOP_DEST="$APPS_DIR/filet.desktop"
ICON_SRC="$SCRIPT_DIR/icon.png"
ICON_DIR="$DATA_HOME/filet"
ICON_DEST="$ICON_DIR/icon.png"

if [[ "$(uname -s)" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  echo "error: filet is only built for x86_64 Linux (detected $(uname -s) $(uname -m))." >&2
  exit 1
fi

if [[ ! -f "$BIN_SRC" ]]; then
  echo "error: $BIN_SRC not found. Run 'bun run build' if building from source, or re-extract the release archive." >&2
  exit 1
fi

mkdir -p "$BIN_DIR" "$APPS_DIR" "$ICON_DIR"

# Install via a temp file and an atomic rename so upgrading works while filet is running.
BIN_TMP="$(mktemp "$BIN_DIR/.filet.XXXXXX")"
trap 'rm -f "$BIN_TMP"' EXIT

cp "$BIN_SRC" "$BIN_TMP"
chmod +x "$BIN_TMP"
mv -f "$BIN_TMP" "$BIN_DEST"

if [[ -f "$ICON_SRC" ]]; then
  cp "$ICON_SRC" "$ICON_DEST"
else
  echo "warning: $ICON_SRC not found, the launcher may have no icon." >&2
fi

# Desktop entry values: quote Exec and escape '%' so paths are not read as field codes.
EXEC_PATH="${BIN_DEST//%/%%}"

{
  echo "[Desktop Entry]"
  echo "Type=Application"
  echo "Name=Filet"
  echo "Comment=Terminal file explorer"
  echo "Exec=\"$EXEC_PATH\""
  if [[ -f "$ICON_DEST" ]]; then
    echo "Icon=$ICON_DEST"
  fi
  echo "Terminal=true"
  echo "Categories=Utility;FileManager;"
} > "$DESKTOP_DEST"

chmod +x "$DESKTOP_DEST"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPS_DIR" || echo "warning: update-desktop-database failed, the launcher may take a while to appear." >&2
fi

echo "Installed $BIN_DEST and $DESKTOP_DEST"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) echo "warning: $BIN_DIR is not on your PATH. Add it to your shell profile to run 'filet' directly." ;;
esac
