---
name: notion-linear-bridge
description: Bidirectional sync and automation between Notion and Linear workspaces. Use when tasks, projects, or documentation need to flow between Notion databases and Linear issues/projects.
---
# Notion-Linear Bridge

Synchronize tasks, projects, and documentation between your Notion Command Center and Linear workspace using MCP integrations.

## Prerequisites

- Devin session with `notion` and `linear` MCP servers connected
- Notion workspace with "Command Center" structure (Master Task Database, Project Database)
- Linear workspace with team "ChefSheesh" (key: CHE)

## Capabilities

| Direction | What | How |
|---|---|---|
| Linear -> Notion | Sync issues to Master Task Database | `list_issues` -> `notion-create-pages` |
| Notion -> Linear | Create Linear issues from Notion tasks | `notion-search` -> `save_issue` |
| Bidirectional | Project status sync | `list_projects` + `query_data_sources` |
| Report | Sprint digest across both platforms | `list_issues` + `notion-search` -> document |

## Workflow: Linear Issues -> Notion Tasks

### Step 1: Fetch Linear issues

```text
Tool: linear.list_issues
Args: { "team": "ChefSheesh", "state": "in_progress", "limit": 50 }
```

### Step 2: Map fields to Notion schema

| Linear Field | Notion Property | Transform |
|---|---|---|
| `title` | `Task` (title) | Direct copy |
| `status` / `statusType` | `Status` | Map: triage->Not Started, started/in_progress->In Progress, completed->Done |
| `priority.name` | `Priority` | Direct: Urgent, High, Medium, Low |
| `labels[]` | `Tags` | Join as multi-select |
| `project` | `Project` (relation) | Match by name in Project Database |
| `dueDate` | `Due Date` | ISO-8601 date |
| `url` | `GitHub Repo` or description | Append as reference link |
| `assignee` | `Assignee` | Match Notion user by email |

### Step 3: Create Notion pages

```text
Tool: notion.notion-create-pages
Args: {
  "data_source_id": "collection://36b960c9-572b-81e3-b3fc-000bf6eaf875",
  "pages": [{
    "properties": {
      "Task": "Issue title from Linear",
      "Status": "In Progress",
      "Priority": "High",
      "Tags": "agent, automation",
      "date:Due Date:start": "2026-06-15"
    },
    "content": "Synced from Linear: [CHE-64](https://linear.app/...)\n\nDescription from Linear issue..."
  }]
}
```

## Workflow: Notion Tasks -> Linear Issues

### Step 1: Query Notion tasks without Linear link

```text
Tool: notion.query_data_sources
Args: {
  "data_source_id": "collection://36b960c9-572b-81e3-b3fc-000bf6eaf875",
  "query": "SELECT * FROM ... WHERE Status = 'Not Started' AND Tags LIKE '%linear-sync%'"
}
```

### Step 2: Create Linear issues

```text
Tool: linear.save_issue
Args: {
  "title": "Task title from Notion",
  "team": "ChefSheesh",
  "description": "Synced from Notion: [link]\n\nOriginal description...",
  "priority": 3,
  "labels": ["notion-sync"]
}
```

### Step 3: Update Notion page with Linear link

```text
Tool: notion.update-page
Args: {
  "pageUrl": "<notion-page-url>",
  "content": "... appended: Linear: CHE-XX"
}
```

## Workflow: Sprint Report Generation

### Step 1: Gather data from both platforms

```text
# Linear: completed issues this cycle
Tool: linear.list_issues
Args: { "team": "ChefSheesh", "state": "completed", "updatedAt": "-P7D" }

# Linear: in-progress issues
Tool: linear.list_issues
Args: { "team": "ChefSheesh", "state": "in_progress" }

# Notion: active tasks
Tool: notion.query_data_sources
Args: { "data_source_id": "collection://36b960c9-572b-81e3-b3fc-000bf6eaf875", "query": "SELECT * WHERE Status IN ('In Progress', 'Done') ORDER BY ... LIMIT 50" }
```

### Step 2: Generate report document

Create a Linear document or Notion page with:
- Completed items count and list
- In-progress items with assignees
- Blocked items
- Cross-platform discrepancies

```text
Tool: linear.save_document
Args: {
  "title": "Sprint Report — Week of 2026-05-26",
  "project": "Pi Agent Platform",
  "content": "## Completed\n- CHE-60: ...\n\n## In Progress\n- CHE-64: ...\n\n## Notion-Only Tasks\n- ..."
}
```

## Workflow: Project Documentation Sync

Sync Linear project descriptions and milestones to Notion Project Database:

```text
# Fetch Linear projects
Tool: linear.list_projects
Args: { "limit": 25 }

# For each project, create/update Notion Project Database entry
Tool: notion.notion-create-pages
Args: {
  "data_source_id": "collection://36b960c9-572b-8141-871b-000ba1f0c1ee",
  "pages": [{
    "properties": {
      "Name": "Pi Agent Platform",
      "Status": "Active"
    },
    "content": "## Linear Project\n[View in Linear](https://linear.app/...)\n\n### Summary\n...\n\n### Issues\n| ID | Title | Status |\n|...|...|...|\n"
  }]
}
```

## Field Mapping Reference

### Linear Status -> Notion Status

| Linear statusType | Notion Status |
|---|---|
| `backlog` | Not Started |
| `unstarted` | Not Started |
| `started` | In Progress |
| `completed` | Done |
| `canceled` | Archived |

### Linear Priority -> Notion Priority

| Linear priority.value | Notion Priority |
|---|---|
| 0 | No priority |
| 1 | Urgent |
| 2 | High |
| 3 | Medium |
| 4 | Low |

## Identifiers

- **Linear Team**: ChefSheesh (ID: `a9565850-0934-4a40-8787-53df9fddfc28`)
- **Notion Master Tasks**: `collection://36b960c9-572b-81e3-b3fc-000bf6eaf875`
- **Notion Projects**: `collection://36b960c9-572b-8141-871b-000ba1f0c1ee`
- **Notion Knowledge Base**: `collection://36b960c9-572b-815d-a479-000b42cee1b3`
- **Notion Command Center**: `https://www.notion.so/36b960c9572b8168b680db8523eb9119`

## Chaining

After sync operations, consider chaining:
- `review` skill to audit the sync results
- `agent-planner` to schedule recurring syncs
- `wiki` skill to update documentation with latest project state
