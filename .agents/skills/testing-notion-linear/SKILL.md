---
name: testing-notion-linear
description: Test the Notion-Linear sync integration end-to-end via MCP tool calls. Use when verifying field mappings, status type coverage, or sync script changes.
---

# Testing: Notion-Linear Integration

Validate the bidirectional sync between Linear (ChefSheesh) and Notion (Master Tasks) using live MCP tool calls.

## Prerequisites

- Linear MCP server connected (provides `list_issues`, `list_issue_statuses`, `get_issue`)
- Notion MCP server connected (provides `notion-fetch`, `notion-create-pages`)
- TypeScript compiler available (`./node_modules/.bin/tsc`)

## Devin Secrets Needed

No additional secrets required — Linear and Notion MCP servers are pre-authenticated via org integrations.

## Test Procedure

### 1. TypeScript Compilation (validates types)

```bash
cd /home/ubuntu/repos/pi-agent-control-extension
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck --ignoreConfig scripts/notion-linear-sync.ts
```

Expected: exit code 0, no errors.

### 2. Package Validator (validates skill inventory)

```bash
python3 scripts/validate-package.py
```

Expected: "All N skills present" where N matches the number of skills on disk.

### 3. Linear Status Types (validates mapping completeness)

Use Linear MCP:
```
Tool: list_issue_statuses
Args: { "team": "ChefSheesh" }
```

Verify every returned `type` value has a matching entry in `LINEAR_STATUS_MAP` (scripts/notion-linear-sync.ts). Known types as of 2026-05-29:
- `started` ("In Progress", "In Review")
- `unstarted` ("Todo")
- `backlog` ("Backlog")
- `completed` ("Done")
- `canceled` ("Canceled")
- `duplicate` ("Duplicate")

Note: `triage` is mapped in code for completeness but doesn't currently exist in the team.

### 4. Linear Issue Query (validates state filter)

Use Linear MCP:
```
Tool: list_issues
Args: { "team": "ChefSheesh", "state": "started", "limit": 5 }
```

Expected: Returns issues with `statusType: "started"`. Catches BOTH "In Progress" and "In Review" statuses.

**Important nuance**: The `state` parameter accepts type, name, OR ID. Both `"started"` and `"in_progress"` may return results, but `"started"` is preferred because it matches by TYPE (catches all started-type statuses) rather than by NAME (only matches "In Progress").

### 5. Notion Schema Validation (validates field mappings)

Use Notion MCP:
```
Tool: notion-fetch
Args: { "id": "collection://36b960c9-572b-81e3-b3fc-000bf6eaf875" }
```

Verify the schema properties match what `linearIssueToNotionTask()` expects:
- Title property name (code uses "Task" — check actual name)
- Status select options (code maps to: "Not Started", "In Progress", "Done", "Archived")
- Priority select options (code maps to: "Urgent", "High", "Medium", "Low")
- Tags property existence
- Due Date property existence

**Known issue (2026-05-29)**: The actual Notion schema may differ from code expectations. The title property might be "Name" instead of "Task", Status options might be "To Do" instead of "Not Started", and "Archived"/"Urgent" might not exist. Either the Notion DB needs updating or the code mappings need adjustment.

### 6. Lint Check

```bash
npm run lint
```

Expected: exit code 0.

## Key Files

- `scripts/notion-linear-sync.ts` — Core sync logic, field mappings, MCP call builders
- `skills/notion-linear-bridge/SKILL.md` — Skill definition and workflow docs
- `docs/notion-linear/examples/linear-issues.json` — Example Linear API response data
- `scripts/validate-package.py` — Package structure validator

## Tips

- The Linear MCP `list_issues` state parameter does fuzzy matching against names. Always use statusType values ("started", "backlog", etc.) rather than display names for reliability.
- Notion `notion-create-pages` may auto-create select options that don't exist. Test with `notion-fetch` first to see current schema.
- If `description: null` type needs validation but no live issues have null descriptions, TypeScript compilation is sufficient proof — the compiler enforces the type contract.
- CI's CodeQL Analyze check may fail with "Code Security must be enabled" — this is a GitHub infrastructure issue unrelated to code changes.
