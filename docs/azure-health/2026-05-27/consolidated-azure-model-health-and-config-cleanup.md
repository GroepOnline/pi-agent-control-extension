# Consolidated Azure AI Foundry Model Health & Config Cleanup Report
**Date:** 2026-05-27  
**Scope:** Pi Agent System, Droid/Factory, OpenCode  
**Environments:** Azure AI Foundry (we01/westeurope, eus01/eastus, eus02/eastus2, westus2)  
**Prepared for:** OnlineChefGroep Techstack Repository  
**Status:** Ready for import into techstack/azure/

---

## Executive Summary

A multi-environment Azure model health verification and configuration cleanup was executed across the three primary agent runtimes used in the OnlineChefGroep stack:

- **Pi** (`~/.pi/agent/`)
- **Factory/Droid** (`~/.factory/`)
- **OpenCode** (`~/.config/opencode/`)

**Key findings:**
- All core Azure accounts and deployments are healthy (Succeeded state, reasonable capacity/SKU).
- Multiple models were incorrectly routed to the Azure OpenAI **Responses API** (`/responses`), which is only enabled for specific codex models on the `chefchef` resource. This caused hard failures (404 "not enabled in this region").
- Several models on we01 (Kimi variants, certain DeepSeek, Helios) had chronic timeout/DNS or 4xx issues under load.
- `gpt-chat-latest` was missing required `limit.output` / `maxTokens` in multiple places, causing schema validation crashes on OpenCode startup.
- One critical auth.json endpoint mismatch was identified for the we01/chefadminfoundry key (services.ai.azure.com vs working cognitiveservices.azure.com).

**Actions taken in this cycle (2026-05-27):**
- Removed or deprioritized ~10 failing/unsupported routes across environments.
- Added `fw-minimax-m2-5` on EUS01/EUS02 where validated.
- Fixed `gpt-chat-latest` schema in both Pi models.json and OpenCode config.
- Switched OpenCode workspace defaults to stable eus02 chat models (gpt-54-mini-eus02 / nano) to prevent Responses misrouting.
- Created timestamped backups of all modified files.
- This report + per-environment artifacts prepared for the org techstack repo.

**Top recommended production models (post-cleanup):**
- Fast & stable: `gpt-54-nano-we01`, `gpt-54-mini-we01`, `DeepSeek-V4-Flash` (we01)
- High capability: `gpt-5.5` / `gpt-55-*` (eus02), `grok-4-20-reasoning` (eus02)
- Reasoning/codex work: `gpt-53-codex-eus02` / `gpt-5.3-codex` (chefchef Responses path only)

---

## Techstack Repository Structure Proposal

**Recommended location in OnlineChefGroep techstack repo:**

```
techstack/
├── azure/
│   ├── models/                          # Sanitized, canonical copies (no real keys)
│   │   ├── pi/
│   │   │   ├── models.json
│   │   │   ├── settings.json
│   │   │   └── auth.json.redacted
│   │   ├── factory-droid/
│   │   │   ├── settings.json
│   │   │   └── ...
│   │   └── opencode/
│   │       └── opencode.jsonc
│   ├── health-reports/
│   │   └── 2026-05-27/
│   │       ├── pi-azure-model-health.md
│   │       ├── factory-droid-azure-model-health.md
│   │       ├── opencode-azure-model-health.md
│   │       └── consolidated-... (this file)
│   ├── cleanup/
│   │   └── 2026-05-27/
│   │       ├── pi-changes.diff
│   │       ├── factory-changes.diff
│   │       ├── opencode-changes.diff
│   │       ├── backup-manifest.json
│   │       └── session-ses_1950e0fcbffe9NWh35hY9KVCY8-notes.md
│   ├── decisions.md                     # Responses API rules, endpoint mapping, retirement decisions
│   └── README.md
├── infrastructure/
│   └── azure-ai-foundry/                # Future IaC (Terraform etc.)
└── ...
```

**Rationale for placement:**
- `techstack/azure/` keeps all Azure-specific operational knowledge in one place.
- Live mutable configs remain in the per-user `~` directories.
- Techstack holds the "source of truth" snapshots + history + decisions.
- Easy to diff across environments and over time.

---

## Detailed Health Results (Pi Environment — Full Verification)

(Executed live with `agent-azure-model-health` protocol on 2026-05-27)

### Accounts & Deployments Verified
- `aisvfoundrywe01` (westeurope) — chefadminfoundry custom domain — all models Succeeded, mostly GlobalStandard.
- `chefadmin-6573-resource` (westus2) — GlobalStandard for DeepSeek-V4-Flash & grok-4.3.
- `aisvfoundryeus01` / `aisvfoundryeus02` — healthy, mix of GlobalStandard / DataZoneStandard.
- `chefchef` (eastus, OpenAI kind) — only `gpt-5.3-codex` — DataZoneStandard, Responses API.

### Live API Test Results (selected)
- `DeepSeek-V4-Flash` (we01) → 200 in 0.73s (cognitiveservices path)
- `grok-4.3` (westus2) → 200 in 4.28s (heavy reasoning)
- `fw-kimi-k2-5` (eus01) → 200 in 1.08s
- `gpt-54-mini-eus02` → 200 in 1.46s
- `gpt-5.3-codex` (chefchef) → 200 in 1.12s via `/responses`
- `claude-sonnet-4-6` (eus02) → 404 "api_not_supported" (expected — not on standard chat path)
- we01 key on `services.ai.azure.com` → **401** (the mismatch)

**Critical config bug found:** `azure-foundry-we01` entry in `~/.pi/agent/auth.json` pointed to `https://chefadminfoundry.services.ai.azure.com/...` while the matching key only works on the cognitiveservices path (and what models.json + `~/.opencode/env` already used).

### Recommendations (Pi)
1. Keep we01 as primary for speed (GlobalStandard + low latency from NL).
2. Use eus02 for heaviest reasoning / newest GPT-5.5 models.
3. Never put non-codex models on Responses path.
4. Standardize on cognitiveservices URLs for the current key types or generate proper AI Inference keys for services.ai paths.

(Full raw curl + az output available in the per-environment report.)

---

## Configuration Changes — 2026-05-27 Cycle

### Changes from session `ses_1950e0fcbffe9NWh35hY9KVCY8` (prior to this continuation)
- **Pi models.json**: Removed `gpt-53-codex-we01`, `helios-embed-v4`, `gpt-54-pro-eus02`, `helios-gpt54-we`. Removed empty Helios provider. Added `fw-minimax-m2-5` EUS01/EUS02. Removed `maxTokens` from `gpt-chat-latest` (later re-added — see below).
- **Pi settings.json**: Default changed to stable `azure-aisvfoundrywe01-8d85881d/gpt-54-nano-we01`. Failing models pruned from enabledModels.
- **Factory/Droid settings.json**: Similar pruning of failing models + default change.
- **OpenCode opencode.jsonc**: Removed `FW-Kimi-K2.6`, `gpt-53-codex-we01`, `Kimi-K2.6`, `kimi-k25-gs`, `helios-embed-v4`, `gpt-54-pro-eus02`, Helios provider block. Removed `limit.output` from `gpt-chat-latest` (causing the schema crash). Added `fw-minimax-m2-5`.
- All files received timestamped `.bak-20260527-2112*` backups.

### Additional fixes applied during this continuation (to unblock the session)
1. **gpt-chat-latest schema** (both locations):
   - `~/.pi/agent/models.json`: Added `"maxTokens": 16384`
   - `~/.config/opencode/opencode.jsonc`: Added `"output": 16384` under `limit`
2. **OpenCode default model switch** (to prevent Responses API death on resume):
   - Changed from we01 DeepSeek-V4-Pro / gpt-54-we01 → stable eus02 chat models:
     - `"model": "foundry-aisvfoundryeus02-8d85881d/gpt-54-mini-eus02"`
     - `"small_model": "foundry-aisvfoundryeus02-8d85881d/gpt-54-nano-eus02"`

These two changes directly resolved the "opencode die start nu niet" symptom reported for session `ses_1950e0fcbffe9NWh35hY9KVCY8`.

---

## Responses API vs Standard Chat Completions — Decision Record

**Rule established:**
- Only `gpt-*-codex` models on the `chefchef` resource may use the `/responses` endpoint.
- All other models (DeepSeek, Kimi, GLM, Grok, GPT-54/55 non-codex, Minimax, etc.) **must** use the standard OpenAI-compatible `/chat/completions` path via the cognitiveservices or services.ai base URLs.

This rule was the root cause of multiple session deaths and health failures.

---

## Next Actions (for techstack import & follow-up)

1. Copy the contents of `docs/azure-health/2026-05-27/` into `techstack/azure/` (or the agreed location).
2. Generate per-environment raw health reports (curl + az output) if not already captured.
3. Review the current `~/.pi/agent/auth.json` we01 endpoint and decide on permanent standardization (cognitiveservices vs proper AI Inference key).
4. Consider adding a lightweight health probe script (invoking the `agent-azure-model-health` skill) to CI or a weekly cron.
5. Update the three runtime systems (Pi, Factory, OpenCode) to reference the techstack canonical files where possible (or at least link to them in docs).

---

## Files in This Artifact Bundle (2026-05-27)

- `consolidated-azure-model-health-and-config-cleanup.md` (this file)
- `techstack-structure-proposal.md` (to be added in follow-up if split)
- Session notes: `session-ses_1950e0fcbffe9NWh35hY9KVCY8-resume-notes.md`

All changes were made with backups. No production keys are stored in this report.

---

**Prepared as continuation of opencode session `ses_1950e0fcbffe9NWh35hY9KVCY8`.**  
Ready for review and import into the OnlineChefGroep techstack repository.

---

## Additional Config Cleanup Pass — 2026-05-27 23:51 (this continuation)

After the initial session work and the unblocking fixes (gpt-chat-latest schema + default model switch), a final systematic pass was executed on the live configs with fresh backups.

### Fresh Backups Created
- `~/.pi/agent/models.json.bak-20260527-235157`
- `~/.pi/agent/settings.json.bak-20260527-235157`
- `~/.config/opencode/opencode.jsonc.bak-20260527-235157`
- `~/.factory/settings.json.bak-20260527-235157`

### Changes Applied in This Pass

**Pi `models.json`**:
- Removed three Kimi variants from the we01 provider (Kimi-K2.6, kimi-k25-gs, kimi-k26-gs) — these had shown timeout/reliability issues in health testing.
- gpt-chat-latest already had `maxTokens` (from earlier fix in session).

**OpenCode `opencode.jsonc`**:
- Removed `kimi-k26-gs` from the we01 provider block.
- Defaults already set to stable eus02 models (gpt-54-mini-eus02 / nano-eus02).

**Pi `settings.json`**:
- Default changed to `azure-aisvfoundrywe01-8d85881d/gpt-54-nano-we01` (fast & stable on we01).
- `enabledModels` pruned: removed we01 Kimi-K2.6 and FW-Kimi-K2.6; kept only validated fast/reliable routes (we01 GPT-54 series + DeepSeek Flash/Pro, strong eus02 models, chefchef codex).

**Factory `settings.json`**:
- Removed `FW-Kimi-K2.6` custom model entry (westus2) matching previously identified problematic route.

All Kimi/Helios/Responses-misrouted models that were sources of the original session crashes and health failures have now been consistently removed or deprioritized across the three runtimes.

### Git Update
The entire `docs/azure-health/2026-05-27/` bundle (this report + proposal + notes + manifests) was committed in the pi-agent-control-extension repo:

```
commit a80afc1a
docs(azure): add 2026-05-27 consolidated health & cleanup report + techstack proposal
```

The artifacts are now tracked in this repo and ready to be promoted/copied into the central OnlineChefGroep techstack repo under `azure/`.

**Configs are now in a clean, healthy state** aligned with the health verification results and the original intent of the interrupted opencode session. 

### Final "Only Good Models" Pass (this request)
Additional aggressive prune performed to ensure **only the proven-good, live-tested Azure models** remain:

**Pi models.json we01 provider — final list:**
- DeepSeek-V4-Flash
- DeepSeek-V4-Pro
- gpt-54-mini-we01
- gpt-54-nano-we01
- gpt-54-we01

**OpenCode we01 provider — final list:** same 5 models above (all Kimi variants fully removed).

**Additional removals in this pass:**
- `fw-kimi-k2-5` removed from eus01 provider in both Pi models.json and OpenCode opencode.jsonc (mixed reliability in testing).

**Result:** Both Pi and OpenCode now have only the fastest and most reliable Azure models from our curl + az verification (primarily we01 GPT-54 series + DeepSeek for speed, plus strong eus02 models for capability).

Fresh backups created before this final pass (20260527-2352xx range).

Ready for review or further targeted tuning.