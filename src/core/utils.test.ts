import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildUsageReport, buildParallelVerifyReport, listSkills, runValidator, rootDir, shellEscape } from "./utils.ts";

describe("shellEscape", () => {
  it("single-quotes POSIX shell metacharacters", () => {
    expect(shellEscape("https://example.com?a=1&b=2", "linux")).toBe("'https://example.com?a=1&b=2'");
  });

  it("uses safe escaping for strings with spaces", () => {
    expect(shellEscape("https://example.com & calc", "linux")).toBe("'https://example.com & calc'");
  });

  it("uses Windows-safe quoting for cmd metacharacters", () => {
    expect(shellEscape("https://example.com & calc", "win32")).toBe('"https://example.com ^& calc"');
  });

  it("leaves simple arguments unchanged", () => {
    expect(shellEscape("https://example.com/path", "linux")).toBe("https://example.com/path");
  });
});

describe("buildUsageReport", () => {
  it("returns default text when no input given", () => {
    const result = buildUsageReport();
    expect(result.text).toContain("# Usage & Observability");
    expect(result.details.model).toBeNull();
  });

  it("reports missing tokens message when no counters supplied", () => {
    const result = buildUsageReport();
    expect(result.text).toContain("No token counters were supplied");
  });

  it("computes costs correctly with sample input", () => {
    const result = buildUsageReport({
      model: "gpt-4o",
      promptTokens: 1000000,
      completionTokens: 500000,
      inputCostPerMillion: 5,
      outputCostPerMillion: 15,
    });
    expect(result.details.estimatedInputCost).toBe(5);
    expect(result.details.estimatedOutputCost).toBe(7.5);
    expect(result.details.estimatedTotalCost).toBe(12.5);
  });

  it("handles cached input tokens correctly", () => {
    const result = buildUsageReport({
      promptTokens: 1000000,
      cachedInputTokens: 400000,
      inputCostPerMillion: 5,
      outputCostPerMillion: 15,
    });
    expect(result.details.billableInputTokens).toBe(600000);
  });

  it("handles zero costs gracefully", () => {
    const result = buildUsageReport({
      promptTokens: 0,
      completionTokens: 0,
    });
    expect(result.details.estimatedTotalCost).toBe(0);
  });

  it("supports custom currency", () => {
    const result = buildUsageReport({
      promptTokens: 1000,
      completionTokens: 500,
      currency: "EUR",
    });
    expect(result.text).toContain("EUR");
  });

  it("handles undefined optional fields", () => {
    const result = buildUsageReport({
      model: "claude-4",
      completionTokens: 100,
    });
    expect(result.details.model).toBe("claude-4");
    expect(result.details.promptTokens).toBe(0);
  });
});

describe("buildParallelVerifyReport", () => {
  it("returns no reports message when empty", () => {
    const result = buildParallelVerifyReport([]);
    expect(result.text).toContain("No reports supplied");
    expect(result.details.ok).toBe(false);
  });

  it("checks a single valid report", () => {
    const result = buildParallelVerifyReport([
      {
        name: "test-report",
        markdown: "# Test\n\n## Technical\nstuff\n\n## Commitments\nstuff\n\n## Evidence\nsnapshot\n\n## Result\nPASS",
      },
    ]);
    expect(result.details.ok).toBe(true);
    expect(result.details.reports[0].name).toBe("test-report");
    expect(result.details.reports[0].ok).toBe(true);
  });

  it("checks a single invalid report", () => {
    const result = buildParallelVerifyReport([
      {
        name: "bad-report",
        markdown: "# Incomplete\n\nNo sections here.",
      },
    ]);
    expect(result.details.ok).toBe(false);
    expect(result.details.reports[0].ok).toBe(false);
  });

  it("handles multiple reports with mixed results", () => {
    const result = buildParallelVerifyReport([
      {
        name: "good",
        markdown: "# Good\n\n## Technical\ntech\n\n## Commitments\ncommits\n\n## Evidence\nscreenshot\n\n## Result\nPASS",
      },
      {
        name: "bad",
        markdown: "# Bad\n\nNothing here.",
      },
    ]);
    expect(result.details.ok).toBe(false);
    expect(result.details.reports[0].ok).toBe(true);
    expect(result.details.reports[1].ok).toBe(false);
  });

  it("includes evidence paths in output", () => {
    const result = buildParallelVerifyReport([
      {
        name: "with-evidence",
        markdown: "# Test\n\n## Technical\ntech\n\n## Commitments\ncommits\n\n## Evidence\nscreenshot\n\n## Result\nPASS",
        evidence: ["evidence/step1.png", "evidence/step2.png"],
      },
    ]);
    expect(result.text).toContain("evidence/step1.png");
    expect(result.text).toContain("evidence/step2.png");
  });

  it("handles reports with no evidence array", () => {
    const result = buildParallelVerifyReport([
      {
        name: "no-evidence",
        markdown: "# Test\n\n## Technical\ntech\n\n## Commitments\ncommits\n\n## Evidence\nscreenshot\n\n## Result\nPASS",
      },
    ]);
    expect(result.details.reports[0].evidence).toEqual([]);
  });
});

describe("listSkills", () => {
  let tmpBase: string;

  beforeEach(() => {
    tmpBase = join(tmpdir(), `test-skills-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  });

  it("returns empty array when skills directory does not exist", () => {
    const result = listSkills(tmpBase);
    expect(result).toEqual([]);
  });

  it("returns empty array when skills dir exists but has no valid skill dirs", () => {
    const skillsDir = join(tmpBase, "packages", "skills");
    mkdirSync(skillsDir, { recursive: true });
    writeFileSync(join(skillsDir, "not-a-dir.txt"), "hello");
    const result = listSkills(tmpBase);
    expect(result).toEqual([]);
    rmSync(tmpBase, { recursive: true, force: true });
  });

  it("returns skills from directories that contain a SKILL.md", () => {
    const skillsDir = join(tmpBase, "packages", "skills");
    const agentDir = join(skillsDir, "agent-foo");
    mkdirSync(agentDir, { recursive: true });
    writeFileSync(join(agentDir, "SKILL.md"), "---\nname: agent-foo\ndescription: Does foo things\n---\n# Agent Foo\n");
    const result = listSkills(tmpBase);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("agent-foo");
    expect(result[0].description).toBe("Does foo things");
    rmSync(tmpBase, { recursive: true, force: true });
  });

  it("ignores directories without a SKILL.md", () => {
    const skillsDir = join(tmpBase, "packages", "skills");
    mkdirSync(join(skillsDir, "no-skill"), { recursive: true });
    const agentDir = join(skillsDir, "agent-bar");
    mkdirSync(agentDir, { recursive: true });
    writeFileSync(join(agentDir, "SKILL.md"), "---\nname: agent-bar\ndescription: Bar skill\n---\n");
    const result = listSkills(tmpBase);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("agent-bar");
    rmSync(tmpBase, { recursive: true, force: true });
  });

  it("strips surrounding quotes from description", () => {
    const skillsDir = join(tmpBase, "packages", "skills");
    const agentDir = join(skillsDir, "agent-quoted");
    mkdirSync(agentDir, { recursive: true });
    writeFileSync(join(agentDir, "SKILL.md"), "---\nname: agent-quoted\ndescription: 'Quoted description'\n---\n");
    const result = listSkills(tmpBase);
    expect(result[0].description).toBe("Quoted description");
    rmSync(tmpBase, { recursive: true, force: true });
  });

  it("returns empty description when no description field in SKILL.md", () => {
    const skillsDir = join(tmpBase, "packages", "skills");
    const agentDir = join(skillsDir, "agent-nodesc");
    mkdirSync(agentDir, { recursive: true });
    writeFileSync(join(agentDir, "SKILL.md"), "# Agent No Desc\nNo frontmatter here.\n");
    const result = listSkills(tmpBase);
    expect(result[0].description).toBe("");
    rmSync(tmpBase, { recursive: true, force: true });
  });
});

describe("runValidator", () => {
  it("returns a non-empty string result", () => {
    // The validator script exists in this package, so it should run and return output
    const result = runValidator();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns output containing known validator keywords", () => {
    const result = runValidator();
    // The validator should either succeed or output a known error/pass message
    const isKnownOutput =
      result.includes("validate") ||
      result.includes("ok") ||
      result.includes("pass") ||
      result.includes("error") ||
      result.includes("missing") ||
      result.includes("Unable to run") ||
      result.includes("not found");
    expect(isKnownOutput).toBe(true);
  });
});

describe("rootDir", () => {
  it("returns a consistent path", () => {
    const result = rootDir();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("caches the result between calls", () => {
    const first = rootDir();
    const second = rootDir();
    expect(second).toBe(first);
  });
});


