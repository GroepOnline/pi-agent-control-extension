#!/usr/bin/env node
/**
 * control-narrate.cjs — First reference implementation of the control_narrate capability.
 *
 * Takes a verified run directory (that has verification.md + run.json + evidence),
 * runs the improved narrator prototype (converter + generate-props),
 * and produces showcase-props.json ready for the Remotion pipeline.
 *
 * This is the first concrete step toward a real `control_narrate` skill/tool.
 *
 * Usage:
 *   node control-narrate.cjs /path/to/run-dir [--output props.json]
 *
 * Current limitations (as of iter-11):
 * - The prototype produces high-level narrative props (preset, chapters, effects).
 * - The project's main production render path (render-showcase.sh + buildShowcasePropsFromRecipe)
 *   expects pre-staged clip videos + a different props shape.
 * - Full end-to-end video output requires either:
 *     a) Extending the prototype to also stage clips, or
 *     b) Creating a dedicated "narrator-driven" composition that consumes the current props shape.
 *
 * This script demonstrates the flow and produces usable props + clear next-step commands.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const runDir = args[0];
let outputPath = null;
let composition = "NarratorShowcase"; // default to the dedicated narrator composition

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--output' && args[i+1]) {
    outputPath = args[i+1];
    i++;
  }
  if (args[i] === '--composition' && args[i+1]) {
    composition = args[i+1];
    i++;
  }
}

if (!runDir) {
  console.error('Usage: node control-narrate.cjs <run-directory> [--output <props.json>]');
  process.exit(1);
}

const absoluteRunDir = path.resolve(runDir);
const verificationMd = path.join(absoluteRunDir, 'verification.md');
const proofReport = path.join(absoluteRunDir, 'proof-report.md');

if (!fs.existsSync(verificationMd)) {
  console.error('No verification.md found in', absoluteRunDir);
  process.exit(1);
}

console.error(`[control-narrate] Processing run: ${absoluteRunDir}`);

// Use the improved converter (relative to this file)
const converterPath = path.join(__dirname, 'convert-real-verification.cjs');
const { buildInputFromRealRun } = require(converterPath); // Note: may need adjustment if not exported

// For now, we inline a minimal version to keep it self-contained for v0.1
function parseVerificationMdSimple(content) {
  const lines = content.split('\n');
  const claims = [];
  let currentClaim = null;

  for (const line of lines) {
    const claimMatch = line.match(/^###\s+\d+\.\s+(.+)$/);
    if (claimMatch) {
      if (currentClaim) claims.push(currentClaim);
      currentClaim = {
        step: claimMatch[1].trim(),
        driver: "mixed",
        evidenceType: "structured-report",
        hasVisuals: false,
        hasKeystrokes: false
      };
    }
    if (currentClaim) {
      if (/tuistory|terminal|TUI|snapshot/i.test(line)) {
        currentClaim.driver = "tuistory";
        currentClaim.evidenceType = "terminal-snapshot";
        currentClaim.hasVisuals = true;
        currentClaim.hasKeystrokes = true;
      }
    }
  }
  if (currentClaim) claims.push(currentClaim);
  if (claims.length === 0) {
    claims.push({ step: "Evidence capture", driver: "tuistory", evidenceType: "terminal-snapshot", hasVisuals: true, hasKeystrokes: true });
  }
  return claims;
}

const verificationContent = fs.readFileSync(verificationMd, 'utf8');
const claims = parseVerificationMdSimple(verificationContent);

const isHighVisual = claims.some(c => c.evidenceType === "terminal-snapshot" || c.hasKeystrokes);
const durationSec = 75; // placeholder; real version would parse from verification

const prototypeInput = {
  runId: path.basename(absoluteRunDir),
  primaryDriver: claims[0]?.driver || "tuistory",
  durationSec,
  claims,
  hasManyBeforeAfter: false,
  isLongMixed: claims.length > 4,
  isHighVisualTerminalDemo: isHighVisual
};

// Now call the prototype logic (generate-props.cjs)
const generatePropsPath = path.join(__dirname, 'generate-props.cjs');
const { generateProps } = require(generatePropsPath); // We will make sure this is exported or inline the logic

// For robustness in this v0.1 reference, we inline the core heuristic here
function selectPreset(input) {
  if (input.isHighVisualTerminalDemo) return "pi-hero";
  if (input.isLongMixed) return "dark-pro";
  return "pi-warm";
}

function buildEffects(input) {
  const effects = [];
  if (input.isHighVisualTerminalDemo || input.claims.some(c => c.hasKeystrokes)) effects.push("keystroke-pills");
  if (input.claims.some(c => c.evidenceType.includes("snapshot") || c.evidenceType.includes("listing"))) effects.push("spotlight");
  return effects.length ? effects : ["subtle-zoom"];
}

function buildChapters(input) {
  return input.claims.map((c, idx) => ({
    id: `chapter-${idx + 1}`,
    title: `${c.step} (${c.driver})`,
    durationHintSec: Math.max(8, Math.floor(input.durationSec / Math.max(3, input.claims.length)))
  }));
}

const finalProps = {
  version: "0.1-control-narrate",
  runId: prototypeInput.runId,
  preset: selectPreset(prototypeInput),
  transitions: prototypeInput.hasManyBeforeAfter ? ["whip-pan", "scan-line"] : ["motion-blur"],
  effects: buildEffects(prototypeInput),
  chapters: buildChapters(prototypeInput),
  overlays: {
    provenanceFooter: true,
    commitmentHighlights: true
  },
  durationTargetSec: Math.min(90, Math.max(45, prototypeInput.durationSec)),
  source: {
    runDirectory: absoluteRunDir,
    generatedBy: "control-narrate.cjs + narrator-prototype-v0.1"
  }
};

const defaultOut = path.join(absoluteRunDir, 'narrator-props.json');
const outFile = outputPath || defaultOut;

fs.writeFileSync(outFile, JSON.stringify(finalProps, null, 2));

console.log(JSON.stringify({
  ok: true,
  propsPath: outFile,
  preset: finalProps.preset,
  chapters: finalProps.chapters.length,
  composition: composition,
  message: `Props generated for composition "${composition}". Render with: npx remotion still remotion/src/index.ts ${composition} <out.png> --props ${outFile}  (or npx remotion render for video). See narrator-composition-progress-iter17.md and narrator-option-b-composition.md.`
}, null, 2));