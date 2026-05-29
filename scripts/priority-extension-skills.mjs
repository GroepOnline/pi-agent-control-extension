#!/usr/bin/env node
/**
 * Patches Pi's resourcePrecedenceRank to give extension/package skills
 * higher priority than auto-discovered local skills.
 *
 * This ensures extension-bundled skills always override local skills with
 * the same name from ~/.agents/skills/ or ~/.pi/agent/skills/.
 *
 * Re-run this after every Pi upgrade.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const PI_PACKAGE_MANAGER = join(
  homedir(),
  ".pi/agent/npm/node_modules/@earendil-works/pi-coding-agent/dist/core/package-manager.js",
);

// The function as-is in Pi dist (package skills = rank 4, lowest priority)
const OLD_RANK = `function resourcePrecedenceRank(m) {
    if (m.origin === "package")
        return 4;
    const scopeBase = m.scope === "project" ? 0 : 2;
    return scopeBase + (m.source === "local" ? 0 : 1);
}`;

// Patched version: package skills = rank 0, highest priority
const NEW_RANK = `function resourcePrecedenceRank(m) {
    if (m.origin === "package")
        return 0;
    const scopeBase = m.scope === "project" ? 2 : 4;
    return scopeBase + (m.source === "local" ? 0 : 1);
}`;

let applied = false;

try {
  const content = readFileSync(PI_PACKAGE_MANAGER, "utf-8");

  if (content.includes(NEW_RANK)) {
    console.log("✓ resourcePrecedenceRank already patched (package = rank 0)");
    applied = true;
  } else if (content.includes(OLD_RANK)) {
    const patched = content.replace(OLD_RANK, NEW_RANK);
    writeFileSync(PI_PACKAGE_MANAGER, patched, "utf-8");
    console.log("✓ Patched resourcePrecedenceRank: package skills now have highest priority (rank 0)");
    applied = true;
  } else {
    // Maybe Pi version changed and function looks different
    // Try a more flexible approach: find the function and patch it
    const match = content.match(
      /function resourcePrecedenceRank\(m\)\s*\{[\s\S]*?if\s*\(m\.origin\s*===\s*"package"\)\s*return\s*\d+;[\s\S]*?scopeBase\s*=\s*m\.scope\s*===\s*"project"\s*\?\s*\d+\s*:\s*\d+;[\s\S]*?return\s*scopeBase\s*\+\s*\(m\.source\s*===\s*"local"\s*\?\s*0\s*:\s*1\);[\s\S]*?\}/,
    );

    if (match) {
      const patched = content.replace(match[0], NEW_RANK);
      writeFileSync(PI_PACKAGE_MANAGER, patched, "utf-8");
      console.log("✓ Patched resourcePrecedenceRank (flexible match)");
      applied = true;
    } else {
      console.warn("⚠ Could not find resourcePrecedenceRank function in Pi dist. Pi version may have changed.");
      console.warn("  File:", PI_PACKAGE_MANAGER);
      process.exitCode = 1;
    }
  }
} catch (err) {
  console.error("✗ Failed to patch resourcePrecedenceRank:", err.message);
  process.exitCode = 1;
}

if (applied) {
  console.log("  New priority order: package (0) > project/local (2) > project/auto (3) > user/local (4) > user/auto (5)");
  console.log("  Run 'pi /reload' to apply changes in current session, or restart Pi.");
}
