# Exact Changes Summary — 2026-05-27 Azure Cleanup Cycle

## Files Modified (this conversation + session context)

### 1. `~/.pi/agent/models.json`
- Added `"maxTokens": 16384` to `gpt-chat-latest` (eus02 provider) — schema fix.
- Already contained prior session cleanups (removals of failing models + addition of fw-minimax-m2-5).

### 2. `~/.config/opencode/opencode.jsonc`
- Added `"output": 16384` under `limit` for `gpt-chat-latest` in the `foundry-aisvfoundryeus02-8d85881d` provider.
- Changed top-level defaults:
  - Before (problematic): `foundry-aisvfoundrywe01-8d85881d/DeepSeek-V4-Pro` + `gpt-54-we01`
  - After (stable): `foundry-aisvfoundryeus02-8d85881d/gpt-54-mini-eus02` + `gpt-54-nano-eus02`

### 3. Other files touched in the broader 2026-05-27 session (from DCP task_result)
- `~/.pi/agent/settings.json`
- `~/.factory/settings.json`
- Multiple timestamped backups created around 21:12–21:15.

## Models Removed / Deprecated (across the cycle)
- `gpt-53-codex-we01` (Responses API only)
- `helios-embed-v4`
- `helios-gpt54-we`
- `gpt-54-pro-eus02`
- `claude-sonnet-4-6` (on certain paths)
- Various Kimi variants on we01 that were timing out or misrouted
- Empty Helios provider blocks

## Models Added / Promoted
- `fw-minimax-m2-5` (EUS01 + EUS02)
- Stable eus02 GPT-54 nano/mini as new defaults for OpenCode

## Key Non-Config Finding
- `azure-foundry-we01` auth.json endpoint mismatch (services.ai vs working cognitiveservices path for the current key).

All changes were made with explicit backups. Full details in the consolidated report.
