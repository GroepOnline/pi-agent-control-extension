---
name: visual-design
description: Image generation and presentations. Use when the user asks for logos, icons, diagrams, flowcharts, architecture diagrams, patterns, textures, photo edits, restorations, or needs a presentation/slide deck.
---
# Visual design

Image generation and presentations.

## Image generation

Use nanobanana CLI for AI image generation:

```bash
npm install -g @factory/nanobanana
export GEMINI_API_KEY="your-key"

nanobanana generate "company logo" --count=4 --styles=modern,minimal
nanobanana edit photo.png "remove background"
nanobanana icon "settings gear" --style=flat
nanobanana diagram "auth flow" --type=flowchart
```

Handles: logos, icons, diagrams, patterns, photo restoration, UI assets, visual sequences.

## Presentations

Use Slidev for markdown-based presentations:

```bash
npm init slidev@latest
slidev                    # dev server
slidev export --format pptx   # export to PowerPoint
slidev build              # build as hostable SPA
```

Write slides in markdown, get code highlighting, animations, diagrams, and Vue components.
