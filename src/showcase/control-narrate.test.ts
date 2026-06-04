import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { generateNarratorProps } from "./control-narrate.ts";

describe("generateNarratorProps", () => {
  const testDir = join(process.cwd(), "artifacts", "test-narrate-run");

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    try {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // ignore
    }
  });

  it("fails if verification.md does not exist", () => {
    expect(() => generateNarratorProps(testDir)).toThrow("No verification.md found");
  });

  it("correctly generates props from standard verification.md", () => {
    const mdContent = `
# Title
## Commitment checks
### 1. Launch Skill Studio
We executed the studio.
It used tuistory and took a snapshot of the terminal.
`;
    writeFileSync(join(testDir, "verification.md"), mdContent);
    const props = generateNarratorProps(testDir);

    expect(props.version).toBe("0.1-control-narrate");
    expect(props.runId).toBe("test-narrate-run");
    expect(props.preset).toBe("pi-hero"); // high visual (tuistory/snapshot)
    expect(props.effects).toContain("keystroke-pills");
    expect(props.effects).toContain("spotlight");
    expect(props.chapters).toHaveLength(1);
    expect(props.chapters[0].title).toBe("Launch Skill Studio (tuistory)");
  });

  it("handles structured report preset if no visuals exist", () => {
    const mdContent = `
# Title
## Commitment checks
### 1. Check database consistency
Ran query successfully.
`;
    writeFileSync(join(testDir, "verification.md"), mdContent);
    const props = generateNarratorProps(testDir);

    expect(props.preset).toBe("paper"); // all claims structured-report
    expect(props.effects).toEqual(["subtle-zoom"]);
  });
});
