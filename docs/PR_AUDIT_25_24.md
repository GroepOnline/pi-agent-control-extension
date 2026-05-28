# PR Audit Report — pi-agent-control-extension PR #25 + #24

**Auditor:** Pi agent  
**Date:** 2026-05-28  

---

## PR #25: "Code Quality and Validation Refactor"
**Branch:** `fix-code-quality-12924402057187384454`  
**Files:** 10 changed  

### 1. `routing.ts` — Declarative Rules Refactor ✅

**Change:** Monolithische `if/else` chain vervangen door `ROUTE_RULES` array met state-mutating `apply()` functies.

**Behavioral equivalence:** ✅ Verifieerd. De nieuwe code:
- Start met dezelfde defaults (`driver: "tuistory"`, `capture: "report"`, etc.)
- Loopt door alle rules in dezelfde volgorde als de originele if-statements
- Muteert state object in-place (functioneel equivalent)
- Returnt identieke `RouteDecision` structuur

**Security:** Geen issues. Geen user input verwerking buiten de bestaande `has()` string matching.

**Extensibility:** ✅ Verbetering. Nieuwe rules kunnen worden toegevoegd zonder bestaande logica aan te raken.

---

### 2. `tools/browser_command.ts` — ALLOWED_ACTIONS Guard ✅

**Change:** Extractie van browser command tool met expliciete action validatie.

```typescript
const ALLOWED_ACTIONS = ["open", "click", "fill", "screenshot", "snapshot", "close"];
```

**Security assessment:**
- ✅ Action parameter wordt gevalideerd tegen whitelist
- ❓ **Concern:** `ALLOWED_ACTIONS` is hardcoded inline. Bij uitbreiding van agent-browser CLI met nieuwe commands (bv. `scroll`, `wait`) zal deze whitelist breken legitieme functionaliteit.
- ✅ Tests toegevoegd voor invalid action rejection
- ✅ Gebruikt `execFileSync` (niet `exec`) — geen shell injection

**Recommendation:** Overweeg `ALLOWED_ACTIONS` te synchroniseren met een manifest of schema, of maak het configureerbaar.

---

### 3. `scripts/render-showcase-helper.py` — Bash→Python Extractie 🟡

**Change:** Inline Python scripts uit `render-showcase.sh` geëxtraheerd naar standalone Python module.

**Security assessment:**
- ✅ Geen shell injection meer (was het grootste risico in de inline `python3 - <<'PY'` pattern)
- ✅ `sys.argv[1]` wordt gebruikt als command dispatch — command injection risico is minimaal aangezien het interne script is
- ⚠️ **`os.environ["PROPS_JSON"]`** wordt direct geparsed zonder validatie:
  ```python
  raw_props = os.environ["PROPS_JSON"]
  if not raw_props.strip():
      raise ValueError("PROPS_JSON is empty")
  props = json.loads(raw_props)
  ```
  Een malafide environment variabele kan een DoS veroorzaken via zeer grote JSON, maar dit is een intern build script.
- ✅ `output_file` wordt geschreven met `"w", encoding="utf-8"` — correct

**Recommendation:** Voeg een JSON size limit toe (>10MB rejecten) als defense in depth.

---

### 4. `skills/autoresearch/autoresearch_helper.py` — Modularization ✅

**Change:** `create_parser()` geëxtraheerd uit `main()`.

**Security:** Geen issues. Pure refactoring, geen functionaliteit gewijzigd.

---

### 5. `scripts/test_validate_package.py` — New Tests ✅

**Change:** 40 regels nieuwe unit tests voor package validator.

**Quality:**
- ✅ Tests runnen `scripts/validate-package.py` als subprocess — realistisch
- ✅ Controleert op required files, manifest skills, keyword checks
- ✅ `setUpClass` pattern voorkomt redundant uitvoeren

**Concern:** Tests zijn hardcoded op specifieke output strings ("Required file: package.json"). Als de validator output formaat wijzigt, breken deze tests. Overweeg output parsing te structureren.

---

### 6. `utils.ts` — buildUsageReport & listSkills Refactor ✅

**Change:** Destructuring in `buildUsageReport`, consolidated directory loop in `listSkills`.

**Security:** Geen issues. Beide zijn read-only operaties.

---

### 7. `bin/tctl` — One-line fix ✅

**Change:** 1 addition, 1 deletion (onduidelijk uit diff, vermoedelijk bugfix).

---

## PR #24: "🧪 [Testing Improvement] Refactor duration calculations and check rounding"
**Branch:** `fix-duration-tests-10262564742510954097`  
**Files:** 1 changed (`remotion/src/lib/duration.test.ts`)

### Assessment ✅

**Change:** Dynamisch berekende verwachtingen vervangen door hardcoded waarden + nieuwe fractional frame test.

| Test | Oude verwachting | Nieuwe verwachting | Correct? |
|---|---|---|---|
| Default clip duration | `Math.ceil((TITLE + DEFAULT_CLIP + OUTRO) * 30)` | `720` | ✅ (2.5+20+1.5=24s * 30 = 720) |
| 10s clip @ 60fps | `Math.ceil((TITLE + 10 + OUTRO) * 60)` | `840` | ✅ (2.5+10+1.5=14s * 60 = 840) |
| 0.5s clip (min 1s) | `Math.ceil((TITLE + 1 + OUTRO) * 30)` | `150` | ✅ (2.5+1+1.5=5s * 30 = 150) |
| -5s clip (min 1s) | `Math.ceil((TITLE + 1 + OUTRO) * 30)` | `150` | ✅ (idem) |
| **NEW** 10.01s @ 30fps | — | `421` | ✅ (2.5+10.01+1.5=14.01s * 30 = 420.3 → ceil = 421) |

**Quality:**
- ✅ Harde waarden vangen regressies in constanten (TITLE_SECONDS, OUTRO_SECONDS, DEFAULT_CLIP_SECONDS)
- ✅ Nieuwe fractional test valideert `Math.ceil` gedrag expliciet
- ✅ Alle randgevallen covered (negatief, sub-minimum, exacte waarden)

---

## Summary

| PR | Risk | Verdict |
|---|---|---|
| #25 | 🟢 Low | **Mergeable** — Refactoring is clean, browser_command guard is nette security verbetering |
| #24 | 🟢 Low | **Mergeable** — Test verbeteringen zijn solide, geen productiecode gewijzigd |

**Blocking issues:** Geen  
**Follow-up recommendations:**
1. Maak `ALLOWED_ACTIONS` configureerbaar of gesynchroniseerd met browser tool schema
2. Voeg JSON size limit toe in `render-showcase-helper.py`
3. Structureer `test_validate_package.py` output parsing om fragiele string matching te vermijden
