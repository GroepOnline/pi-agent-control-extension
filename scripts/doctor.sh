#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "== Pi Agent CLI Control doctor =="
command -v python3 >/dev/null && python3 --version || true
command -v node >/dev/null && node --version || true
command -v ffmpeg >/dev/null && ffmpeg -version 2>/dev/null | head -n 1 || true
command -v ffprobe >/dev/null && ffprobe -version 2>/dev/null | head -n 1 || true
command -v pi >/dev/null && pi --version || true
python3 scripts/validate-package.py
