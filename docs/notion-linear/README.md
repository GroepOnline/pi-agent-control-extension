# Notion-Linear Integration Report

> Generated: 2026-05-29 | Repository: `OnlineChefGroep/pi-agent-control-extension`
> Author: Devin (automated) | Session: [View](https://app.devin.ai/sessions/0b8dafc179224310a0c9ed60ae3646bf)

## Executive Summary

This report documents the full integration between the **Notion Command Center** and **Linear (ChefSheesh)** workspace, automated through Devin's MCP (Model Context Protocol) integrations. The integration enables:

- **Bidirectional task sync** between Notion Master Task Database and Linear issues
- **Project documentation mirroring** between Notion Project Database and Linear projects
- **Sprint report generation** combining data from both platforms
- **Automated playbooks** for recurring workflows
- **Scheduled automation** via Devin's cron-based session scheduling

---

## Architecture Overview

```text
┌─────────────────────┐        MCP        ┌─────────────────────┐
│   Notion Workspace   │ <───────────────> │  Linear Workspace   │
│                      │                   │                      │
│  Command Center      │    Devin Agent    │  Team: ChefSheesh    │
│  ├─ Master Tasks DB  │ <──── sync ────> │  ├─ Issues (CHE-*)   │
│  ├─ Project DB       │ <──── sync ────> │  ├─ Projects (10)    │
│  ├─ Knowledge Base   │                   │  ├─ Documents        │
│  ├─ Sprint Board     │     playbooks     │  ├─ Cycles           │
│  ├─ Inbox            │ <──── auto ────> │  └─ Initiatives      │
│  └─ Automations Log  │                   │                      │
└─────────────────────┘                   └─────────────────────┘
         │                                          │
         │              ┌─────────┐                 │
         └──────────────│  Devin  │─────────────────┘
                        │   MCP   │
                        │ Server  │
                        └─────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
         │ Sentry  │  │DeepWiki │  │Context7 │
         │ (25     │  │ (repo   │  │ (npm    │
         │  tools) │  │  docs)  │  │  docs)  │
         └─────────┘  └─────────┘  └─────────┘
```

---

## Workspace Discovery

### Notion Command Center

| Database | Collection ID | Properties |
|---|---|---|
| Master Task Database | `collection://36b960c9-572b-81e3-b3fc-000bf6eaf875` | Task, Status, Priority, Tags, Due Date, Assignee, Project, GitHub Repo |
| Project Database | `collection://36b960c9-572b-8141-871b-000ba1f0c1ee` | Name, Status, Timeline, Project Lead, Tasks, Knowledge Base Docs, Meeting Notes, Contacts |
| Knowledge Base & Inspiration | `collection://36b960c9-572b-815d-a479-000b42cee1b3` | Category, Name |
| Meeting Notes | `collection://36b960c9-572b-8198-ab3b-000b826aca0c` | — |
| Reading List | `collection://36b960c9-572b-8112-9e65-000b70aa97a9` | — |
| Habit Tracker | `collection://36b960c9-572b-818e-9979-000b9b0e25f8` | — |
| Daily Journal | `collection://36b960c9-572b-8124-a29f-000b61842d3f` | — |
| Contacts | `collection://36b960c9-572b-811c-9f6a-000bb2ca7844` | — |

**Key Pages:**
- [Command Center](https://www.notion.so/36b960c9572b8168b680db8523eb9119)
- [Dev Repo OS — All Repos Control Room](https://www.notion.so/36d960c9572b81ceba39ed9fbbc4074e)
- [Repository Registry](https://www.notion.so/7eb5d1805d3f4467be1257433acd3abd)
- [Sprint Board](https://www.notion.so/36b960c9572b8166bfc3c8eb50b6c206)
- [Dev Runbook](https://www.notion.so/36b960c9572b816c98fbd1ba4dd67898)
- [Automations Log](https://www.notion.so/36b960c9572b8162b112f3b7bc0890b2)
- [COMMANDER v1](https://www.notion.so/36b960c9572b81d39196e73cab78e97e)

### Linear Workspace (ChefSheesh)

| Project | Linear ID | Status |
|---|---|---|
| Pi Agent Platform | `ff6cf369-f2f5-4c86-882d-47f25315fd64` | Backlog |
| Hermes Platform | `98af9560-c288-49e6-85a8-f63618b9399b` | Backlog |
| Agent Skills & Quality | `708330cd-d3d7-4d65-a82f-69cd55a06fb7` | Backlog |
| RAG & Knowledge | `6ef44879-bd0f-4b04-a812-332cb1e107ed` | Backlog |
| Utrecht Data OS | `c0a06beb-db23-42c2-a85c-60d44fd769fe` | Backlog |
| UI & Web | `5aba4990-30c5-4503-b064-57910fce2bb3` | Backlog |
| DevOps & Config | `7659fe0b-19d9-4052-9ae4-962426eaf375` | Backlog |
| Agent Runtime | `e4ac1ac3-4e59-476d-afac-c345504d149e` | Backlog |
| api-gateway | `b193b186-ef7c-4689-83f8-f441882e46b8` | Backlog |

**Recent Issues (sample):**

| ID | Title | Project | Labels |
|---|---|---|---|
| CHE-65 | [Agent Spec] Hermes Terminal Runtime | Hermes Platform | agent, tui |
| CHE-64 | [Agent Spec] Pi Orchestrator Core | Pi Agent Platform | agent, automation |
| CHE-63 | [Agent Spec] Helios Memory Manager | Pi Agent Platform | agent, database |
| CHE-62 | [Agent Spec] Skill Quality Optimizer | Pi Agent Platform | agent, quality |

---

## Playbooks Created

Five Devin playbooks were created to standardize workflows:

### 1. `!notion-linear-sync` — Issue Sync

Syncs Linear issues to Notion Master Task Database and vice versa.

### 2. `!linear-triage` — Triage & Prioritize

Fetches unassigned/unprioritized Linear issues and helps triage them.

### 3. `!sprint-report` — Weekly Sprint Report

Generates a combined sprint report from both platforms.

### 4. `!project-doc-sync` — Project Documentation

Mirrors Linear project descriptions into Notion Project Database entries.

### 5. `!weekly-digest` — Automated Weekly Digest

Scheduled playbook that creates a weekly summary in Notion and Linear.

---

## Automated Workflows

### Sync Flow: Linear -> Notion

```text
1. linear.list_issues(team=ChefSheesh, state=in_progress)
2. For each issue:
   a. Map status/priority/labels to Notion schema
   b. notion.notion-create-pages(data_source_id=masterTasks, ...)
3. Log sync in Notion Automations Log page
```

### Sync Flow: Notion -> Linear

```text
1. notion.query_data_sources(masterTasks, WHERE Status='Not Started' AND Tags LIKE '%linear-sync%')
2. For each task:
   a. linear.save_issue(team=ChefSheesh, title=..., labels=[notion-sync])
   b. notion.update-page(pageUrl, append Linear issue link)
3. Log sync in Notion Automations Log page
```

### Sprint Report Generation

```text
1. linear.list_issues(team=ChefSheesh, state=completed, updatedAt=-P7D)
2. linear.list_issues(team=ChefSheesh, state=in_progress)
3. notion.query_data_sources(masterTasks, WHERE Status IN ('In Progress','Done'))
4. Merge + deduplicate by title/ID
5. linear.save_document(title="Sprint Report — Week of ...", project=...)
6. notion.notion-create-pages(knowledgeBase, title="Sprint Report — ...")
```

---

## MCP Capabilities Summary

See [CAPABILITIES.md](./CAPABILITIES.md) for the full tool-by-tool breakdown of all 6 MCP servers.

---

## Proposed Upgrades

### Immediate (no cost)

1. **Scheduled Sync**: Use `devin_schedule_manage` to run `!notion-linear-sync` every weekday at 09:00 UTC
2. **Webhook Bridge**: Create a Cloudflare Worker that receives Linear webhooks and triggers Devin sessions
3. **Notion Connected Database**: Link Linear as a connected source in Notion for real-time visibility
4. **Sentry Integration**: Auto-create Linear issues from Sentry alerts using `sentry.get_issue` + `linear.save_issue`

### Short-term (low cost)

5. **Custom Domain**: Set up `ops.onlinechefgroep.nl` on Cloudflare for the webhook bridge and dashboard
6. **Cloudflare Workers**: Deploy the sync logic as a Worker for sub-50ms response times
7. **D1 Database**: Use Cloudflare D1 to store sync state and deduplication hashes

### Medium-term (investment)

8. **AI-Powered Triage**: Use Claude/GPT to auto-categorize and prioritize new issues based on description
9. **Browserless Integration**: Once authenticated, use browserless MCP for automated UI testing of the Notion/Linear integration
10. **Knowledge Graph**: Use the `graphify` skill to build a knowledge graph connecting Notion pages, Linear issues, and GitHub PRs

---

## Files Added

| File | Purpose |
|---|---|
| `skills/notion-linear-bridge/SKILL.md` | Pi skill definition for the bridge workflow |
| `scripts/notion-linear-sync.ts` | TypeScript automation helpers with field mappings |
| `docs/notion-linear/README.md` | This report |
| `docs/notion-linear/CAPABILITIES.md` | Full MCP capabilities reference |
| `docs/notion-linear/examples/linear-issues.json` | Sample Linear issues data |
| `docs/notion-linear/examples/notion-structure.json` | Notion workspace structure |
| `docs/notion-linear/examples/mcp-calls.md` | Example MCP call sequences |

---

## Verification

- All files committed to `devin/1780078779-notion-linear-integration` branch
- No code changes to existing source files
- Playbooks created via Devin MCP API
- Notion summary page created in Command Center
- TypeScript files pass `npx tsc --noEmit` (type-check only, no runtime)
