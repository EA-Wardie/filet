#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"

BIN_SRC="$SCRIPT_DIR/filet"
BIN_DIR="$HOME/.local/bin"
BIN_DEST="$BIN_DIR/filet"
WRAPPER_SRC="$SCRIPT_DIR/filet-wrapper.sh"
WRAPPER_DEST="$BIN_DIR/filet-wrapper.sh"
APPS_DIR="$DATA_HOME/applications"
DESKTOP_DEST="$APPS_DIR/filet.desktop"
ICON_SRC="$SCRIPT_DIR/icon.png"
ICON_DIR="$DATA_HOME/filet"
ICON_DEST="$ICON_DIR/icon.png"

usage() {
  echo "usage: install.sh [--terminal <command>]"
  echo
  echo "  --terminal <command>  Open filet from the launcher with this command, such as"
  echo "                        \"kitty --app-id filet\" or \"alacritty --class filet -e\"."
  echo "                        filet's path is added after it. An empty command lets the"
  echo "                        launcher choose the terminal. The choice is kept for later"
  echo "                        installs."
}

TERMINAL_CMD=""
TERMINAL_SET=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --terminal)
      if [[ $# -lt 2 ]]; then
        echo "error: --terminal needs a command." >&2
        exit 1
      fi
      TERMINAL_CMD="$2"
      TERMINAL_SET=true
      shift 2
      ;;
    --terminal=*)
      TERMINAL_CMD="${1#*=}"
      TERMINAL_SET=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown option $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

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

if [[ -f "$WRAPPER_SRC" ]]; then
  cp "$WRAPPER_SRC" "$WRAPPER_DEST"
  chmod +x "$WRAPPER_DEST"
else
  echo "warning: $WRAPPER_SRC not found, the file chooser wrapper was not installed." >&2
fi

if [[ -f "$ICON_SRC" ]]; then
  cp "$ICON_SRC" "$ICON_DEST"
else
  echo "warning: $ICON_SRC not found, the launcher may have no icon." >&2
fi

# Reuse the terminal saved by an earlier install, or ask for one when installing interactively.
if [[ "$TERMINAL_SET" == false && -f "$DESKTOP_DEST" ]] && grep -q '^X-Filet-Terminal=' "$DESKTOP_DEST"; then
  TERMINAL_CMD="$(sed -n 's/^X-Filet-Terminal=//p' "$DESKTOP_DEST" | head -n 1)"
  TERMINAL_SET=true
fi

if [[ "$TERMINAL_SET" == false && -t 0 ]]; then
  echo "The launcher entry can open filet in a terminal of your choice, for example"
  echo "\"kitty --app-id filet\", which gives its window an app id for window rules."
  read -r -p "Terminal command (leave empty to let the launcher choose): " TERMINAL_CMD || TERMINAL_CMD=""
fi

# Desktop entry values: quote Exec and escape '%' so paths are not read as field codes.
EXEC_PATH="${BIN_DEST//%/%%}"

{
  echo "[Desktop Entry]"
  echo "Type=Application"
  echo "Name=Filet"
  echo "Comment=Terminal file explorer"
  if [[ -n "$TERMINAL_CMD" ]]; then
    echo "Exec=${TERMINAL_CMD//%/%%} \"$EXEC_PATH\" %f"
  else
    echo "Exec=\"$EXEC_PATH\" %f"
  fi
  echo "MimeType=inode/directory;"
  if [[ -f "$ICON_DEST" ]]; then
    echo "Icon=$ICON_DEST"
  fi
  if [[ -n "$TERMINAL_CMD" ]]; then
    echo "Terminal=false"
  else
    echo "Terminal=true"
  fi
  echo "X-Filet-Terminal=$TERMINAL_CMD"
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
