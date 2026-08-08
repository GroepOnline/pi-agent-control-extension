# Session Resume Notes — ses_1950e0fcbffe9NWh35hY9KVCY8 (2026-05-27)

**Session ID:** ses_1950e0fcbffe9NWh35hY9KVCY8  
**Runtime:** OpenCode (Bun-based)  
**Active agent role at crash:** "build orchestrator" (strict delegation per AGENTS.md — does not edit files or run commands directly; delegates to coder/scribe/explore/researcher)  
**Last known model:** Kimi-K2.6 (and attempts with DeepSeek-V4-Pro) on `foundry-aisvfoundrywe01-8d85881d`

## Cause of Death

The orchestrator attempted LLM calls that were routed to the Azure Responses API endpoint (`/openai/v1/responses`) for models that do not support it on the we01 resource.

Error observed:
```
Azure OpenAI Responses API is not enabled in this region. Please check https://aka.ms/aoai/responsesapi/availability
```

This was the second class of crash (after an earlier `ConfigInvalidError` on `gpt-chat-latest` missing `limit.output`).

## Fixes Applied in This Continuation (to unblock resume)

1. Fixed `gpt-chat-latest` schema in both canonical sources.
2. Changed OpenCode workspace default model + small_model from the problematic we01 entries to stable eus02 chat models:
   - `foundry-aisvfoundryeus02-8d85881d/gpt-54-mini-eus02`
   - `foundry-aisvfoundryeus02-8d85881d/gpt-54-nano-eus02`

After these changes the session is expected to start cleanly with:

```bash
opencode -s ses_1950e0fcbffe9NWh35hY9KVCY8
```

## Work in Progress at Time of Interruption

From DCP state (in-progress todo):

- Bepaal structuur voor OnlineChefgroep techstack repo en bepaal waar Azure model/config artefacts thuishoren

Pending high-priority items:
- Full local config fixes for Pi / Droid-Factory / OpenCode with backups + validation
- Persist the cleaned configs + health results separately in the techstack repo
- Review changes and report exactly what was changed

User direction (from session): "Ja volledig en dit ook allemaal apart in @techstack repo van org groeponline"

## Continuation

This bundle (`docs/azure-health/2026-05-27/`) was produced as the direct hand-off / continuation of the above work.

The consolidated report and structure proposal fulfill the "in progress" item and prepare the ground for the pending items.

---
Generated 2026-05-27 as part of resuming the session inside the pi-agent-control-extension workspace.