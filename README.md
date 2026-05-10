# Pi Agent Control Extension

Pi extension for terminal/CLI/browser control workflows: routing, capture, compose, verify, QA proofs, and showcase demos.

## Quick start

```bash
pi install git:github.com/OnlineChef/pi-agent-control-extension
```

Then in any Pi session:

| Command | What it does |
|---|---|
| `/skills-control` | List 10 bundled skill atoms |
| `/route-control <task>` | Route a task → driver + skills + capture + recipe |
| `/demo-control` | Show the canonical tuistory capture recipe |
| `/verify-control` | Show verification/evidence schema |
| `/qa-control` | Show QA report template |
| `/doctor-control` | Run package validator |
| `/control <task>` | Route + show full workflow |

Or use the LLM tools: `control_route`, `control_recipe`, `control_evidence_schema`, `control_skill_index`, `control_doctor`, `control_verify_commitments`.

## Skill atoms

`agent-browser` · `capture` · `compose` · `pi-agent-cli` · `pi-agent-control` · `pty-capture` · `showcase` · `true-input` · `tuistory` · `verify`

## Routing

Three lookups → load driver + skills + recipe:

| Route | Example task | Driver | Capture |
|---|---|---|---|
| Web / Electron | "browser QA test" | `agent-browser` | screenshots |
| Real terminal | "ghostty key encoding" | `true-input` | mp4 |
| TUI / CLI | "pi demo recording" | `tuistory` | asciicast |

## Validate

```bash
npm run validate
```

---

![Demo](artifacts/demo/demo.gif)
