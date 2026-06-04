---
name: meta-control
description: Optimize the agent's (Pi) own use of the control extension and subagents.
---
# Meta Control

Use this atom to improve your own performance as an agent driving this extension.

## Self-Optimization Rules

1.  **Doctor First**: Always run `control_doctor` at the start of a session or after a tool failure. Do not wait for errors to discover missing dependencies.
2.  **Asset-Based Subagents**: Prefer loading subagent prompts from the `subagents/` directory rather than synthesizing them from scratch. This ensures consistency and quality.
3.  **Unique Runs**: Always use a `RUN_ID` and `RUN_DIR`. Never overwrite previous evidence.
4.  **Verification Loop**: If `control_verify_commitments` fails, do not proceed to the next step. Loop back to capture/compose until the proof is solid.

## Subagent Assets

| Name | Path | When to use |
|---|---|---|
| Technical Auditor | `subagents/technical-auditor.md` | Auditing code, security, and logic. |
| Integrity Auditor | `subagents/integrity-auditor.md` | Checking package structure and docs. |

## Strategy for Complex Goals

For high-level requests ("Make a showcase video of X"), always break it down into:
1. `control_route` -> identify skills.
2. `background-pty` -> execute steps.
3. `control_verify_commitments` -> check proof.
4. `compose` -> build video.
