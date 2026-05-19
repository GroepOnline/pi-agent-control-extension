#!/usr/bin/env bash
set -euo pipefail

echo "==> Hardening Pi Agent Control Extension dependencies..."

# Ensure binaries are executable
chmod +x bin/tctl
chmod +x scripts/*.sh 2>/dev/null || true

# Function to check for a command and show install instruction
check_dep() {
    local cmd=$1
    local install_msg=$2
    if command -v "$cmd" >/dev/null 2>&1; then
        echo "  [OK] $cmd"
    else
        echo "  [MISSING] $cmd"
        echo "    To install: $install_msg"
        MISSING_DEPS=1
    fi
}

MISSING_DEPS=0

echo "Checking system dependencies..."
check_dep "python3" "sudo apt-get install -y python3"
check_dep "ruff" "pip install ruff"
check_dep "tuistory" "npm install -g tuistory"
check_dep "asciinema" "pip install asciinema"
check_dep "ffmpeg" "sudo apt-get install -y ffmpeg"
check_dep "cage" "sudo apt-get install -y cage"
check_dep "wtype" "sudo apt-get install -y wtype"

# Optional tools
check_dep "grim" "sudo apt-get install -y grim"
check_dep "wf-recorder" "sudo apt-get install -y wf-recorder"
check_dep "agg" "cargo install --git https://github.com/asciinema/agg"

if [ $MISSING_DEPS -ne 0 ]; then
    echo ""
    echo "WARNING: Some dependencies are missing. The extension may fail to run certain tools."
    echo "Please install the missing tools listed above."
fi

echo "==> Dependency check complete."
