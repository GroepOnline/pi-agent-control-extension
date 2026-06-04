import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { execSync } from "node:child_process";

export interface Claim {
  step: string;
  driver: string;
  evidenceType: string;
  hasVisuals: boolean;
  hasKeystrokes: boolean;
}

export interface NarratorProps {
  version: string;
  runId: string;
  preset: string;
  transitions: string[];
  effects: string[];
  chapters: Array<{ id: string; title: string; durationHintSec: number }>;
  overlays: {
    provenanceFooter: boolean;
    commitmentHighlights: boolean;
  };
  durationTargetSec: number;
  source: {
    runDirectory: string;
    generatedBy: string;
  };
}

function parseVerificationMd(content: string): Claim[] {
  const lines = content.split("\n");
  const claims: Claim[] = [];
  let currentClaim: Claim | null = null;
  let inCommitmentSection = false;

  for (const line of lines) {
    if (/^## Commitment checks/i.test(line)) {
      inCommitmentSection = true;
      continue;
    }

    const claimMatch = line.match(/^###\s+\d+\.\s+(.+)$/);
    if (claimMatch && inCommitmentSection) {
      if (currentClaim) claims.push(currentClaim);
      currentClaim = {
        step: claimMatch[1]!.trim(),
        driver: "mixed",
        evidenceType: "structured-report",
        hasVisuals: false,
        hasKeystrokes: false,
      };
      continue;
    }

    if (currentClaim) {
      const lower = line.toLowerCase();

      // Detect driver and evidence type from context
      if (/tuistory|terminal|tui|snapshot|skill studio/i.test(line)) {
        currentClaim.driver = "tuistory";
        currentClaim.evidenceType = "terminal-snapshot";
        currentClaim.hasVisuals = true;
        currentClaim.hasKeystrokes =
          /keystroke|type|press|input/i.test(line) ||
          currentClaim.hasKeystrokes;
      }

      if (/remotion|compose|showcase|cinematic|render/i.test(line)) {
        currentClaim.driver =
          currentClaim.driver === "mixed" ? "remotion" : currentClaim.driver;
      }

      if (/browser|web|electron/i.test(line)) {
        currentClaim.driver =
          currentClaim.driver === "mixed" ? "browser" : currentClaim.driver;
        currentClaim.evidenceType = "screenshot";
        currentClaim.hasVisuals = true;
      }

      // Look for evidence mentions in the claim body
      if (/visual|snapshot|cast|recording|video/i.test(line)) {
        currentClaim.hasVisuals = true;
      }
      if (/keystroke|typing|keyboard|press/i.test(line)) {
        currentClaim.hasKeystrokes = true;
      }
    }
  }

  if (currentClaim) claims.push(currentClaim);

  // Fallback with better defaults if parsing was weak
  if (claims.length === 0) {
    claims.push(
      {
        step: "Terminal / TUI capture",
        driver: "tuistory",
        evidenceType: "terminal-snapshot",
        hasVisuals: true,
        hasKeystrokes: true,
      },
      {
        step: "Verification & commitments",
        driver: "mixed",
        evidenceType: "structured-report",
        hasVisuals: false,
        hasKeystrokes: false,
      }
    );
  }

  return claims;
}

function estimateDuration(verificationContent: string, proofContent: string): number {
  const durationMatch = (verificationContent + proofContent).match(/duration[:\s]+(\d+)/i);
  if (durationMatch) {
    return parseInt(durationMatch[1]!, 10);
  }
  const claimCount = (verificationContent.match(/^###\s+\d+\./gm) || []).length;
  return Math.max(45, Math.min(120, claimCount * 18));
}

export function generateNarratorProps(runDir: string): NarratorProps {
  const absoluteRunDir = resolve(runDir);
  const verificationMd = join(absoluteRunDir, "verification.md");
  const proofReport = join(absoluteRunDir, "proof-report.md");

  if (!existsSync(verificationMd)) {
    throw new Error(`No verification.md found in ${absoluteRunDir}`);
  }

  const verificationContent = readFileSync(verificationMd, "utf8");
  const proofContent = existsSync(proofReport) ? readFileSync(proofReport, "utf8") : "";

  const claims = parseVerificationMd(verificationContent);
  const durationSec = estimateDuration(verificationContent, proofContent);

  const isHighVisual = claims.some(
    (c) => c.evidenceType === "terminal-snapshot" || c.hasKeystrokes
  );

  const selectPreset = (highVisual: boolean, longMixed: boolean, allClaims: Claim[]) => {
    if (highVisual) return "pi-hero";
    if (longMixed) return "dark-pro";
    if (allClaims.every((c) => c.evidenceType === "structured-report")) return "paper";
    return "pi-warm";
  };

  const buildEffects = (highVisual: boolean, hasSnapshots: boolean) => {
    const effects: string[] = [];
    if (highVisual) effects.push("keystroke-pills");
    if (hasSnapshots) effects.push("spotlight");
    return effects.length ? effects : ["subtle-zoom"];
  };

  const buildChapters = (cls: Claim[]) => {
    // Filter out structured reports if we have many claims, to keep it engaging
    const filtered = cls.filter(
      (c) => c.evidenceType !== "structured-report" || cls.length < 5
    );
    return filtered.map((c, idx) => ({
      id: `chapter-${idx + 1}`,
      title: `${c.step} (${c.driver})`,
      durationHintSec: Math.max(
        6,
        Math.floor(durationSec / Math.max(3, cls.length))
      ),
    }));
  };

  return {
    version: "0.1-control-narrate",
    runId: basename(absoluteRunDir),
    preset: selectPreset(isHighVisual, claims.length > 4, claims),
    transitions: claims.length > 4 ? ["whip-pan", "scan-line"] : ["motion-blur"],
    effects: buildEffects(
      isHighVisual,
      claims.some(
        (c) =>
          c.evidenceType === "terminal-snapshot" ||
          c.evidenceType === "directory-listing"
      )
    ),
    chapters: buildChapters(claims),
    overlays: {
      provenanceFooter: true,
      commitmentHighlights: true,
    },
    durationTargetSec: Math.min(90, Math.max(45, durationSec)),
    source: {
      runDirectory: absoluteRunDir,
      generatedBy: "control-narrate.ts + src/showcase/",
    },
  };
}

export function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help") || args.length === 0) {
    console.log(`usage: control-narrate <run-directory> [options]

After a successful verify, generate narrator-driven showcase-props.json and (optionally) render it.

Options:
  --output PATH      Write props to PATH (default: <run-directory>/narrator-props.json)
  --composition ID   Target Remotion composition (default: NarratorShowcase)
  --render           After props, invoke npx remotion still/render for the composition
  --out PATH         Output path for the rendered still/video (when --render)
  --props PATH       Use a pre-generated props file directly (bypasses generation)
`);
    process.exit(0);
  }

  const runDir = args[0]!;
  let outputPath: string | null = null;
  let composition = "NarratorShowcase";
  let render = false;
  let outPath: string | null = null;
  let propsFile: string | null = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--output" && args[i + 1]) {
      outputPath = args[i + 1]!;
      i++;
    } else if (args[i] === "--composition" && args[i + 1]) {
      composition = args[i + 1]!;
      i++;
    } else if (args[i] === "--render") {
      render = true;
    } else if (args[i] === "--out" && args[i + 1]) {
      outPath = args[i + 1]!;
      i++;
    } else if (args[i] === "--props" && args[i + 1]) {
      propsFile = args[i + 1]!;
      i++;
    }
  }

  const absoluteRunDir = resolve(runDir);
  let finalPropsFile = propsFile ? resolve(propsFile) : null;

  if (!finalPropsFile) {
    console.error(
      `[control-narrate] Generating narrator props for: ${absoluteRunDir}`
    );
    try {
      const props = generateNarratorProps(absoluteRunDir);
      const targetOut = outputPath
        ? resolve(outputPath)
        : join(absoluteRunDir, "narrator-props.json");
      writeFileSync(targetOut, JSON.stringify(props, null, 2));
      finalPropsFile = targetOut;
      console.log(`[control-narrate] Props written to: ${finalPropsFile}`);
    } catch (e: any) {
      console.error(`[control-narrate] Failed to generate props: ${e.message}`);
      process.exit(1);
    }
  } else {
    console.log(
      `[control-narrate] Using pre-generated props: ${finalPropsFile}`
    );
  }

  if (render) {
    const finalOut = outPath
      ? resolve(outPath)
      : join(absoluteRunDir, "narrator-showcase.mp4");
    console.log(
      `[control-narrate] --render requested for composition: ${composition}`
    );

    const remotionDir = resolve(process.cwd(), "apps", "remotion");
    const theme =
      "181818,e0d0c0,15161e,f7768e,9ece6a,e0af68,7aa2f7,bb9af7,7dcfff,a9b1d6,414868,f7768e,9ece6a,e0af68,7aa2f7,bb9af7,7dcfff,c0caf5";

    // Check if we render a still or a video
    const isStill =
      finalOut.endsWith(".png") ||
      finalOut.endsWith(".jpg") ||
      finalOut.endsWith(".jpeg");
    const cmd = isStill ? "still" : "render";

    const commandStr = `PI_CLI_THEME='${theme}' FORCE_COLOR=3 COLORTERM=truecolor npm run ${cmd} -- src/index.ts "${composition}" "${finalOut}" --props "${finalPropsFile}"`;
    console.log(`[control-narrate] Running in ${remotionDir}: ${commandStr}`);

    try {
      execSync(commandStr, {
        cwd: remotionDir,
        stdio: "inherit",
      });
      console.log(`[control-narrate] Render completed successfully: ${finalOut}`);
    } catch (e: any) {
      console.error(`[control-narrate] Render failed: ${e.message}`);
      process.exit(1);
    }
  }
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith("control-narrate.ts") ||
    process.argv[1].endsWith("control-narrate.js") ||
    process.argv[1].includes("tsx"))
) {
  main();
}
