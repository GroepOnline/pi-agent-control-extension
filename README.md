# Pi Agent Control Extension

A Pi-native, extension-first conversion of the original `droid-control` package.

The earlier Pi variant only exposed skills and prompt templates. That was not enough for this package, because `droid-control` is operational: it routes tasks, selects terminal/browser drivers, validates capture commands, creates proof recipes, and checks deliverables. In Pi, those behaviors belong in an extension.

## What this package loads

- `extensions/pi-control/index.ts` — primary Pi extension.
- `skills/` — all 10 preserved skill atoms from the original package.
- `prompts/` — reusable `/demo`, `/verify`, and `/qa-test` prompt templates.
- `.pi/extensions/pi-control/index.ts` — development wrapper for project-local auto-discovery and `/reload`.

## Extension commands

- `/control <task>` — route a task and show the recommended workflow.
- `/route-control <task>` — print driver, skills, capture type, warnings, and recipe.
- `/demo-control` — show the canonical tuistory demo capture recipe.
- `/verify-control` — show the evidence schema.
- `/qa-control` — show the QA report template.
- `/doctor-control` — run the package validator.
- `/skills-control` — list loaded control skill atoms.

## Extension tools

- `control_route`
- `control_recipe`
- `control_evidence_schema`
- `control_skill_index`
- `control_doctor`
- `control_verify_commitments`

## Install

From this directory:

```bash
pi install .
```

For development/hot reload from a checked-out repo, Pi can auto-discover the wrapper under `.pi/extensions/pi-control/index.ts`; after edits, run:

```text
/reload
```

For quick one-off testing:

```bash
pi -e ./extensions/pi-control/index.ts
```

## Preserved skill atoms

- `agent-browser`
- `capture`
- `compose`
- `pi-agent-cli`
- `pi-agent-control`
- `pty-capture`
- `showcase`
- `true-input`
- `tuistory`
- `verify`

## Validate

```bash
npm run doctor
```

The validator checks that the extension, manifest, prompts, active skills, and original skill archive are present.
