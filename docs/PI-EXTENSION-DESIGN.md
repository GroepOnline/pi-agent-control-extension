# Pi Extension Design

## Decision

The Pi target is now an extension-first package. Skills remain as the knowledge layer, but the extension owns behavior.

## Why not skills only?

Skills are passive instructions. They cannot reliably:

- register custom slash commands;
- expose deterministic tools to the model;
- intercept risky shell/tool calls;
- enforce `tctl` launch invariants;
- show custom UI notices;
- run package validation through a command;
- keep state or add session lifecycle behavior.

Pi extensions can do those things through the `ExtensionAPI`.

## Runtime split

| Layer | Responsibility |
|---|---|
| Extension | commands, custom tools, guards, routing, doctor, evidence schema |
| Skills | deep workflow instructions for each original atom |
| Prompts | reusable command templates for demo/verify/QA |
| Scripts | capture/render/validate operations |
| AGENTS.md | repo-level project instructions |

## Guard policy

The extension blocks high-risk or malformed shell/tool calls that would make captures non-reproducible:

- broad `rm -rf` patterns;
- direct `.env` reads/writes;
- `droid-dev` launches without `--repo-root`;
- tuistory launches without `FORCE_COLOR=3` and `COLORTERM=truecolor`.

## Local development

Use `.pi/extensions/pi-control/index.ts` for project-local discovery and `/reload`. Use `pi install .` when testing the package manifest exactly as a user would install it.
