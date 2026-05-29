/**
 * notion-linear-sync.ts
 *
 * Automation helpers for Notion <-> Linear synchronization.
 * Designed to be invoked by Devin sessions or scheduled playbooks
 * via MCP tool calls. This file documents the exact MCP call
 * sequences and provides field-mapping logic.
 *
 * Usage (within a Devin session or Pi agent):
 *   The functions below are reference implementations showing the
 *   MCP tool call payloads. Execute them via the linear and notion
 *   MCP servers.
 */

// ── Field Mapping ──────────────────────────────────────────────

interface LinearIssue {
  id: string;
  title: string;
  description: string;
  status: string;
  statusType: string;
  priority: { value: number; name: string };
  labels: string[];
  url: string;
  dueDate: string | null;
  project: string | null;
  projectId: string | null;
  team: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}

interface NotionTaskProperties {
  Task: string;
  Status: string;
  Priority: string;
  Tags: string;
  "date:Due Date:start"?: string;
  "GitHub Repo"?: string;
}

const LINEAR_STATUS_MAP: Record<string, string> = {
  backlog: "Not Started",
  unstarted: "Not Started",
  started: "In Progress",
  completed: "Done",
  canceled: "Archived",
};

const LINEAR_PRIORITY_MAP: Record<number, string> = {
  0: "No priority",
  1: "Urgent",
  2: "High",
  3: "Medium",
  4: "Low",
};

// ── Notion Collection IDs ──────────────────────────────────────

const NOTION_COLLECTIONS = {
  masterTasks: "collection://36b960c9-572b-81e3-b3fc-000bf6eaf875",
  projects: "collection://36b960c9-572b-8141-871b-000ba1f0c1ee",
  knowledgeBase: "collection://36b960c9-572b-815d-a479-000b42cee1b3",
  meetingNotes: "collection://36b960c9-572b-8198-ab3b-000b826aca0c",
  readingList: "collection://36b960c9-572b-8112-9e65-000b70aa97a9",
  habitTracker: "collection://36b960c9-572b-818e-9979-000b9b0e25f8",
  dailyJournal: "collection://36b960c9-572b-8124-a29f-000b61842d3f",
  contacts: "collection://36b960c9-572b-811c-9f6a-000bb2ca7844",
} as const;

const NOTION_PAGES = {
  commandCenter: "36b960c9572b8168b680db8523eb9119",
  inbox: "36b960c9572b81d1bbf0c7cd30ea6b1f",
  sprintBoard: "36b960c9572b8166bfc3c8eb50b6c206",
  devRunbook: "36b960c9572b816c98fbd1ba4dd67898",
  automationsLog: "36b960c9572b8162b112f3b7bc0890b2",
  commander: "36b960c9572b81d39196e73cab78e97e",
} as const;

// ── Linear Workspace IDs ───────────────────────────────────────

const LINEAR_IDS = {
  team: { id: "a9565850-0934-4a40-8787-53df9fddfc28", name: "ChefSheesh", key: "CHE" },
  projects: {
    piAgentPlatform: "ff6cf369-f2f5-4c86-882d-47f25315fd64",
    hermesPlatform: "98af9560-c288-49e6-85a8-f63618b9399b",
    agentSkillsQuality: "708330cd-d3d7-4d65-a82f-69cd55a06fb7",
    ragKnowledge: "6ef44879-bd0f-4b04-a812-332cb1e107ed",
    utrechtDataOS: "c0a06beb-db23-42c2-a85c-60d44fd769fe",
    uiWeb: "5aba4990-30c5-4503-b064-57910fce2bb3",
    devOpsConfig: "7659fe0b-19d9-4052-9ae4-962426eaf375",
    agentRuntime: "e4ac1ac3-4e59-476d-afac-c345504d149e",
    apiGateway: "b193b186-ef7c-4689-83f8-f441882e46b8",
  },
} as const;

// ── Transform Functions ────────────────────────────────────────

function linearIssueToNotionTask(issue: LinearIssue): NotionTaskProperties {
  const props: NotionTaskProperties = {
    Task: issue.title,
    Status: LINEAR_STATUS_MAP[issue.statusType] ?? "Not Started",
    Priority: LINEAR_PRIORITY_MAP[issue.priority.value] ?? "No priority",
    Tags: issue.labels.join(", "),
  };
  if (issue.dueDate) {
    props["date:Due Date:start"] = issue.dueDate;
  }
  return props;
}

function linearIssueToNotionContent(issue: LinearIssue): string {
  const lines = [
    `> Synced from Linear: [${issue.id}](${issue.url})`,
    "",
    issue.description ? issue.description.slice(0, 2000) : "_No description_",
    "",
    "---",
    `**Project**: ${issue.project ?? "None"}`,
    `**Status**: ${issue.status} (${issue.statusType})`,
    `**Priority**: ${issue.priority.name}`,
    `**Labels**: ${issue.labels.join(", ") || "None"}`,
    `**Created**: ${issue.createdAt}`,
    `**Updated**: ${issue.updatedAt}`,
  ];
  return lines.join("\n");
}

// ── MCP Call Builders ──────────────────────────────────────────

/**
 * Build the MCP call payload to fetch Linear issues for sync.
 */
function buildLinearFetchCall(options: {
  state?: string;
  updatedAfter?: string;
  limit?: number;
}) {
  return {
    server: "linear",
    tool: "list_issues",
    args: {
      team: "ChefSheesh",
      state: options.state ?? "in_progress",
      updatedAt: options.updatedAfter,
      limit: options.limit ?? 50,
    },
  };
}

/**
 * Build the MCP call payload to create Notion pages from Linear issues.
 */
function buildNotionCreateCall(issues: LinearIssue[]) {
  return {
    server: "notion",
    tool: "notion-create-pages",
    args: {
      data_source_id: NOTION_COLLECTIONS.masterTasks,
      pages: issues.map((issue) => ({
        properties: linearIssueToNotionTask(issue),
        content: linearIssueToNotionContent(issue),
      })),
    },
  };
}

/**
 * Build the MCP call payload to create a Linear issue from a Notion task.
 */
function buildLinearCreateCall(task: {
  title: string;
  description: string;
  priority?: number;
  labels?: string[];
  notionUrl?: string;
}) {
  return {
    server: "linear",
    tool: "save_issue",
    args: {
      title: task.title,
      team: "ChefSheesh",
      description: [
        task.description,
        "",
        task.notionUrl ? `> Synced from Notion: [View in Notion](${task.notionUrl})` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      priority: task.priority ?? 3,
      labels: [...(task.labels ?? []), "notion-sync"],
    },
  };
}

/**
 * Build the MCP call payload for a sprint report document.
 */
function buildSprintReportCall(report: {
  title: string;
  project: string;
  completed: Array<{ id: string; title: string }>;
  inProgress: Array<{ id: string; title: string }>;
  notionOnly: Array<{ title: string; url: string }>;
}) {
  const completedList = report.completed
    .map((i) => `- [${i.id}] ${i.title}`)
    .join("\n");
  const inProgressList = report.inProgress
    .map((i) => `- [${i.id}] ${i.title}`)
    .join("\n");
  const notionList = report.notionOnly
    .map((t) => `- [${t.title}](${t.url})`)
    .join("\n");

  return {
    server: "linear",
    tool: "save_document",
    args: {
      title: report.title,
      project: report.project,
      content: [
        `# ${report.title}`,
        "",
        "## Completed",
        completedList || "_None_",
        "",
        "## In Progress",
        inProgressList || "_None_",
        "",
        "## Notion-Only Tasks",
        notionList || "_None_",
        "",
        `---`,
        `Generated: ${new Date().toISOString()}`,
      ].join("\n"),
    },
  };
}

// ── Exports ────────────────────────────────────────────────────

export {
  NOTION_COLLECTIONS,
  NOTION_PAGES,
  LINEAR_IDS,
  LINEAR_STATUS_MAP,
  LINEAR_PRIORITY_MAP,
  linearIssueToNotionTask,
  linearIssueToNotionContent,
  buildLinearFetchCall,
  buildNotionCreateCall,
  buildLinearCreateCall,
  buildSprintReportCall,
};
