import { existsSync, readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mergeSkill } from './skill-merge.ts';

// CLI Colors (Vibrant HSL-tailored ANSI)
const C_RESET = '\x1b[0m';
const C_BOLD = '\x1b[1m';
const C_DIM = '\x1b[2m';
const C_PI = '\x1b[38;5;39m'; // Electric Cyan
const C_USER = '\x1b[38;5;135m'; // Neon Purple
const C_GREEN = '\x1b[38;5;120m'; // Spring Green
const C_RED = '\x1b[38;5;203m'; // Bright Red
const C_WARN = '\x1b[38;5;214m'; // Warm Orange
const C_TEXT = '\x1b[38;5;253m'; // Soft White
const C_ACCENT = '\x1b[38;5;45m'; // Soft Turquoise

const STUDIO_STATE_PATH = join(homedir(), '.config', 'devin', 'skill-studio.json');

type SkillSource = 'user' | 'pi';
type ShadowState = 'overrides' | 'shadowed' | null;

interface SkillEntry {
  name: string;
  description: string;
  path: string;
  source: SkillSource;
  sourceDir: string;
  enabled: boolean;
  valid: 'ok' | 'warn' | 'error';
  mtime: Date;
  shadowState: ShadowState;
}

function loadDisabledSet(): Set<string> {
  try {
    const raw = readFileSync(STUDIO_STATE_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.disabled)) return new Set(data.disabled);
  } catch (e: any) {
    if (e.code !== 'ENOENT') {
      console.warn(`[skills] Failed to load state from ${STUDIO_STATE_PATH}: ${e.message}`);
    }
  }
  return new Set();
}

function saveDisabledSet(disabled: Set<string>) {
  try {
    mkdirSync(dirname(STUDIO_STATE_PATH), { recursive: true });
    const raw = existsSync(STUDIO_STATE_PATH) ? readFileSync(STUDIO_STATE_PATH, 'utf8') : '{}';
    const data = JSON.parse(raw);
    data.disabled = Array.from(disabled);
    writeFileSync(STUDIO_STATE_PATH, JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.warn(`[skills] Failed to save state to ${STUDIO_STATE_PATH}: ${e.message}`);
  }
}

export function parseSkillMd(text: string): { name: string; description: string } {
  const nameMatch = text.match(/^name:\s*(.+)$/m);
  const descMatch = text.match(/^description:\s*(.+)$/m);
  return {
    name: (nameMatch?.[1] ?? '').trim().replace(/^['"]|['"]$/g, ''),
    description: (descMatch?.[1] ?? '').trim().replace(/^['"]|['"]$/g, ''),
  };
}

function scanDir(dir: string, source: SkillSource, sourceLabel: string): SkillEntry[] {
  if (!existsSync(dir)) return [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    const result: SkillEntry[] = [];

    for (const d of entries) {
      if (!d.isDirectory() || d.name.startsWith('.')) continue;

      const path = join(dir, d.name, 'SKILL.md');
      if (!existsSync(path)) continue;

      const text = readFileSync(path, 'utf8');
      const parsed = parseSkillMd(text);
      const stat = statSync(path);
      const hasName = parsed.name.length > 0;
      const hasDesc = parsed.description.length > 0;

      result.push({
        name: d.name,
        description: parsed.description || parsed.name || '',
        path,
        source,
        sourceDir: sourceLabel,
        enabled: true,
        valid: hasName && hasDesc ? 'ok' : hasName || hasDesc ? 'warn' : 'error',
        mtime: stat.mtime,
        shadowState: null,
      });
    }
    return result;
  } catch {
    return [];
  }
}

function getRepoRoot(): string {
  const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const candidates = [process.cwd(), PACKAGE_ROOT];
  for (const d of candidates) {
    if (existsSync(join(d, 'package.json'))) return d;
  }
  return process.cwd();
}

function buildRegistry(): SkillEntry[] {
  const repoRoot = getRepoRoot();
  const piSkills = scanDir(join(repoRoot, 'skills'), 'pi', 'pi');
  const userSkills = [
    ...scanDir(join(homedir(), '.agents', 'skills'), 'user', 'global'),
    ...scanDir(join(homedir(), '.devin', 'skills'), 'user', 'devin'),
    ...scanDir(join(homedir(), '.claude', 'skills'), 'user', 'claude'),
  ];

  const disabled = loadDisabledSet();

  const userNames = new Set<string>();
  for (let j = 0; j < userSkills.length; j++) {
    userNames.add(userSkills[j].name);
  }
  const piNames = new Set<string>();
  for (let j = 0; j < piSkills.length; j++) {
    piNames.add(piSkills[j].name);
  }

  const all: SkillEntry[] = new Array(piSkills.length + userSkills.length);
  let idx = 0;

  // Process PI skills
  for (let j = 0; j < piSkills.length; j++) {
    const skill = piSkills[j];
    all[idx++] = {
      name: skill.name,
      description: skill.description,
      path: skill.path,
      source: skill.source,
      sourceDir: skill.sourceDir,
      valid: skill.valid,
      mtime: skill.mtime,
      enabled: !disabled.has(skill.name),
      shadowState: userNames.has(skill.name) ? 'shadowed' : null,
    };
  }

  // Process user skills
  for (let j = 0; j < userSkills.length; j++) {
    const skill = userSkills[j];
    all[idx++] = {
      name: skill.name,
      description: skill.description,
      path: skill.path,
      source: skill.source,
      sourceDir: skill.sourceDir,
      valid: skill.valid,
      mtime: skill.mtime,
      enabled: !disabled.has(skill.name),
      shadowState: piNames.has(skill.name) ? 'overrides' : null,
    };
  }

  all.sort((a, b) => {
    if (a.source !== b.source) return a.source === 'pi' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return all;
}

function doDiff(skill: SkillEntry): string {
  if (!skill.shadowState) return 'No shadowed/overridden version found.';
  try {
    const repoRoot = getRepoRoot();
    const piPath = join(repoRoot, 'skills', skill.name, 'SKILL.md');
    if (!existsSync(piPath)) return `PI skill not found at ${piPath}`;
    const userPath = skill.path;
    return execFileSync('diff', ['-u', piPath, userPath], { encoding: 'utf8' });
  } catch (e: any) {
    return e.stdout || e.message || 'diff failed';
  }
}

function showHelp() {
  console.log(`
${C_BOLD}${C_ACCENT}⚡ Pi Skills CLI — Best of the Best Skill Atom Control${C_RESET}
===================================================

${C_BOLD}Usage:${C_RESET}
  pi-agent-control skills <command> [arguments]

${C_BOLD}Commands:${C_RESET}
  ${C_BOLD}${C_GREEN}list${C_RESET} [--json] [--source pi|user]   List all bundled and user skill atoms with status.
  ${C_BOLD}${C_GREEN}view <name>${C_RESET}                      View a beautifully formatted rendering of the skill.
  ${C_BOLD}${C_GREEN}enable <name>${C_RESET}                    Enable a specific skill atom.
  ${C_BOLD}${C_GREEN}disable <name>${C_RESET}                   Disable a specific skill atom.
  ${C_BOLD}${C_GREEN}validate [<name>]${C_RESET}              Run structural and frontmatter audits on skill atoms.
  ${C_BOLD}${C_GREEN}diff <name>${C_RESET}                      Show differences between user-level and PI-bundled versions.
  ${C_BOLD}${C_GREEN}merge <name>${C_RESET}                     Perform a three-way merge to consolidate shadowed overrides.
  ${C_BOLD}${C_GREEN}help${C_RESET}                           Show this help menu.

${C_BOLD}Options:${C_RESET}
  --json                             Output results in structured JSON format.
  --source pi|user                   Filter listed skills by their origin source.
`);
}

function runList(args: string[]) {
  const isJson = args.includes('--json');
  const sourceArg = args.indexOf('--source');
  let filterSource: string | null = null;
  if (sourceArg !== -1 && args[sourceArg + 1]) {
    filterSource = args[sourceArg + 1];
  }

  const skills = buildRegistry().filter((s) => {
    if (filterSource && s.source !== filterSource) return false;
    return true;
  });

  if (isJson) {
    console.log(JSON.stringify(skills, null, 2));
    return;
  }

  console.log(`\n${C_BOLD}${C_ACCENT}📚 Registered Skill Atoms (${skills.length})${C_RESET}`);
  console.log(`${C_DIM}------------------------------------------------------------${C_RESET}`);
  
  for (const s of skills) {
    const statusSymbol = s.enabled ? `${C_GREEN}🟢 [enabled]${C_RESET}` : `${C_RED}🔴 [disabled]${C_RESET}`;
    const sourceLabel = s.source === 'pi' ? `${C_PI}pi (bundled)${C_RESET}` : `${C_USER}user (${s.sourceDir})${C_RESET}`;
    const shadowLabel = s.shadowState === 'shadowed' ? ` ${C_DIM}[shadowed]${C_RESET}` : s.shadowState === 'overrides' ? ` ${C_WARN}[overriding]${C_RESET}` : '';
    const validitySymbol = s.valid === 'ok' ? `${C_GREEN}✓${C_RESET}` : s.valid === 'warn' ? `${C_WARN}⚠${C_RESET}` : `${C_RED}✗${C_RESET}`;

    console.log(` ${validitySymbol} ${C_BOLD}${s.name}${C_RESET}${shadowLabel}`);
    console.log(`   ${C_DIM}Source:${C_RESET} ${sourceLabel}  |  ${statusSymbol}`);
    console.log(`   ${C_DIM}Path:${C_RESET}   ${s.path}`);
    console.log(`   ${C_DIM}Desc:${C_RESET}   ${C_TEXT}${s.description}${C_RESET}\n`);
  }
}

function runView(name: string) {
  const skills = buildRegistry();
  const skill = skills.find((s) => s.name === name);
  if (!skill) {
    console.error(`${C_RED}Error: Skill "${name}" not found in registry.${C_RESET}`);
    process.exit(1);
  }

  console.log(`\n${C_BOLD}${C_ACCENT}📖 Skill Atom: ${skill.name}${C_RESET}`);
  console.log(`${C_DIM}Path: ${skill.path}${C_RESET}`);
  console.log(`${C_DIM}------------------------------------------------------------${C_RESET}\n`);

  try {
    const content = readFileSync(skill.path, 'utf8');
    // Basic Markdown ANSI highlight
    const highlighted = content
      .replace(/^#\s+(.+)$/gm, `${C_BOLD}${C_ACCENT}$1${C_RESET}`)
      .replace(/^##\s+(.+)$/gm, `${C_BOLD}${C_PI}$1${C_RESET}`)
      .replace(/^###\s+(.+)$/gm, `${C_BOLD}$1${C_RESET}`)
      .replace(/^-\s+(.+)$/gm, ` • $1`)
      .replace(/`([^`]+)`/g, `${C_ACCENT}$1${C_RESET}`);
    console.log(highlighted);
  } catch (e: any) {
    console.error(`${C_RED}Error reading skill content: ${e.message}${C_RESET}`);
  }
}

function runToggle(name: string, enable: boolean) {
  const skills = buildRegistry();
  const skill = skills.find((s) => s.name === name);
  if (!skill) {
    console.error(`${C_RED}Error: Skill "${name}" not found in registry.${C_RESET}`);
    process.exit(1);
  }

  const disabled = loadDisabledSet();
  if (enable) {
    disabled.delete(name);
  } else {
    disabled.add(name);
  }
  saveDisabledSet(disabled);

  console.log(`${C_GREEN}Success: Skill "${name}" is now ${enable ? 'ENABLED 🟢' : 'DISABLED 🔴'}.${C_RESET}`);
}

function runValidate(name?: string) {
  const skills = buildRegistry().filter((s) => !name || s.name === name);
  if (name && skills.length === 0) {
    console.error(`${C_RED}Error: Skill "${name}" not found in registry.${C_RESET}`);
    process.exit(1);
  }

  console.log(`\n${C_BOLD}${C_ACCENT}🛡️ Auditing Skill Atoms...${C_RESET}`);
  console.log(`${C_DIM}------------------------------------------------------------${C_RESET}`);

  let errors = 0;
  let warnings = 0;

  for (const s of skills) {
    const checks: string[] = [];
    let status = `${C_GREEN}✓ OK${C_RESET}`;

    if (s.valid === 'ok') {
      checks.push(`  ${C_GREEN}✓${C_RESET} Frontmatter contains name & description`);
    } else if (s.valid === 'warn') {
      checks.push(`  ${C_WARN}⚠${C_RESET} Frontmatter is incomplete (missing name or description)`);
      status = `${C_WARN}⚠ WARN${C_RESET}`;
      warnings++;
    } else {
      checks.push(`  ${C_RED}✗${C_RESET} Missing or malformed YAML frontmatter`);
      status = `${C_RED}✗ ERROR${C_RESET}`;
      errors++;
    }

    if (existsSync(s.path)) {
      checks.push(`  ${C_GREEN}✓${C_RESET} SKILL.md file is present`);
    } else {
      checks.push(`  ${C_RED}✗${C_RESET} SKILL.md file missing`);
      status = `${C_RED}✗ ERROR${C_RESET}`;
      errors++;
    }

    console.log(` • [${status}] ${C_BOLD}${s.name}${C_RESET} (${s.sourceDir})`);
    for (const c of checks) {
      console.log(c);
    }
    console.log();
  }

  console.log(`${C_BOLD}Audit Complete:${C_RESET} ${C_GREEN}${skills.length - errors - warnings} healthy${C_RESET}, ${C_WARN}${warnings} warnings${C_RESET}, ${C_RED}${errors} errors${C_RESET}.\n`);
  if (errors > 0) process.exit(1);
}

function runDiff(name: string) {
  const skills = buildRegistry();
  const skill = skills.find((s) => s.name === name);
  if (!skill) {
    console.error(`${C_RED}Error: Skill "${name}" not found in registry.${C_RESET}`);
    process.exit(1);
  }

  if (!skill.shadowState) {
    console.log(`${C_GREEN}Skill "${name}" is not shadowed or overridden.${C_RESET}`);
    return;
  }

  console.log(`\n${C_BOLD}${C_ACCENT}🔍 Diffing user vs bundled versions of "${name}"...${C_RESET}\n`);
  console.log(doDiff(skill));
}

function runMerge(name: string) {
  const result = mergeSkill(name);
  if (result.hasConflicts) {
    console.log(`\n${C_RED}⚠️ Merge Conflicts Detected in "${name}" (${result.conflicts.length})${C_RESET}`);
    console.log(`${C_DIM}------------------------------------------------------------${C_RESET}`);
    for (const c of result.conflicts) {
      console.log(`Line ${c.line}: ${c.context}`);
      console.log(`  ${C_RED}PI version:   ${c.piLine}${C_RESET}`);
      console.log(`  ${C_USER}USER version: ${c.userLine}${C_RESET}\n`);
    }
    console.log(`Use the visual Skill Studio (${C_BOLD}npm run showcase:preview${C_RESET} or ${C_BOLD}bin/skill-studio${C_RESET}) to resolve manually.`);
  } else {
    console.log(`\n${C_GREEN}✓ Clean Merge! All conflicts resolved automatically for "${name}".${C_RESET}`);
    console.log(`${C_DIM}Merged version has been saved to your local overrides folder.${C_RESET}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'list':
      runList(args.slice(1));
      break;
    case 'view':
      if (!args[1]) {
        console.error(`${C_RED}Error: Missing skill name. Usage: skills view <name>${C_RESET}`);
        process.exit(1);
      }
      runView(args[1]);
      break;
    case 'enable':
      if (!args[1]) {
        console.error(`${C_RED}Error: Missing skill name. Usage: skills enable <name>${C_RESET}`);
        process.exit(1);
      }
      runToggle(args[1], true);
      break;
    case 'disable':
      if (!args[1]) {
        console.error(`${C_RED}Error: Missing skill name. Usage: skills disable <name>${C_RESET}`);
        process.exit(1);
      }
      runToggle(args[1], false);
      break;
    case 'validate':
      runValidate(args[1]);
      break;
    case 'diff':
      if (!args[1]) {
        console.error(`${C_RED}Error: Missing skill name. Usage: skills diff <name>${C_RESET}`);
        process.exit(1);
      }
      runDiff(args[1]);
      break;
    case 'merge':
      if (!args[1]) {
        console.error(`${C_RED}Error: Missing skill name. Usage: skills merge <name>${C_RESET}`);
        process.exit(1);
      }
      runMerge(args[1]);
      break;
    case 'help':
    case '-h':
    case '--help':
      showHelp();
      break;
    default:
      console.error(`${C_RED}Unknown skills command: ${command}${C_RESET}`);
      showHelp();
      process.exit(2);
  }
}

main();
