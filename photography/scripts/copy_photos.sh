#!/usr/bin/env bash
# Optional convenience: copy photos into the right folder from the terminal.
# You can always just drag files into the folder in Finder instead — this
# script is only here if you prefer the command line.
#
# Examples:
#   ./scripts/copy_photos.sh sports football ~/Downloads/Football/*.jpg
#   ./scripts/copy_photos.sh sports basketball ~/Downloads/Hoops/*.jpg
#   ./scripts/copy_photos.sh wildlife ~/Downloads/Birds/*.jpg
#
# Then run: python3 scripts/sync_photos.py

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

usage() {
  echo "Usage:"
  echo "  $0 sports <category-name> <files...>"
  echo "  $0 wildlife <files...>"
  exit 1
}

[[ $# -ge 2 ]] || usage

copy_files() {
  local dest="$1"
  shift
  mkdir -p "$dest"
  for src in "$@"; do
    [[ -f "$src" ]] || continue
    ext="${src##*.}"
    ext_lower="$(echo "$ext" | tr '[:upper:]' '[:lower:]')"
    case "$ext_lower" in
      jpg|jpeg|png|webp) ;;
      *) echo "Skipping non-image: $src"; continue ;;
    esac
    cp "$src" "$dest/"
    echo "  -> $dest/$(basename "$src")"
  done
}

kind="$1"
shift

case "$kind" in
  sports)
    [[ $# -ge 2 ]] || usage
    category="$1"
    shift
    copy_files "photos/sports/$category" "$@"
    ;;
  wildlife)
    copy_files "photos/wildlife" "$@"
    ;;
  *)
    usage
    ;;
esac

echo "Done. Now run: python3 scripts/sync_photos.py"
