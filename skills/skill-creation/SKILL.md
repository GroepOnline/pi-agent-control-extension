---
name: skill-creation
description: Create, improve, and manage Pi skills. Use when creating new skills from scratch or from session learnings, improving existing skills based on user preferences, analyzing sessions to identify patterns, or understanding best practices for agentic skill design. Meta-skill for self-improvement and continuous learning.
---
# Skill creation

Build new skills and improve existing ones. The skill that teaches you how to learn.

## Why skills?

Knowledge usually dies with the session. Skills fix that: turn "figured this out once" into "I know how to do this." Benefits: no re-discovery next time, other sessions benefit, complex workflows become repeatable.

## Basic format

Skills go in a folder with `SKILL.md`:

```
skills/my-skill/
└── SKILL.md
```

YAML frontmatter + markdown:

```markdown
---
name: my-skill
description: |
  What this skill does.
  When to use it.
---
# My skill
Instructions go here.
```

The `description` determines when Pi loads the skill. Be specific about the problems it solves.

## When to create a skill

Not everything deserves a skill. Skills are for complex or long workflows worth repeating/sharing. Find the balance between general enough to reuse and specific enough to be helpful.

Ask: Did I have to dig around to figure this out? Would I be annoyed solving it again? Is there something non-obvious from the docs? If yes: worth extracting.

## Extracting skills from sessions

Use Pi's session history (`~/.pi/agent/sessions/`) to find patterns. Generalize: replace specific paths with patterns, note prerequisites, call out assumptions.

## Skill design tips

Use the `human-writing` skill when writing skill docs. Start small — one thing well beats everything. Include verification ("How do you know it worked?"). Document failures too ("What not to do"). Keep fresh — update or delete outdated skills.

## Where skills live

| Location | Scope |
|---|---|
| `.pi/skills/` | Project-local (commit to git) |
| `~/.pi/agent/skills/` | Personal, across all projects |

Project skills for team conventions. Personal skills for your workflows.

## Improving existing skills

Signs a skill needs work: users ask follow-ups, it fails on recurring edge cases, better approaches exist.

When updating, bump the version. Breaking changes → bump major version.

## The loop

1. Work on something
2. Notice when you learn something non-obvious
3. Extract it as a skill
4. Use the skill next time
5. Improve based on results
6. Repeat
