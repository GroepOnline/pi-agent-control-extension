# PR Audit Report — pi-agent-control-extension PR #26

**Auditor:** Pi agent  
**Date:** 2026-05-28  
**PR:** "v5.1.1: Remotion effects, CLI commands, Skill Studio polish"
**Branch:** `feat/v5.1.1-remotion-cli`

---

## Overview

Dit PR bundelt 3 grote features:
1. **Skill Studio TUI** — Interactive terminal dashboard (Ink/React)
2. **Remotion Showcase** — Video rendering pipeline uitbreiding
3. **CLI Commands** — Nieuwe slash commands voor Pi extension

**Tests:** 148 passing across 20 test files (volgens PR beschrijving)

---

## 1. Skill Studio TUI (`extensions/pi-control/studio/`) ✅

### Architecture

| Component | Responsibility |
|---|---|
| `app.tsx` | Main TUI app met 3-pane layout, keybindings, state management |
| `hooks/useSkillRegistry.ts` | Skill discovery, file watching, merge state |
| `hooks/useFilter.ts` | Search/filter logica |
| `panes/SkillList.tsx` | Scrollbare skill lijst met highlights |
| `panes/SkillDetail.tsx` | Detail view met diff/override/validate acties |
| `panes/ActionBar.tsx` | Toetsen legende |
| `panes/StatusBar.tsx` | Status en toast notificaties |
| `panes/EvidencePane.tsx` | Evidence items weergave |

### Security Assessment

**`useSkillRegistry.ts` — File Watching:**
- ✅ `fs.watch` op skill directories (`~/.agents/skills/`, `~/.devin/skills/`, etc.)
- ✅ `existsSync` guard op alle paden
- 🟡 **`fs.watch` resource leak:** `inotify` watchers hebben systeem limieten (~8192). Geen error handling voor `EMFILE`/`ENOSPC`. *Ook gemeld in PR #27 audit.*
- ✅ `debounceRef` (500ms) voorkomt excessive reloads

**`app.tsx` — `execFileSync` voor diff/override:**
- ✅ `doDiff()` gebruikt `execFileSync("diff", ["-u", piPath, userPath])` — geen shell injection
- ✅ `doOverride()` gebruikt `copyFileSync()` — safe
- 🟡 **Geen path traversal validatie in `doDiff()`/`doOverride()`** — vertrouwt op `skill.path` uit registry. *Ook gemeld in PR #27 audit als blocking issue #1.*

**`bin/skill-studio` — Shell wrapper:**
- ✅ `set -euo pipefail` — strict mode
- ✅ `command -v tsx` / `command -v node` checks
- ✅ Geen user input interpolatie

---

## 2. Remotion Showcase (`remotion/src/`) ✅

### New Components

| Component | Type | Risk |
|---|---|---|
| `ActiveZoom.ts` | Animation util | 🟢 None |
| `ClipPanel.tsx` | React component | 🟢 None |
| `CodeAnnotations.tsx` | React component | 🟢 None |
| `EffectLayer.tsx` | React component (zoom, shake, pulse, border) | 🟢 None |
| `Keystrokes.tsx` | React component | 🟢 None |
| `Outro.tsx` | React component | 🟢 None |
| `ProgressBar.tsx` | React component | 🟢 None |
| `Sections.tsx` | React component | 🟢 None |
| `TitleCard.tsx` | React component | 🟢 None |
| `TransitionLayer.tsx` | React component (scan-line, vignette, grain, chromatic) | 🟢 None |
| `WindowChrome.tsx` | React component | 🟢 None |

### New Lib Modules

| Module | Purpose | Risk |
|---|---|---|
| `asCss.ts` | CSS string helper | 🟢 None |
| `opacityWindow.ts` | Opacity calculation | 🟢 None |
| `palettes.ts` | Color presets (neon, paper, ocean) | 🟢 None |
| `showcase.schema.ts` | TypeScript schema | 🟢 None |

### Security Assessment

- ✅ Alle Remotion componenten zijn pure React rendering — geen I/O, geen exec, geen netwerk
- ✅ `TransitionLayer.tsx` gebruikt Remotion's `useCurrentFrame` en `interpolate` — geen externe input
- ✅ `showcase.schema.ts` definieert types — geen runtime validatie, maar schema is correct

---

## 3. CLI Commands (`extensions/pi-control/index.ts`) 🟡

### New Commands

| Command | Handler | Risk |
|---|---|---|
| `/skill-studio` | Static string — "Run `bin/skill-studio`" | 🟢 None |
| `/recipe-list` | Static list | 🟢 None |
| `/evidence-new` | `mkdirSync` + markdown | 🟡 Path construction |
| `/tctl-status` | `execFileSync("tctl", ["sessions"])` | 🟡 Command availability |
| `/skill-diff` | `skillDiff()` — diff user vs PI skill | 🔴 **Path traversal** |

### Security Issues

**`/skill-diff` — Path Traversal (CRITICAL):**
```typescript
function skillDiff(args: string) {
  const name = args.trim();  // ❌ unsanitized
  const piPath = join(repoRoot, "skills", name, "SKILL.md");
  // ...
}
```

**Attack:** `/skill-diff ../../.ssh/id_rsa` → leest `repoRoot/.ssh/id_rsa/SKILL.md` buiten skills dir.

*Dit is hetzelfde issue als gemeld in PR #27 audit (blocking issue #1).*

**`/evidence-new` — Path construction:**
```typescript
const dir = join(rootDir(), "artifacts", "runs", slug);
```
- ✅ `slug` is gegenereerd uit `new Date().toISOString().replace(/[:.]/g, "-")` — geen user input
- ✅ Veilig

---

## 4. Tests Assessment ✅

### Test Coverage (uit PR beschrijving)

| Test Category | Files | Tests | Library |
|---|---|---|---|
| Studio component | ActionBar, StatusBar, SkillList, SkillDetail | 4 files | ink-testing-library |
| App integration | app.test.tsx | 1 file | ink-testing-library |
| Hooks | useSkillRegistry, useFilter | 2 files | React Testing |
| E2E flow | e2e-flow.test.ts | 1 file | Vitest |
| Utils | utils.test.ts, fallback tests | 2 files | Vitest |
| Remotion | duration, render | 2 files | Vitest |

**Test kwaliteit:**
- ✅ `ink-testing-library` is de correcte test library voor Ink TUIs
- ✅ `app.test.tsx` simuleert stdin key presses (`{ name: 'j', ctrl: false, meta: false, shift: false }`) — realistisch
- ✅ `e2e-flow.test.ts` test route → browser → evidence pipeline
- ✅ `useSkillRegistry.test.tsx` valideert registry shape

**Concern:** 🟡 `e2e-flow.test.ts` maakt geen echte browser/capture calls aan (mocked). Dit is correct voor unit tests maar dekt niet de daadwerkelijke I/O paden.

---

## 5. Dependency Changes ✅

### `package.json`

| Dependency | Version | Type | Risk |
|---|---|---|---|
| `@types/react` | ^19.2.15 | dev | 🟢 Safe |
| `ink` | ^7.0.4 | runtime | 🟢 React 19 compatible |
| `react` | ^19.2.6 | runtime | 🟢 Latest stable |
| `tsx` | ^4.22.3 | runtime | 🟢 TypeScript execution |
| `ink-testing-library` | ^4.0.0 | dev | 🟢 Test only |

**Bundle impact:** +~4 dependencies. `react` + `ink` zijn significant maar nodig voor TUI.

---

## 6. Removed Files ✅

| File | Reden | Impact |
|---|---|---|
| `coverage/*` (alle 12 files) | Coverage artifacts hoorden niet in repo | 🟢 Geen impact — gegenereerd files |

---

## Summary

| Area | Risk | Verdict |
|---|---|---|
| Skill Studio TUI | 🟡 Medium | **Mergeable na fix** — path traversal in `skillDiff()` moet gefixt |
| Remotion Showcase | 🟢 Low | **Mergeable** — Pure rendering, geen security issues |
| CLI Commands | 🔴 High | **BLOCKING** — `skillDiff()` en `skillInfo()` hebben path traversal |
| Tests | 🟢 Low | **Mergeable** — Goede dekking, correcte libraries |
| Dependencies | 🟢 Low | **Mergeable** — Legitieme dependencies |

**Blocking issues:**
1. **Path traversal in `skillDiff()`** — `name` parameter is unsanitized
2. **Path traversal in `skillInfo()`** — zelfde issue

**Follow-up:**
1. Importeer `isValidSkillName()` uit `skill-merge.ts` en valideer in beide functies
2. Voeg `fs.watch` error handling toe (`EMFILE`/`ENOSPC`)
3. Overweeg `skillDiff` en `skillInfo` te verplaatsen naar `skill-merge.ts` voor single source of truth

**Note:** Deze blocking issues zijn ook gevonden in PR #27 audit en zijn al gefixt in de huidige `main` branch (v5.1.4). PR #26 zou dus eigenlijk al gemerged moeten zijn of moet gerebased worden op de fix.
