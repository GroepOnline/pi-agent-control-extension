#!/usr/bin/env node
/**
 * Narrator Prototype v0.1 — Reference Implementation
 *
 * Implements the minimal rule-based heuristic from feature4-narrator-sketch-minimal.md.
 * Purely demonstrative. No side effects on sacred surfaces.
 *
 * Usage:
 *   node generate-props.js --demo
 *   node generate-props.js --input path/to/verification-summary.json --output /tmp/props.json
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isDemo = args.includes('--demo');
let inputPath = null;
let outputPath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--input' && args[i+1]) inputPath = args[i+1];
  if (args[i] === '--output' && args[i+1]) outputPath = args[i+1];
}

function loadInput() {
  if (isDemo || !inputPath) {
    // Representative successful high-impact terminal + governance demo
    // (synthesized from the loop's tuistory + skill governance proof work)
    return {
      runId: "2026-05-28-tuistory-4-unique-features-demo",
      primaryDriver: "tuistory",
      durationSec: 68,
      claims: [
        { step: "Launch Skill Studio", driver: "tuistory", evidenceType: "terminal-snapshot", hasVisuals: true, hasKeystrokes: true },
        { step: "skills view + diff on tuistory atom", driver: "tuistory", evidenceType: "terminal-snapshot", hasVisuals: true, hasKeystrokes: true },
        { step: "Verify commitments", driver: "mixed", evidenceType: "structured-report", hasVisuals: false, hasKeystrokes: false },
        { step: "Remotion source exploration", driver: "terminal", evidenceType: "directory-listing", hasVisuals: true, hasKeystrokes: false }
      ],
      hasManyBeforeAfter: false,
      isLongMixed: false,
      isHighVisualTerminalDemo: true
    };
  }
  return JSON.parse(fs.readFileSync(inputPath, 'utf8'));
}

function selectPreset(input) {
  if (input.isHighVisualTerminalDemo) return "pi-hero";
  if (input.isLongMixed) return "dark-pro";
  if (input.claims.every(c => c.evidenceType === "structured-report")) return "paper";
  return "pi-warm";
}

function buildEffects(input, preset) {
  const effects = [];
  if (input.isHighVisualTerminalDemo || input.claims.some(c => c.hasKeystrokes)) {
    effects.push("keystroke-pills");
  }
  if (input.claims.some(c => c.evidenceType === "terminal-snapshot" || c.evidenceType === "directory-listing")) {
    effects.push("spotlight");
  }
  if (input.hasManyBeforeAfter) {
    effects.push("whip-pan");
  }
  return effects.length ? effects : ["subtle-zoom"];
}

function buildChapters(input) {
  return input.claims
    .filter(c => c.evidenceType !== "structured-report" || input.claims.length < 5)
    .map((c, idx) => ({
      id: `chapter-${idx + 1}`,
      title: `${c.step} (${c.driver})`,
      durationHintSec: Math.max(6, Math.floor(input.durationSec / Math.max(3, input.claims.length)))
    }));
}

function generateProps(input) {
  const preset = selectPreset(input);
  const effects = buildEffects(input, preset);
  const chapters = buildChapters(input);

  return {
    version: "0.1-narrator-prototype",
    runId: input.runId,
    preset,
    transitions: input.hasManyBeforeAfter ? ["whip-pan", "scan-line"] : ["motion-blur"],
    effects,
    chapters,
    overlays: {
      provenanceFooter: true,
      commitmentHighlights: true
    },
    durationTargetSec: Math.min(90, Math.max(45, input.durationSec)),
    source: {
      verification: "representative-from-loop-proof-work",
      remotionCatalog: ["remotion-presets-recipes-iter04.cast", "remotion-surface-iter03.cast"]
    },
    invocation: {
      note: "In production this would call the existing Remotion render pipeline (confirmed via compose-showcase-entrypoints-iter06.cast that top-level subcommands are reached via skills or direct scripts).",
      suggestedCommand: "node remotion/scripts/render.js --props showcase-props.json"
    }
  };
}

const input = loadInput();
const props = generateProps(input);

if (outputPath) {
  fs.writeFileSync(outputPath, JSON.stringify(props, null, 2));
  console.log(`Wrote ${outputPath}`);
} else {
  console.log(JSON.stringify(props, null, 2));
}

if (isDemo) {
  console.error("\n[info] Ran in --demo mode with representative high-impact terminal + governance input.");
}