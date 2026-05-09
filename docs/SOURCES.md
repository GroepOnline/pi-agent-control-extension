# Source Notes

This conversion was based on the uploaded `droid-control.zip` and current public documentation snapshots checked during the rebuild.

- Codex: project instructions are centered around `AGENTS.md`; Codex workflows can be saved as skills.
- Pi Coding Agent: skills are loaded from global, project, package, and CLI-specified paths; package skills can be declared through `package.json` or `skills/` directories.
- Devin: repo skills are `SKILL.md` files, with `.agents/skills/<skill-name>/SKILL.md` recommended; Devin also documents supported skill locations and dynamic `$ARGUMENTS` content.

See root `README.md` and `docs/MAPPING.md` for the actual converted layout.
