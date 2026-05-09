# Skill Mapping

This package preserves every original skill folder as an active runtime-specific skill.

| Original skill | Pi Agent CLI Control skill | Status |
|---|---|---|
| `agent-browser` | `agent-browser` | active skill in every runtime-specific skill path |
| `capture` | `capture` | active skill in every runtime-specific skill path |
| `compose` | `compose` | active skill in every runtime-specific skill path |
| `droid-cli` | `pi-agent-cli` | active skill in every runtime-specific skill path |
| `droid-control` | `pi-agent-control` | active skill in every runtime-specific skill path |
| `pty-capture` | `pty-capture` | active skill in every runtime-specific skill path |
| `showcase` | `showcase` | active skill in every runtime-specific skill path |
| `true-input` | `true-input` | active skill in every runtime-specific skill path |
| `tuistory` | `tuistory` | active skill in every runtime-specific skill path |
| `verify` | `verify` | active skill in every runtime-specific skill path |

Original unmodified source skills are copied to `original-skills/` for auditability and diff review. Active converted skills live in: `.agents/skills`, `.pi/skills`, `skills`.


## v4 Pi extension mapping

The Pi package now maps original skills into `skills/` while `extensions/pi-control/` owns runtime behavior. `droid-control` maps to `pi-agent-control`; `droid-cli` maps to `pi-agent-cli`; other atoms keep their original names.
