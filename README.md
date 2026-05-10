# Pi Agent Control Extension

Pi extension for terminal/CLI/browser control workflows: routing, capture, compose, verify, QA proofs, and showcase demos. Plus general-purpose agent skills for code quality, design, writing, research, and documentation.

## Quick start

```bash
pi install git:github.com/OnlineChef/pi-agent-control-extension
```

Then in any Pi session:

| Command | What it does |
|---|---|
| `/skills-control` | List all 20 bundled skill atoms |
| `/route-control <task>` | Route a task → driver + skills + capture + recipe |
| `/demo-control` | Show the canonical tuistory capture recipe |
| `/verify-control` | Show verification/evidence schema |
| `/qa-control` | Show QA report template |
| `/doctor-control` | Run package validator |

Or use the LLM tools: `control_route`, `control_recipe`, `control_evidence_schema`, `control_skill_index`, `control_doctor`, `control_verify_commitments`.

## Skill atoms

### Control (10)
`agent-browser` · `capture` · `compose` · `pi-agent-cli` · `pi-agent-control` · `pty-capture` · `showcase` · `true-input` · `tuistory` · `verify`

### General (10)
`autoresearch` · `frontend-design` · `human-writing` · `init` · `review` · `session-navigation` · `simplify` · `skill-creation` · `visual-design` · `wiki`

## Routing

Three lookups → load driver + skills + recipe:

| Route | Example task | Driver | Capture |
|---|---|---|---|
| Web / Electron | "browser QA test" | `agent-browser` | screenshots |
| Real terminal | "ghostty key encoding" | `true-input` | mp4 |
| TUI / CLI | "pi demo recording" | `tuistory` | asciicast |

General-purpose skills are auto-routed based on task keywords (design, review, writing, wiki, etc.).

## Validate

```bash
npm run validate
```

---

![Demo](artifacts/demo/demo.gif)
