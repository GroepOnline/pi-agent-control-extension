# Techstack Repository Structure Proposal — Azure AI Foundry Artefacts

**Date:** 2026-05-27  
**Context:** Continuation of opencode session `ses_1950e0fcbffe9NWh35hY9KVCY8`  
**Goal:** Decide canonical location and layout for all Azure model configs, health reports, and cleanup history across OnlineChefGroep environments.

---

## Recommended Top-Level Placement

```
org-techstack/ (or GroepOnline/techstack)
└── azure/
    ├── README.md
    ├── decisions.md
    ├── models/                    # Sanitized canonical snapshots (no secrets)
    │   ├── pi/
    │   │   ├── models.json
    │   │   ├── settings.json
    │   │   └── auth.json.redacted
    │   ├── factory-droid/
    │   │   ├── settings.json
    │   │   └── custom-models.json (if separate)
    │   └── opencode/
    │       └── opencode.jsonc
    ├── health-reports/
    │   └── 2026-05-27/
    │       ├── consolidated-azure-model-health-and-config-cleanup.md
    │       ├── pi-full-verification.md          (raw curl + az output)
    │       ├── factory-droid-health.md
    │       └── opencode-health.md
    ├── cleanup/
    │   └── 2026-05-27/
    │       ├── pi/
    │       │   ├── changes.diff
    │       │   └── backup-manifest.json
    │       ├── factory-droid/
    │       ├── opencode/
    │       └── session-notes/
    │           └── ses_1950e0fcbffe9NWh35hY9KVCY8-resume.md
    └── infrastructure/            # Future: Terraform / Bicep / Pulumi for the Foundry accounts
        └── azure-ai-foundry/
```

---

## Why This Structure

- **Single source of truth** for "how our Azure AI setup should look" across all runtimes.
- **History & auditability**: timestamped health reports + cleanup directories make it easy to answer "what changed and why on 2026-05-27?"
- **Separation of concerns**: live secrets/configs stay in the user home directories of each machine/environment. Techstack holds only shareable, reviewable artefacts.
- **Easy onboarding**: new engineers or new machines can bootstrap from `techstack/azure/models/`.
- **Future-proof** for when we move to Infrastructure-as-Code for the actual Azure resources.

---

## Import Instructions (for the techstack repo maintainer)

1. Copy the entire `docs/azure-health/2026-05-27/` folder from this pi-agent-control-extension repo into `techstack/azure/health-reports/2026-05-27/`.
2. Copy the latest sanitized `models.json` / `settings.json` / `opencode.jsonc` (with keys removed) into the corresponding `models/` subdirectories.
3. Create the `cleanup/2026-05-27/` diffs from the `.bak` files that were created during the session.
4. Merge the content of `decisions.md` (to be created) with any existing Azure decisions.
5. Update `techstack/azure/README.md` with pointers to the latest health report.

---

## Alternative Considered (and rejected)

- Putting everything under `infrastructure/azure/` only — too narrow; this is operational configuration + health data, not just IaC.
- Keeping it only inside each runtime repo (pi-agent-control-extension, etc.) — fragments knowledge across 9+ repos.

The proposed `techstack/azure/` central location won for cross-environment visibility.

---

**Status:** Proposal ready for review by the team / @techstack owners.

Once approved, the 2026-05-27 artefacts can be moved in as the first real content.