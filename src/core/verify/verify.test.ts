import { describe, it, expect } from "vitest";
import { recipeFor, verifyCommitments } from "./verify.ts";

describe("recipeFor", () => {
  it("returns the tuistory-launch recipe", () => {
    const recipe = recipeFor("tuistory-launch");
    expect(recipe).toContain("TCTL=./bin/tctl");
    expect(recipe).toContain("--backend tuistory");
  });

  it("returns the browser-loop recipe", () => {
    const recipe = recipeFor("browser-loop");
    expect(recipe).toContain("agent-browser open");
    expect(recipe).toContain("agent-browser wait --load networkidle");
  });

  it("returns the showcase-compose recipe", () => {
    const recipe = recipeFor("showcase-compose");
    expect(recipe).toContain("npm --prefix remotion install");
    expect(recipe).toContain("./scripts/render-showcase.sh");
  });

  it("returns the qa-report recipe", () => {
    const recipe = recipeFor("qa-report");
    expect(recipe).toContain("# QA Report");
    expect(recipe).toContain("| Step | Expected | Observed | Result | Evidence |");
  });

  it("returns the default known recipes list for unknown inputs", () => {
    const recipe = recipeFor("unknown-recipe-xyz");
    expect(recipe).toBe("Known recipes: tuistory-launch, browser-loop, showcase-compose, qa-report");
  });
});

describe("verifyCommitments", () => {
  it("returns ok for a document with all required sections", () => {
    const markdown = `
# Some Test PR

## Technical Details
Some technical implementation.

## Commitments
We commit to doing X.

## Evidence
Here is a snapshot of the result.

## Result
It is a PASS.
    `;
    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(true);
    expect(result.failed).toHaveLength(0);
  });

  it("fails if technical section is missing", () => {
    const markdown = `
## Commitments
We commit to doing X.

## Evidence
Here is a snapshot.

## Result
PASS.
    `;
    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(false);
    expect(result.failed).toContain("has technical section");
  });

  it("fails if commitments section is missing", () => {
    const markdown = `
## Technical
Some technical text.

## Evidence
Here is a snapshot.

## Result
PASS.
    `;
    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(false);
    expect(result.failed).toContain("has commitments section");
  });

  it("fails if evidence is missing", () => {
    const markdown = `
## Technical
Some technical text.

## Commitments
We commit to doing X.

## Result
PASS.
    `;
    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(false);
    expect(result.failed).toContain("mentions evidence");
  });

  it("fails if pass/fail signal is missing", () => {
    const markdown = `
## Technical
Some technical text.

## Commitments
We commit to doing X.

## Evidence
Here is a snapshot.
    `;
    const result = verifyCommitments(markdown);
    expect(result.ok).toBe(false);
    expect(result.failed).toContain("has pass/fail signal");
  });

  it("returns appropriate checks objects", () => {
    const markdown = "technical commitments";
    const result = verifyCommitments(markdown);
    expect(result.checks).toEqual([
      { name: "has technical section", ok: true },
      { name: "has commitments section", ok: true },
      { name: "mentions evidence", ok: false },
      { name: "has pass/fail signal", ok: false },
    ]);
  });
});
