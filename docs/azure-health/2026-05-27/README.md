# Azure Health & Config Cleanup — 2026-05-27 Artifact Bundle

This directory contains the deliverables from the Azure AI Foundry model health verification and configuration cleanup campaign executed on 2026-05-27.

## Contents

- `consolidated-azure-model-health-and-config-cleanup.md` — Main report with executive summary, health results (Pi focus with full verification), exact changes, Responses API decision record, and recommendations.
- `techstack-structure-proposal.md` — Recommended layout for importing these artefacts (and future ones) into the OnlineChefGroep techstack repository.
- `session-resume-notes.md` — Context from the interrupted opencode session `ses_1950e0fcbffe9NWh35hY9KVCY8` that was driving this work.

## How These Were Produced

1. Full live verification using the `agent-azure-model-health` skill (real curl calls with timing, `az cognitiveservices` queries for capacity/SKU/state).
2. Analysis of opencode session logs and DCP state for `ses_1950e0fcbffe9NWh35hY9KVCY8`.
3. Targeted fixes applied to unblock the session (gpt-chat-latest schema + safe default model switch to eus02 chat models).
4. Artifacts prepared inside the pi-agent-control-extension workspace under `docs/azure-health/2026-05-27/` so they are ready to be copied into the org techstack.

## Next Steps

See the "Next Actions" section in the consolidated report.

All changes described were performed with backups. No production API keys are present in these documents.

---
Generated as direct continuation of the build orchestration work in session `ses_1950e0fcbffe9NWh35hY9KVCY8`.