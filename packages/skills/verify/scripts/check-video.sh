#!/usr/bin/env bash
# verify sidecar: run the technical video checks from the verify SKILL.md.
# Exits 0 with JSON when all hard checks pass, non-zero otherwise.
# Warnings (e.g. >5MB file) do not fail the run but are reported.
#
# Usage:
#   ./scripts/check-video.sh <video.mp4> [--type single|side-by-side|multi]
#                                          [--resolution WxH] [--quiet]
#
# Duration windows per type (below minimum = FAIL, above maximum = warn):
#   single        30-45s    side-by-side  45-75s    multi  60-120s
set -uo pipefail

TYPE="single"
RES="1920x1080"
QUIET=0
VIDEO=""

for arg in "$@"; do
  case "$arg" in
    --type) shift-next() { :; }; TYPE_PENDING=1 ;;
    --resolution) RES_PENDING=1 ;;
    --quiet) QUIET=1 ;;
    --type=*) TYPE="${arg#--type=}" ;;
    --resolution=*) RES="${arg#--resolution=}" ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *)
      if [ "${TYPE_PENDING:-0}" -eq 1 ]; then TYPE="$arg"; TYPE_PENDING=0;
      elif [ "${RES_PENDING:-0}" -eq 1 ]; then RES="$arg"; RES_PENDING=0;
      elif [ -z "$VIDEO" ]; then VIDEO="$arg";
      else echo "Unknown arg: $arg" >&2; exit 2; fi ;;
  esac
done

log() { [ "$QUIET" -eq 1 ] || echo "$@" >&2; }

if [ -z "$VIDEO" ]; then echo "Usage: check-video.sh <video.mp4> [--type ...] [--resolution ...]" >&2; exit 2; fi
if [ ! -f "$VIDEO" ]; then
  echo "{\"ok\":0,\"video\":\"$VIDEO\",\"error\":\"file not found\"}"
  log "❌ file not found: $VIDEO"
  exit 1
fi
command -v ffprobe >/dev/null 2>&1 || {
  echo "{\"ok\":0,\"video\":\"$VIDEO\",\"error\":\"ffprobe not installed\"}"
  log "❌ ffprobe not installed"
  exit 1
}

case "$TYPE" in
  single) DMIN=30; DMAX=45 ;;
  side-by-side|sidebyside) DMIN=45; DMAX=75 ;;
  multi) DMIN=60; DMAX=120 ;;
  *) echo "Unknown --type: $TYPE (single|side-by-side|multi)" >&2; exit 2 ;;
esac
EXP_W="${RES%x*}"; EXP_H="${RES#*x}"

PROBE=$(ffprobe -v quiet -print_format json -show_format -show_streams "$VIDEO" 2>/dev/null || true)
if [ -z "$PROBE" ]; then
  echo "{\"ok\":0,\"video\":\"$VIDEO\",\"error\":\"ffprobe could not read file\"}"
  log "❌ ffprobe could not read: $VIDEO"
  exit 1
fi

# ponytail: jq when present, python3 fallback (both parse the same ffprobe JSON).
if command -v jq >/dev/null 2>&1; then
  DUR=$(printf '%s' "$PROBE" | jq -r '.format.duration // "0"')
  W=$(printf '%s' "$PROBE" | jq -r '.streams[] | select(.codec_type=="video") | .width' | head -1)
  H=$(printf '%s' "$PROBE" | jq -r '.streams[] | select(.codec_type=="video") | .height' | head -1)
  PIX=$(printf '%s' "$PROBE" | jq -r '.streams[] | select(.codec_type=="video") | .pix_fmt' | head -1)
else
  read -r DUR W H PIX <<<"$(printf '%s' "$PROBE" | python3 -c '
import json,sys
p = json.load(sys.stdin)
v = next((s for s in p.get("streams", []) if s.get("codec_type") == "video"), {})
print(p.get("format", {}).get("duration", 0), v.get("width", 0), v.get("height", 0), v.get("pix_fmt", "?"))')"
fi
SIZE=$(stat -c%s "$VIDEO" 2>/dev/null || stat -f%z "$VIDEO" 2>/dev/null || echo 0)
DUR_INT=${DUR%.*}

CHECKS=()
HARD_OK=1
add() { # name pass detail
  CHECKS+=("{\"name\":\"$1\",\"pass\":$2,\"detail\":\"$3\"}")
  [ "$2" -eq 1 ] || HARD_OK=0
}
warn() { # name detail (never fails)
  CHECKS+=("{\"name\":\"$1\",\"pass\":1,\"warn\":true,\"detail\":\"$2\"}")
}

[ "$DUR_INT" -gt 0 ] && add "plays" 1 "duration ${DUR}s" || add "plays" 0 "duration ${DUR}s (must be > 0)"
[ "$W" = "$EXP_W" ] && [ "$H" = "$EXP_H" ] && add "resolution" 1 "${W}x${H}" || add "resolution" 0 "${W}x${H} (expected ${RES})"
[ "$PIX" = "yuv420p" ] && add "pixel_format" 1 "$PIX" || add "pixel_format" 0 "$PIX (expected yuv420p)"
if [ "$SIZE" -gt 26214400 ]; then
  add "size" 0 "$((SIZE / 1024 / 1024))MB (hard limit 25MB)"
elif [ "$SIZE" -gt 5242880 ]; then
  warn "size" "$((SIZE / 1024 / 1024))MB (over 5MB GitHub-embed comfort, under 25MB hard limit)"
else
  add "size" 1 "$((SIZE / 1024))KB"
fi
if [ "$DUR_INT" -lt "$DMIN" ]; then
  add "duration_window" 0 "${DUR_INT}s below ${TYPE} minimum ${DMIN}s — re-compose slower or re-capture with more steps"
elif [ "$DUR_INT" -gt "$DMAX" ]; then
  warn "duration_window" "${DUR_INT}s above ${TYPE} maximum ${DMAX}s (review for dead time)"
else
  add "duration_window" 1 "${DUR_INT}s within ${TYPE} window ${DMIN}-${DMAX}s"
fi

TS_NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
CHECKS_JSON=$(IFS=,; echo "${CHECKS[*]}")
cat <<EOF
{"ok":$HARD_OK,"video":"$VIDEO","type":"$TYPE","checked_at":"$TS_NOW","duration_s":$DUR_INT,"resolution":"${W}x${H}","size_bytes":$SIZE,"checks":[${CHECKS_JSON}]}
EOF

log ""
if [ "$HARD_OK" -eq 1 ]; then
  log "✅ video checks passed ($VIDEO)"
else
  log "❌ video checks failed ($VIDEO)"
fi
exit $((1 - HARD_OK))
