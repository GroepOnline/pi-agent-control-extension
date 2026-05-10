#!/usr/bin/env python3
"""Validate pi-agent-control-extension package structure."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_SKILLS = {
    "agent-browser", "capture", "compose", "pi-agent-cli", "pi-agent-control",
    "pty-capture", "showcase", "true-input", "tuistory", "verify"
}
REQUIRED_FILES = [
    "package.json",
    "extensions/pi-control/index.ts",
    "extensions/pi-control/routing.ts",
    "extensions/pi-control/guards.ts",
    "extensions/pi-control/recipes.ts",
    "extensions/pi-control/schema.ts",
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
pi = pkg.get("pi", {})
check("PI manifest: extensions", "./extensions/pi-control/index.ts" in pi.get("extensions", []))
check("PI manifest: skills", "./skills" in pi.get("skills", []))
check("Keyword: pi-package", "pi-package" in pkg.get("keywords", []))

base = ROOT / "skills"
found = {p.parent.name for p in base.glob("*/SKILL.md")}
missing = EXPECTED_SKILLS - found
check("All 10 skills present", not missing)
if missing:
    print(f"       Missing: {', '.join(sorted(missing))}")

check("README exists", (ROOT / "README.md").exists())
check("Demo GIF exists", (ROOT / "artifacts" / "demo" / "demo.gif").exists())

if errors:
    print(f"\n[FAIL] {len(errors)} check(s) failed")
else:
    print(f"\n[OK] {pkg['name']} {pkg['version']}: clean package with 10 skills + extension + demo")
