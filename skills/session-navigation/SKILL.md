---
name: session-navigation
description: Navigate, search, and manage Pi sessions. Use when listing recent sessions, searching session history, resuming previous sessions, finding sessions by project/date/content, or reviewing what was accomplished in past sessions.
---
# Session navigation

Find your way around past Pi sessions. Pick up where you left off, find that thing you did last week, or see what's been happening in a project.

## Where sessions live

Sessions are in `~/.pi/agent/sessions/`, organized by project folder:

```
~/.pi/agent/sessions/
├── -Users-name-code-myapp/
│   ├── <uuid>.jsonl
│   └── <uuid>.settings.json
├── -Users-name-code-api/
│   └── ...
```

Key files per session:
- **`.jsonl`** — conversation. First line = metadata. Rest = user/assistant/tool messages.
- **`.settings.json`** — stats: model, duration, tokens.

## Finding sessions

```bash
# List project folders
ls ~/.pi/agent/sessions/

# Find project folders (partial match)
ls ~/.pi/agent/sessions/ | grep "myapp"

# Recent sessions in a project
ls -lt ~/.pi/agent/sessions/<project-dir>/

# Get titles of recent sessions
for f in $(ls -t ~/.pi/agent/sessions/<project-dir>/*.jsonl | head -10); do
  head -1 "$f" | jq -r '.title // "Untitled"'
done
```

## Searching

```bash
# Search across ALL sessions
rg "authentication" ~/.pi/agent/sessions/

# Search within specific project
rg "bug fix" ~/.pi/agent/sessions/<project-dir>/

# With context
rg -C 2 "login" ~/.pi/agent/sessions/<project-dir>/

# Find projects with sessions about a topic
rg -l "redis" ~/.pi/agent/sessions/ | cut -d'/' -f1-5 | sort -u
```

## Reading a session

```bash
# Metadata (title, working directory)
head -1 ~/.pi/agent/sessions/<project-dir>/<uuid>.jsonl | jq .

# Session stats (model, tokens, duration)
cat ~/.pi/agent/sessions/<project-dir>/<uuid>.settings.json | jq .

# Conversation length
wc -l ~/.pi/agent/sessions/<project-dir>/<uuid>.jsonl
```

User messages: `"role": "user"`. Assistant: `"role": "assistant"`. Tool calls show what commands ran.

## Pi session commands

Pi has built-in session commands:
- `/resume` — browse and select a previous session
- `/session` — show current session info
- `/tree` — navigate session branches
- `/fork` — fork from previous message
- `/clone` — duplicate active branch to new session
