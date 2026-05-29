#!/usr/bin/env node
/**
 * convert-real-verification.cjs
 *
 * Small bridge for the narrator prototype v0.1.
 * Takes a real verification.md + proof-report.md from the loop's prior tuistory proof runs
 * and converts them into the flat JSON shape expected by generate-props.cjs.
 *
 * This directly fulfills the handoff request to "run the prototype against a real verification.md".
 */

const fs = require('fs');
const path = require('path');

function parseVerificationMd(content) {
  const lines = content.split('\n');
  const claims = [];
  let currentClaim = null;
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
        step: claimMatch[1].trim(),
        driver: "mixed",
        evidenceType: "structured-report",
        hasVisuals: false,
        hasKeystrokes: false
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
        currentClaim.hasKeystrokes = /keystroke|type|press|input/i.test(line) || currentClaim.hasKeystrokes;
      }

      if (/remotion|compose|showcase|cinematic|render/i.test(line)) {
        currentClaim.driver = currentClaim.driver === "mixed" ? "remotion" : currentClaim.driver;
      }

      if (/browser|web|electron/i.test(line)) {
        currentClaim.driver = currentClaim.driver === "mixed" ? "browser" : currentClaim.driver;
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
      { step: "Terminal / TUI capture", driver: "tuistory", evidenceType: "terminal-snapshot", hasVisuals: true, hasKeystrokes: true },
      { step: "Verification & commitments", driver: "mixed", evidenceType: "structured-report", hasVisuals: false, hasKeystrokes: false }
    );
  }

  return claims;
}

function estimateDuration(content) {
  // Try to extract from technical notes or summary if present
  const durationMatch = content.match(/duration[:\s]+(\d+)/i);
  if (durationMatch) return parseInt(durationMatch[1], 10);

  // Rough heuristic based on number of claims
  const claimCount = (content.match(/^###\s+\d+\./gm) || []).length;
  return Math.max(45, Math.min(120, claimCount * 18));
}

function buildInputFromRealRun(verificationMdPath, proofReportPath, runId) {
  const verificationContent = fs.readFileSync(verificationMdPath, 'utf8');
  const proofContent = proofReportPath ? fs.readFileSync(proofReportPath, 'utf8') : '';

  const claims = parseVerificationMd(verificationContent);
  const durationSec = estimateDuration(verificationContent + proofContent);

  const isHighVisual = claims.some(c => c.evidenceType === "terminal-snapshot" || c.hasKeystrokes);
  const isLong = /long|mixed|multiple drivers/i.test(verificationContent + proofContent) || durationSec > 90;
  const hasManyBeforeAfter = /before.*after|before\/after|comparison/i.test(verificationContent + proofContent);

  return {
    runId,
    primaryDriver: claims[0]?.driver || "tuistory",
    durationSec,
    claims,
    hasManyBeforeAfter,
    isLongMixed: isLong,
    isHighVisualTerminalDemo: isHighVisual
  };
}

function main() {
  const args = process.argv.slice(2);
  const verificationPath = args[0] || "artifacts/runs/2026-05-28T07-00-46-tuistory-4-unique-features-proof/verification.md";
  const proofPath = args[1] || "artifacts/runs/2026-05-28T07-00-46-tuistory-4-unique-features-proof/proof-report.md";
  const runId = args[2] || "real-loop-run-2026-05-28T07-00-46";

  if (!fs.existsSync(verificationPath)) {
    console.error("Verification file not found:", verificationPath);
    process.exit(1);
  }

  const input = buildInputFromRealRun(verificationPath, proofPath, runId);

  const outPath = path.join(__dirname, `real-run-${runId.replace(/[^a-z0-9]/gi, '-')}-input.json`);
  fs.writeFileSync(outPath, JSON.stringify(input, null, 2));

  console.log("Generated input for prototype:");
  console.log("  ", outPath);
  console.log("\nExample claims extracted:");
  input.claims.forEach((c, i) => console.log(`  ${i+1}. ${c.step} [${c.driver}]`));

  console.log("\nNow run the prototype with:");
  console.log(`  node generate-props.cjs --input ${outPath} --output real-run-props.json`);
}

main();