# Unique Feature Candidate 01: Native Skill Atom Lifecycle Governance

**Status**: Draft — Iteration 2+ of Ralph Loop ("10 door" continuation)  
**Seeded from**: Original Ralph plan (advanced tooling around the 15+ atomized skills)  
**Evidence captured**: Live run of `./bin/pi-agent-control skills list --json` (70 skills visible, shadow/merge awareness, full CLI surface)

---

## 1. The Problem (Why this is painful elsewhere)

Most agent frameworks treat skills/prompts/tools as flat files or opaque vectors in a RAG store. 

When a user (or another agent) overrides or customizes a skill:
- There is usually **no visibility** into what was changed.
- No structured way to **diff** user version vs upstream.
- No safe **3-way merge** process.
- No concept of "shadowed" state (user version takes precedence but the original is still tracked).
- Governance (enable/disable, validate, audit) is either manual or non-existent.

Result: Skill sprawl, silent breakage when upstream skills improve, and no audit trail for what an agent is actually using.

---

## 2. How Pi Agent Control Does It (The Mechanism)

The extension exposes a **first-class native CLI** (`pi-agent-control skills ...`) with deep lifecycle operations:

- `list [--json] [--source pi|user]` — Full inventory with `shadowState`, `valid`, `enabled`, mtime, source.
- `view <name>` — Beautifully rendered view of any skill.
- `validate [<name>]` — Structural + frontmatter audits.
- `diff <name>` — Side-by-side user vs PI version.
- `merge <name>` — Real 3-way merge (with `--pi`, `--user`, `--manual` resolution).
- `enable` / `disable` — Runtime control.
- Integrated with the **Skill Studio TUI** (Ink/React) for visual inspection and merge flows.

The system tracks:
- Which PI skills are **shadowed** by user versions (currently agent-browser and tuistory in this environment).
- Separate `sourceDir` (pi vs global ~/.agents vs .claude).
- Validation status on every skill.

This is wired directly into the extension binary and the `pi-agent-control` skill itself.

---

## 3. Uniqueness & Defensibility

- **Native binary surface** — Not a library or web UI. A real CLI that agents (and humans) can drive programmatically (`--json` output).
- **Shadow + Merge as first-class concept** — Most systems either copy skills or lose the link to upstream. Here the original is preserved and mergeable.
- **Deep integration with capture/verify** — Skill changes can be part of reproducible runs with evidence.
- **Combined with the 17-atom strict validator** — You can't ship a broken or incomplete skill set.

Very hard for browser-use, generic CUA frameworks, or simple prompt directories to replicate without building an entire governance layer + TUI + merge engine + CLI.

---

## 4. Delta vs External Contract Map (v5.1.4)

- **Does not touch** the 8 sacred guard blocks in `guards.ts`.
- **Does not require** changes to `validate-package.py` REQUIRED_FILES or the core 17 EXPECTED_SKILLS (this is an enhancement of the existing skill governance surface).
- **Leverages** existing `skill-merge.ts`, the studio/ Ink app, and the `pi-agent-control` skill.
- **New surface** would be additional subcommands or richer JSON (low risk).
- **Evidence impact**: Every merge/diff/validate action can be captured via the existing capture + verify pipeline.

**Attack surface delta**: Minimal. The CLI is read-heavy for governance; writes go through the same safe merge paths already used by the TUI.

---

## 5. Evidence & Guardrail Amplification

- Makes skill usage **auditable** at the same level as terminal/browser actions (run.json + verification.md can record which skills were enabled/shadowed during a task).
- The `verify` skill can be extended to check "all used skills were valid and not silently shadowed in unexpected ways".
- Strong alignment with the security-audit branch (knowing exactly what decision-making atoms an agent is running).

---

## 6. Agent Leverage

An agent can now do things like:
- "List all shadowed skills and propose merges"
- "Validate the entire catalog before starting a big task"
- "Diff my local version of tuistory against the PI one and decide whether to merge"
- Programmatically drive the full governance loop via the JSON CLI

This turns "skills" from passive files into a managed, versioned, mergeable asset class.

---

## 7. Suggested Name & Positioning

**"Skill Forge"** or **"Native Skill Lifecycle CLI"**

One of the strongest "table stakes in 5 years, almost nobody has it today" features in the current codebase.

---

## 8. Next Steps (for this candidate)

- [ ] Compare against real competitor behavior (how does browser-use or Cursor handle skill overrides today?)
- [ ] Measure how much of the current `skill-merge.ts` + studio code can be reused vs new CLI surface needed
- [ ] Write the one-pager for the other 3 candidates and force-rank

---

*Generated during Ralph Loop Iteration (prompt: "10 door") — continuing execution of the approved v2 plan.*