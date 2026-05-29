# MCP Call Examples

> Live examples executed during the integration session on 2026-05-29.

---

## 1. Linear: List Issues

```json
// Tool: linear.list_issues
// Args:
{
  "team": "ChefSheesh",
  "limit": 15
}

// Response (abbreviated):
{
  "issues": [
    {
      "id": "CHE-65",
      "title": "[Agent Spec] Hermes Terminal Runtime",
      "status": "Backlog",
      "statusType": "backlog",
      "priority": { "value": 0, "name": "No priority" },
      "labels": ["agent", "tui"],
      "project": "Hermes Platform",
      "team": "ChefSheesh",
      "url": "https://linear.app/chefclawsheesh/issue/CHE-65/..."
    },
    {
      "id": "CHE-64",
      "title": "[Agent Spec] Pi Orchestrator Core",
      "labels": ["agent", "automation"],
      "project": "Pi Agent Platform"
    }
    // ... 13 more issues
  ]
}
```

---

## 2. Linear: List Projects

```json
// Tool: linear.list_projects
// Args:
{
  "limit": 10
}

// Response (abbreviated):
{
  "projects": [
    {
      "name": "api-gateway",
      "id": "b193b186-ef7c-4689-83f8-f441882e46b8",
      "description": "API Gateway service for routing and managing API traffic",
      "status": { "name": "Backlog", "type": "backlog" },
      "teams": [{ "name": "ChefSheesh", "key": "CHE" }]
    },
    {
      "name": "Agent Runtime",
      "id": "e4ac1ac3-4e59-476d-afac-c345504d149e",
      "description": "Core agent runtime engine"
    },
    {
      "name": "Hermes Platform",
      "id": "98af9560-c288-49e6-85a8-f63618b9399b"
    },
    {
      "name": "Pi Agent Platform",
      "id": "ff6cf369-f2f5-4c86-882d-47f25315fd64"
    }
    // ... 5 more projects
  ]
}
```

---

## 3. Notion: Search Workspace

```json
// Tool: notion.notion-search
// Args:
{
  "query": "project tasks",
  "query_type": "internal",
  "page_size": 10
}

// Response: Returns results from both Notion pages AND connected sources (GitHub)
{
  "type": "ai_search",
  "results": [
    {
      "id": "github://...",
      "title": "TASKS.md",
      "type": "github",
      "highlight": "# Tasks -- Pi Helios Memory Extension..."
    },
    {
      "id": "36d960c9-572b-8135-a02c-f1ed8ef34b77",
      "title": "Inventory: data-layer",
      "type": "page",
      "highlight": "# Database Deep-Dive..."
    }
  ]
}
```

---

## 4. Notion: Fetch Command Center Page

```json
// Tool: notion.notion-fetch
// Args:
{
  "id": "36b960c9572b8168b680db8523eb9119"
}

// Response (key structure):
{
  "title": "Command Center \ud83d\ude80",
  "databases": [
    { "name": "Master Task Database", "dataSourceUrl": "collection://36b960c9-572b-81e3-..." },
    { "name": "Project Database", "dataSourceUrl": "collection://36b960c9-572b-8141-..." },
    { "name": "Knowledge Base & Inspiration", "dataSourceUrl": "collection://36b960c9-572b-815d-..." },
    { "name": "Reading List" },
    { "name": "Meeting Notes" },
    { "name": "Habit Tracker" },
    { "name": "Daily Journal" },
    { "name": "Contacts" }
  ],
  "pages": [
    "Inbox", "Sprint Board", "Doelen en OKRs 2026",
    "Dev Runbook", "COMMANDER v1", "Automations Log"
  ]
}
```

---

## 5. Notion: Fetch Master Task Database Schema

```json
// Tool: notion.notion-fetch
// Args:
{
  "id": "collection://36b960c9-572b-81e3-b3fc-000bf6eaf875"
}

// Response (schema):
{
  "name": "Master Task Database",
  "schema": {
    "Task": { "type": "title" },
    "Status": {
      "type": "select",
      "options": ["Not Started", "In Progress", "Done", "Archived"]
    },
    "Priority": {
      "type": "select",
      "options": ["Urgent", "High", "Medium", "Low"]
    },
    "Tags": { "type": "multi_select" },
    "Due Date": { "type": "date" },
    "Assignee": { "type": "person" },
    "Project": { "type": "relation", "relatedTo": "Project Database" },
    "GitHub Repo": {
      "type": "select",
      "options": [
        "OnlineChefGroep/pi-agent-control-extension",
        "OnlineChefGroep/Pi-Helios-Memory-Private",
        "OnlineChefGroep/pi-agent-orchestrator",
        "OnlineChefGroep/agent-skill-quality",
        "OnlineChefGroep/hermes-agent-platform",
        "OnlineChefGroep/utrecht-data-os",
        "..."
      ]
    }
  }
}
```

---

## 6. Notion: Create Task from Linear Issue

```json
// Tool: notion.notion-create-pages
// Args:
{
  "data_source_id": "collection://36b960c9-572b-81e3-b3fc-000bf6eaf875",
  "pages": [
    {
      "properties": {
        "Task": "[Agent Spec] Pi Orchestrator Core",
        "Status": "Not Started",
        "Priority": "Medium",
        "Tags": "agent, automation, linear-sync",
        "GitHub Repo": "OnlineChefGroep/pi-agent-orchestrator"
      },
      "content": "> Synced from Linear: [CHE-64](https://linear.app/chefclawsheesh/issue/CHE-64/agent-spec-pi-orchestrator-core)\n\nYou are **Pi Orchestrator**, the central nervous system of the agent swarm...\n\n---\n**Project**: Pi Agent Platform\n**Status**: Backlog\n**Labels**: agent, automation"
    }
  ]
}
```

---

## 7. Linear: Create Issue from Notion Task

```json
// Tool: linear.save_issue
// Args:
{
  "title": "Review Command Center v3.0 Design System",
  "team": "ChefSheesh",
  "description": "Synced from Notion: [Command Center](https://www.notion.so/36b960c9572b8168b680db8523eb9119)\n\nReview and implement the Figma-style design system documented in the Command Center.\n\nComponents: Glass cards, metric tiles, sidebar nav, data tables, status badges.",
  "priority": 3,
  "labels": ["notion-sync", "design"],
  "project": "UI & Web"
}
```

---

## 8. Linear: Create Sprint Report Document

```json
// Tool: linear.save_document
// Args:
{
  "title": "Sprint Report \u2014 Week of 2026-05-26",
  "project": "Pi Agent Platform",
  "content": "# Sprint Report \u2014 Week of 2026-05-26\n\n## Completed\n- CHE-60: Agent Runtime bootstrap\n- CHE-58: Memory store migration\n\n## In Progress\n- CHE-64: Pi Orchestrator Core spec\n- CHE-63: Helios Memory Manager spec\n- CHE-65: Hermes Terminal Runtime spec\n\n## Blocked\n_None_\n\n## Notion-Only Tasks\n- Review Command Center v3.0 design\n- Update Dev Runbook with MCP procedures\n\n---\nGenerated: 2026-05-29T18:16:00Z by Devin Notion-Linear Bridge"
}
```

---

## 9. Sentry: Find Organizations

```json
// Tool: sentry.find_organizations
// Args: {}

// Use case: Discover Sentry org slug to enable error -> issue pipeline
```

---

## 10. DeepWiki: Ask About Repository

```json
// Tool: deepwiki.ask_question
// Args:
{
  "repoName": "OnlineChefGroep/pi-agent-control-extension",
  "question": "What skills are available and how does routing work?"
}

// Use case: Generate context-rich Linear issue descriptions from repo knowledge
```

---

## 11. Devin: Create Scheduled Sync

```json
// Tool: devin_mcp.devin_schedule_manage
// Args:
{
  "action": "create",
  "name": "Notion-Linear Daily Sync",
  "prompt": "Run the !notion-linear-sync playbook to sync all in-progress Linear issues to Notion Master Task Database and vice versa.",
  "frequency": "0 9 * * 1-5",
  "notify_on": "failure"
}
```

---

## 12. Devin: Create Playbook

```json
// Tool: devin_mcp.devin_playbook_manage
// Args:
{
  "action": "create",
  "title": "Notion-Linear Sync",
  "macro": "!notion-linear-sync",
  "content": "## Steps\n1. Fetch all in-progress Linear issues...\n2. Map to Notion schema...\n3. Create/update Notion pages...\n4. Fetch Notion tasks tagged 'linear-sync'...\n5. Create Linear issues...\n6. Report summary"
}
```
