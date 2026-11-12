#!/bin/sh
# Wrapper for xdg-desktop-portal-termfilechooser.
# Arguments: multiple directory save path out debug [terminal command...]

if [ "$#" -lt 6 ]; then
  echo "usage: filet-wrapper.sh multiple directory save path out debug [terminal command...]" >&2
  exit 1
fi

multiple="$1"
directory="$2"
save="$3"
path="$4"
out="$5"
debug="$6"

shift 6

if [ "$debug" = 1 ]; then
  set -x
fi

if [ "$#" -eq 0 ]; then
  set -- ${TERMINAL:-xdg-terminal-exec}
fi

filet="$(command -v filet || echo "$HOME/.local/bin/filet")"

set -- "$@" "$filet" --chooser-file "$out"

if [ "$multiple" = 1 ]; then
  set -- "$@" --multiple
fi

if [ "$directory" = 1 ]; then
  set -- "$@" --directory
fi

if [ "$save" = 1 ]; then
  set -- "$@" --save
fi

if [ -n "$path" ]; then
  set -- "$@" -- "$path"
fi

exec "$@"
