#!/usr/bin/env bash
# Copy photos into the right images folder with numbered names.
#
# Examples:
#   ./scripts/copy_photos.sh automotive ~/Downloads/car-shoot/*.jpg
#   ./scripts/copy_photos.sh meet greenville-march-2024 ~/Pictures/meet/*.jpg
#   ./scripts/copy_photos.sh car mike-gt350 ~/Pictures/gt350/*.jpg
#
# Then run: python3 scripts/sync_photos.py

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

usage() {
  echo "Usage:"
  echo "  $0 automotive <files...>"
  echo "  $0 astronomy <files...>"
  echo "  $0 meet <folder-name> <files...>"
  echo "  $0 car <folder-name> <files...>"
  exit 1
}

[[ $# -ge 2 ]] || usage

kind="$1"
shift

copy_numbered() {
  local dest="$1"
  mkdir -p "$dest"
  local i=1
  for src in "$@"; do
    [[ -f "$src" ]] || continue
    ext="${src##*.}"
    ext_lower="$(echo "$ext" | tr '[:upper:]' '[:lower:]')"
    case "$ext_lower" in
      jpg|jpeg|png|webp) ;;
      *) echo "Skipping non-image: $src"; continue ;;
    esac
    cp "$src" "$dest/$(printf '%02d.%s' "$i" "$ext_lower")"
    echo "  -> $dest/$(printf '%02d.%s' "$i" "$ext_lower")"
    i=$((i + 1))
  done
}

case "$kind" in
  automotive)
    copy_numbered "images/automotive" "$@"
    ;;
  astronomy)
    copy_numbered "images/astronomy" "$@"
    ;;
  meet)
    [[ $# -ge 2 ]] || usage
    folder="$1"
    shift
    copy_numbered "images/car-meets/$folder" "$@"
    ;;
  car)
    [[ $# -ge 2 ]] || usage
    folder="$1"
    shift
    copy_numbered "images/clients/$folder" "$@"
    ;;
  hero)
    [[ -f "$1" ]] || usage
    cp "$1" images/hero.jpg
    echo "  -> images/hero.jpg"
    ;;
  portrait)
    [[ -f "$1" ]] || usage
    mkdir -p images/about
    cp "$1" images/about/portrait.jpg
    echo "  -> images/about/portrait.jpg"
    ;;
  *)
    usage
    ;;
esac

echo "Done. Run: python3 scripts/sync_photos.py"
