#!/usr/bin/env python3
"""Validate pi-agent-control-extension package structure."""

import json
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_SKILLS = {
    "agent-browser",
    "background-pty",
    "capture",
    "compose",
    "control-narrate",
    "init",
    "meta-control",
    "network-audit",
    "pty-capture",
    "ralph",
    "review",
    "session-navigation",
    "showcase",
    "true-input",
    "tuistory",
    "verify",
    "wiki",
}
REQUIRED_FILES = [
    "package.json",
    "packages/extension/index.ts",
    "packages/extension/routing.ts",
    "packages/extension/guards.ts",
    "packages/extension/recipes.ts",
    "packages/extension/schema.ts",
    "scripts/validate-package.py",
    "bin/tctl",
    "scripts/render-showcase.sh",
    "apps/remotion/package.json",
    "README.md",
]


def check(msg: str, ok: bool) -> None:
    print(f"  {'[OK]' if ok else '[FAIL]'} {msg}")
    if not ok:
        errors.append(msg)


errors: list[str] = []
print(f"Validating {ROOT.name}...")

for rel in REQUIRED_FILES:
    check(f"Required file: {rel}", (ROOT / rel).exists())

pkg = json.loads((ROOT / "package.json").read_text())
pi_manifest = pkg.get("pi", {})
check("Pi manifest: extensions entry", "./packages/extension/index.ts" in pi_manifest.get("extensions", []))
check("Pi manifest: skills entry", "./packages/skills" in pi_manifest.get("skills", []))
check("Keyword: pi-extension", "pi-extension" in pkg.get("keywords", []))

base = ROOT / "packages" / "skills"
found = {p.parent.name for p in base.glob("*/SKILL.md")}
missing = EXPECTED_SKILLS - found
check(f"All {len(EXPECTED_SKILLS)} skills present", not missing)
if missing:
    print(f"       Missing: {', '.join(sorted(missing))}")

check("README exists", (ROOT / "README.md").exists())
check("Demo GIF exists", (ROOT / "artifacts" / "demo" / "demo.gif").exists())

BINARIES = {
    "python3": "sudo apt-get install -y python3",
    "ruff": "pip install ruff",
    "tuistory": "npm install -g tuistory",
    "asciinema": "pip install asciinema",
    "ffmpeg": "sudo apt-get install -y ffmpeg",
    "cage": "sudo apt-get install -y cage",
    "wtype": "sudo apt-get install -y wtype",
}

print("\nChecking system dependencies...")
bin_errors = []
for cmd, install in BINARIES.items():
    path = shutil.which(cmd)
    if path:
        print(f"  [OK] Binary: {cmd}")
    else:
        print(f"  [WARN] Binary: {cmd} (optional — to fix: {install})")
        bin_errors.append(cmd)

# Only treat missing binaries as fatal when NOT in CI (dev machines should have them)
if bin_errors and not os.environ.get("CI"):
    errors.extend(f"Binary: {cmd}" for cmd in bin_errors)

if errors:
    print(f"\n[FAIL] {len(errors)} check(s) failed")
else:
    print(
        f"\n[OK] {pkg['name']} {pkg['version']}: clean package with {len(EXPECTED_SKILLS)} skills + extension + demo"
    )
