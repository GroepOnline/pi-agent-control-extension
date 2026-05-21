import { describe, it, expect } from "vitest";
import { recipeFor, verifyCommitments } from "./recipes.ts";

describe("recipeFor", () => {
  it("returns the tuistory-launch recipe", () => {
    const result = recipeFor("tuistory-launch");
    expect(result).toContain("TCTL=./bin/tctl");
    expect(result).toContain("RUN_ID=$(date +%Y%m%d-%H%M%S)-demo");
    expect(result).toContain("--backend tuistory");
    expect(result).toContain("$TCTL launch");
    expect(result).toContain("$TCTL -s");
    expect(result).toContain("--cols 120 --rows 36");
  });

  it("returns the browser-loop recipe", () => {
    const result = recipeFor("browser-loop");
    expect(result).toContain("agent-browser open https://example.com --viewport 1280x720");
    expect(result).toContain("agent-browser wait --load networkidle");
    expect(result).toContain("agent-browser snapshot -i");
    expect(result).toContain("agent-browser click @e1");
    expect(result).toContain("agent-browser close");
  });

  it("returns the showcase-compose recipe", () => {
    const result = recipeFor("showcase-compose");
    expect(result).toContain("npm --prefix remotion install");
    expect(result).toContain("./scripts/render-showcase.sh");
    expect(result).toContain("showcase-props.json");
    expect(result).toContain("ffprobe");
    expect(result).toContain("showcase.mp4");
  });

  it("returns the qa-report recipe", () => {
    const result = recipeFor("qa-report");
    expect(result).toContain("# QA Report");
    expect(result).toContain("| Step | Expected | Observed | Result | Evidence |");
    expect(result).toContain("PASS/FAIL");
    expect(result).toContain("Conclusion");
  });

  it("returns known recipes list for unknown kind", () => {
    const result = recipeFor("nonexistent-recipe");
    expect(result).toContain("Known recipes:");
    expect(result).toContain("tuistory-launch");
    expect(result).toContain("browser-loop");
    expect(result).toContain("showcase-compose");
    expect(result).toContain("qa-report");
  });

  it("returns known recipes list for empty string", () => {
    const result = recipeFor("");
    expect(result).toContain("Known recipes:");
    expect(result).toContain("tuistory-launch");
  });

  it("returns known recipes list for arbitrary unexpected input", () => {
    const result = recipeFor("some-random-value-123");
    expect(result).toContain("Known recipes:");
    expect(result).not.toContain("TCTL=");
    expect(result).not.toContain("agent-browser open");
  });
});

describe("verifyCommitments", () => {
  it("returns all checks passing for fully compliant markdown", () => {
    const markdown = `## Technical Section
This is the technical overview.

## Commitments
We commit to delivering the following.

Evidence includes snapshots and screenshots.

All tests pass. ✓`;

    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(true);
    expect(result.failed).toHaveLength(0);
    expect(result.checks).toHaveLength(4);
    result.checks.forEach((check) => {
      expect(check.ok).toBe(true);
    });
  });

  it("detects missing technical section", () => {
    const markdown = `## Commitments
We commit to evidence and pass ✓`;

    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(false);
    expect(result.failed).toContain("has technical section");
  });

  it("detects missing commitments section", () => {
    const markdown = `## Technical
We have evidence of pass ✓`;

    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(false);
    expect(result.failed).toContain("has commitments section");
  });

  it("detects missing evidence mention", () => {
    const markdown = `## Technical
## Commitments
We have a pass/fail ✓`;

    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(false);
    expect(result.failed).toContain("mentions evidence");
  });

  it("detects missing pass/fail signal", () => {
    const markdown = `## Technical
## Commitments
Evidence: screenshots are attached.`;

    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(false);
    expect(result.failed).toContain("has pass/fail signal");
  });

  it("returns all checks failing for empty markdown", () => {
    const result = verifyCommitments("");
    expect(result.ok).toBe(false);
    expect(result.failed).toHaveLength(4);
    expect(result.checks.every((c) => !c.ok)).toBe(true);
  });

  it("recognizes checkbox-style pass/fail signals", () => {
    const markdown = `## Technical
## Commitments
Evidence: snapshot available.
[x] Task completed.`;

    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(true);
    expect(result.failed).toHaveLength(0);
  });

  it("recognizes unchecked checkbox as pass/fail signal", () => {
    const markdown = `## Technical
## Commitments
Evidence: cast recording.
[ ] Task pending.`;

    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(true);
    expect(result.failed).toHaveLength(0);
  });

  it("recognizes FAIL keyword as pass/fail signal", () => {
    const markdown = `## Technical
## Commitments
Evidence: screenshot.
Result: FAIL`;

    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(true);
    expect(result.failed).toHaveLength(0);
  });

  it("recognizes ✗ symbol as pass/fail signal", () => {
    const markdown = `## Technical
## Commitments
Evidence: mp4 video.
Test result: ✗`;

    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(true);
    expect(result.failed).toHaveLength(0);
  });

  it("recognizes mp4 as evidence", () => {
    const markdown = `## Technical
## Commitments
Showcase mp4 is attached.
PASS`;

    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(true);
    expect(result.failed).toHaveLength(0);
  });

  it("recognizes cast as evidence", () => {
    const markdown = `## Technical
## Commitments
Terminal cast recording.
✓`;

    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(true);
    expect(result.failed).toHaveLength(0);
  });

  it("returns deterministic results for same input", () => {
    const markdown = `## Technical\n## Commitments\nEvidence present.\nPASS`;
    const result1 = verifyCommitments(markdown);
    const result2 = verifyCommitments(markdown);
    expect(result1).toEqual(result2);
  });

  it("returns deterministic results for failing input", () => {
    const result1 = verifyCommitments("no match at all");
    const result2 = verifyCommitments("no match at all");
    expect(result1).toEqual(result2);
  });

  it("handles markdown with only whitespace", () => {
    const result = verifyCommitments("   \n  \t  ");
    expect(result.ok).toBe(false);
    expect(result.checks).toHaveLength(4);
  });

  it("exposes individual check names in checks array", () => {
    const result = verifyCommitments("Some text");
    const names = result.checks.map((c) => c.name);
    expect(names).toEqual([
      "has technical section",
      "has commitments section",
      "mentions evidence",
      "has pass/fail signal",
    ]);
  });
});
