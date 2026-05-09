#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "agent-browser", "capture", "compose", "pi-agent-cli", "pi-agent-control",
    "pty-capture", "showcase", "true-input", "tuistory", "verify"
}
ORIGINAL_EXPECTED = {
    "agent-browser", "capture", "compose", "droid-cli", "droid-control",
    "pty-capture", "showcase", "true-input", "tuistory", "verify"
}
REQUIRED_FILES = [
    "AGENTS.md",
    "package.json",
    "extensions/pi-control/index.ts",
    "extensions/pi-control/routing.ts",
    "extensions/pi-control/guards.ts",
    "extensions/pi-control/recipes.ts",
    "extensions/pi-control/schema.ts",
    ".pi/extensions/pi-control/index.ts",
    "prompts/demo.md",
    "prompts/verify.md",
    "prompts/qa-test.md",
    "docs/PI-EXTENSION-DESIGN.md",
]

def fail(msg: str):
    raise SystemExit(f"[FAIL] {msg}")

for rel in REQUIRED_FILES:
    if not (ROOT / rel).exists():
        fail(f"missing {rel}")

pkg = json.loads((ROOT / "package.json").read_text())
pi = pkg.get("pi", {})
if "./extensions/pi-control/index.ts" not in pi.get("extensions", []):
    fail("package.json pi.extensions does not include ./extensions/pi-control/index.ts")
if "./skills" not in pi.get("skills", []):
    fail("package.json pi.skills does not include ./skills")
if "./prompts" not in pi.get("prompts", []):
    fail("package.json pi.prompts does not include ./prompts")
if "pi-package" not in pkg.get("keywords", []):
    fail("package.json missing pi-package keyword")

for root in ["skills", ".agents/skills"]:
    base = ROOT / root
    found = {p.parent.name for p in base.glob("*/SKILL.md")}
    missing = EXPECTED - found
    if missing:
        fail(f"{root} missing skills: {', '.join(sorted(missing))}")

base = ROOT / "original-skills"
found = {p.parent.name for p in base.glob("*/SKILL.md")}
missing = ORIGINAL_EXPECTED - found
if missing:
    fail(f"original-skills missing skills: {', '.join(sorted(missing))}")

# Check renamed Pi skill atoms actually exist.
for name in ["pi-agent-cli", "pi-agent-control"]:
    if not (ROOT / "skills" / name / "SKILL.md").exists():
        fail(f"missing converted Pi skill {name}")

print(f"[OK] {pkg['name']} {pkg['version']}: extension-first Pi package")
print("[OK] extensions: ./extensions/pi-control/index.ts")
print("[OK] skills: 10 active + 10 .agents mirror + 10 original audit copies")
print("[OK] prompts: demo, verify, qa-test")
