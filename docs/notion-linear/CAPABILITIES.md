# MCP Integration Capabilities Reference

> Full inventory of all MCP servers and tools available in the Devin + OnlineChefGroep environment.

---

## 1. Linear MCP Server

**Status**: Connected | **Team**: ChefSheesh (CHE)

### Issue Management

| Tool | Description | Key Args |
|---|---|---|
| `list_issues` | List/search issues | team, state, assignee, project, priority, label, query |
| `get_issue` | Get issue details + relations | id, includeRelations |
| `save_issue` | Create or update an issue | title, team, description, priority, labels, assignee, project |
| `delete_issue` | Delete (trash) an issue | id |

### Project Management

| Tool | Description | Key Args |
|---|---|---|
| `list_projects` | List all projects | limit, team, state |
| `get_project` | Get project details | id |
| `save_project` | Create/update project | name, description, team, priority, lead |

### Documents

| Tool | Description | Key Args |
|---|---|---|
| `list_documents` | List workspace documents | query, projectId, limit |
| `get_document` | Retrieve document content | id |
| `save_document` | Create/update document | title, content, project, issue, initiative |

### Comments

| Tool | Description | Key Args |
|---|---|---|
| `list_comments` | List comments on any entity | issueId, projectId, documentId |
| `save_comment` | Create/reply to comments | body, issueId, parentId |
| `delete_comment` | Delete a comment | id |

### Organization

| Tool | Description | Key Args |
|---|---|---|
| `list_cycles` | Get team cycles | teamId, type (current/previous/next) |
| `list_initiatives` | List initiatives | limit |
| `get_team` | Get team details | id |
| `list_milestones` | List project milestones | projectId |

### Attachments

| Tool | Description | Key Args |
|---|---|---|
| `prepare_attachment_upload` | Get signed upload URL | issue, filename, contentType, size |
| `create_attachment_from_upload` | Link uploaded file | issue, assetUrl, title |
| `get_attachment` | Retrieve attachment | id |
| `delete_attachment` | Remove attachment | id |

### Media

| Tool | Description | Key Args |
|---|---|---|
| `extract_images` | Extract images from markdown | markdown |


---

## 2. Notion MCP Server

**Status**: Connected | **Workspace**: Command Center

### Search & Discovery

| Tool | Description | Key Args |
|---|---|---|
| `notion-search` | Semantic search across workspace + connected sources | query, query_type (internal/user), filters, data_source_url |
| `notion-fetch` | Retrieve page/database/data-source content | id (URL or UUID) |

### Page Management

| Tool | Description | Key Args |
|---|---|---|
| `notion-create-pages` | Create one or more pages | data_source_id, pages[{properties, content}] |
| `notion-update-page` | Update page properties/content | pageUrl, properties, content |
| `notion-move-page` | Move page to new parent | pageUrl, newParent |
| `notion-duplicate-page` | Duplicate a page | pageUrl |
| `notion-delete-and-restore-page` | Trash or restore a page | pageUrl, action |

### Database Management

| Tool | Description | Key Args |
|---|---|---|
| `notion-create-database` | Create a new database | parentPageUrl, title, schema |
| `notion-update-database` | Update database properties | databaseUrl, schema |
| `notion-update-data-source` | Update data source schema | data_source_id, schema |
| `notion-query-data-sources` | SQL-like query over a data source | data_source_id, query |

### Comments

| Tool | Description | Key Args |
|---|---|---|
| `notion-get-comments` | Get page/inline comments | pageUrl |
| `notion-add-comment` | Add a discussion comment | pageUrl, body |

### Resources

| Tool | Description |
|---|---|
| `notion://docs/enhanced-markdown-spec` | Full Notion Markdown specification (fetch via MCP resource) |

---

## 3. Sentry MCP Server

**Status**: Connected (25 tools)

### Key Tools

| Tool | Description |
|---|---|
| `whoami` | Get authenticated user info |
| `find_organizations` | List accessible orgs |
| `find_projects` | List projects in an org |
| `find_releases` | Find releases and deployments |
| `get_sentry_issue` | Get issue details + full stacktrace |
| `search_issues` | Search issues with Sentry query syntax |
| `update_issue` | Update issue status/assignment |
| `list_issue_events` | Get issue event details |
| `get_event` | Get specific event data |
| `list_tags` | List issue tags |
| `list_tag_values` | Get tag value distribution |
| `find_alert_rules` | List alert configurations |
| `create_alert_rule` | Create new alerts |
| `list_uptime_alerts` | Get uptime monitoring alerts |

**Use Case**: Auto-create Linear issues from Sentry errors:

```javascript
sentry.search_issues(org, project, query="is:unresolved")
  → linear.save_issue(title="[Sentry] Error: ...", labels=["bug", "sentry"])
```

---

## 4. DeepWiki MCP Server

**Status**: Connected (3 tools)

| Tool | Description |
|---|---|
| `read_wiki_structure` | Get documentation topic list for a repo |
| `read_wiki_contents` | View full documentation for a repo |
| `ask_question` | AI-powered Q&A about repo code |

**Use Case**: Generate context for Linear issues from repo documentation:

```javascript
deepwiki.ask_question(repo="OnlineChefGroep/pi-agent-control-extension", question="How does routing work?")
  → linear.save_comment(issueId="CHE-64", body="Context from DeepWiki: ...")
```

---

## 5. Context7 MCP Server

**Status**: Connected (2 tools)

| Tool | Description |
|---|---|
| `resolve-library-id` | Find Context7-compatible library ID for npm packages |
| `query-docs` | Query up-to-date docs for any npm library |

**Use Case**: Research npm dependencies for issues:

```javascript
context7.resolve-library-id(query="vitest testing", libraryName="vitest")
  → context7.query-docs(libraryId="/vitest-dev/vitest", query="how to mock MCP calls")
```

---

## 6. Browserless MCP Server

**Status**: Not Connected (401 Unauthorized)

**Available when authenticated**:
- Web scraping and crawling
- Lighthouse performance audits
- Screenshot capture
- Custom Puppeteer code execution

**Recommended action**: Set up browserless API key to enable automated UI testing.

---

## 7. Devin MCP Server

**Status**: Connected (internal)

### Session Management

| Tool | Description |
|---|---|
| `devin_session_create` | Spawn child Devin sessions |
| `devin_session_interact` | Message/monitor sessions |

### Playbook Management

| Tool | Description |
|---|---|
| `devin_playbook_manage` | CRUD for reusable playbooks |

### Knowledge Management

| Tool | Description |
|---|---|
| `devin_knowledge_manage` | CRUD for knowledge notes |

### Scheduling

| Tool | Description |
|---|---|
| `devin_schedule_manage` | Create cron/one-time scheduled sessions |

### Repository Intelligence

| Tool | Description |
|---|---|
| `read_wiki_structure` | Get repo documentation topics |
| `read_wiki_contents` | View repo documentation |
| `ask_question` | AI Q&A about repositories |
| `list_available_repos` | List accessible repositories |

---

## Cross-Platform Workflow Examples

### Example 1: Sentry Error → Linear Issue → Notion Task

```text
1. sentry.search_issues(org, project, "is:unresolved level:error")
2. linear.save_issue(title="[Bug] ...", team="ChefSheesh", labels=["bug","sentry"])
3. notion.notion-create-pages(masterTasks, {Task: "[Bug] ...", Status: "Not Started", Priority: "High"})
```

### Example 2: GitHub PR → Linear Update → Notion Log

```text
1. deepwiki.ask_question(repo, "What changed in PR #20?")
2. linear.save_comment(issueId="CHE-64", body="PR #20 merged: ...")
3. notion.notion-update-page(automationsLog, append="PR #20 merged for CHE-64")
```

### Example 3: Weekly Digest Automation

```text
1. linear.list_issues(team="ChefSheesh", state="completed", updatedAt="-P7D")
2. linear.list_issues(team="ChefSheesh", state="in_progress")
3. notion.notion-search(query="sprint tasks", query_type="internal")
4. Compile digest → linear.save_document(...) + notion.notion-create-pages(knowledgeBase, ...)
```
