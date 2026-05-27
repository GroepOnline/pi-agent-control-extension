import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { render, Box, Text, useApp, useInput, useStdout } from 'ink';
import { useSkillRegistry } from './hooks/useSkillRegistry.ts';
import { useFilter } from './hooks/useFilter.ts';
import { SkillList } from './panes/SkillList.tsx';
import { SkillDetail } from './panes/SkillDetail.tsx';
import { ActionBar } from './panes/ActionBar.tsx';
import { StatusBar } from './panes/StatusBar.tsx';
import { EvidencePane } from './panes/EvidencePane.tsx';
import type { FocusPane, SkillEntry } from './model/skill.ts';
import type { EvidenceItem } from './panes/EvidencePane.tsx';
import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';

function doDiff(skill: SkillEntry) {
  if (!skill.shadowState) return 'No shadowed/overridden version found.';
  try {
    const repoRoot = process.cwd();
    const piPath = join(repoRoot, 'skills', skill.name, 'SKILL.md');
    if (!existsSync(piPath)) return `PI skill not found at ${piPath}`;
    const userPath = skill.path;
    return execSync(`diff -u ${piPath} ${userPath}`, { encoding: 'utf8' });
  } catch (e: any) {
    return e.stdout || e.message || 'diff failed';
  }
}

function doOverride(skill: SkillEntry) {
  try {
    const destDir = join(homedir(), '.devin', 'skills', skill.name);
    const dest = join(destDir, 'SKILL.md');
    mkdirSync(destDir, { recursive: true });
    copyFileSync(skill.path, dest);
    return `Copied to ${dest}`;
  } catch (e: any) {
    return `Override failed: ${e.message}`;
  }
}

function doValidate(skill: SkillEntry) {
  const checks: string[] = [];
  if (skill.valid === 'ok') checks.push('✓ Frontmatter has name and description');
  if (skill.valid === 'warn') checks.push('⚠ Frontmatter incomplete (missing name or description)');
  if (skill.valid === 'error') checks.push('✗ No frontmatter found');
  if (existsSync(skill.path)) checks.push(`✓ File exists (${skill.path})`);
  else checks.push('✗ File missing');
  return checks.join('\n');
}

export const SkillStudio: React.FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [focus, setFocus] = useState<FocusPane>('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [filterMode, setFilterMode] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [detailContent, setDetailContent] = useState<string | null>(null);
  const [detailTitle, setDetailTitle] = useState<string>('detail');
  const [toast, setToast] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [evidenceItem, setEvidenceItem] = useState<EvidenceItem | null>(null);

  const { skills, toggle, reload } = useSkillRegistry(() => {
    showToast('Skills auto-reloaded');
  });
  const { query, setQuery, filtered } = useFilter(skills);

  const listHeight = Math.max(8, (stdout.rows || 24) - 10);
  const visibleSkills = useMemo(() => filtered.slice(scrollOffset, scrollOffset + listHeight), [filtered, scrollOffset, listHeight]);

  const current = filtered[selectedIndex] ?? null;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const cycleFocus = useCallback(() => {
    setFocus((prev) => {
      const order: FocusPane[] = ['list', 'detail', 'evidence', 'actions'];
      const idx = order.indexOf(prev);
      return order[(idx + 1) % order.length];
    });
  }, []);

  const moveCursor = useCallback((delta: number) => {
    setSelectedIndex((prev) => {
      const max = Math.max(0, filtered.length - 1);
      let next = prev + delta;
      if (next < 0) next = 0;
      if (next > max) next = max;
      // Sync scroll offset in the same batch
      setScrollOffset((prevOffset) => {
        if (next < prevOffset) return Math.max(0, next);
        if (next >= prevOffset + listHeight) return Math.min(Math.max(0, filtered.length - listHeight), next - listHeight + 1);
        return prevOffset;
      });
      return next;
    });
  }, [filtered.length, listHeight]);

  useInput((input, key) => {
    if (showHelp) {
      if (input === 'q' || key.escape || key.return) {
        setShowHelp(false);
      }
      return;
    }

    if (filterMode) {
      if (key.return) {
        setFilterMode(false);
        return;
      }
      if (key.escape) {
        setFilterMode(false);
        setFilterQuery('');
        setQuery('');
        setSelectedIndex(0);
        setScrollOffset(0);
        return;
      }
      if (key.backspace || key.delete) {
        const next = filterQuery.slice(0, -1);
        setFilterQuery(next);
        setQuery(next);
        setSelectedIndex(0);
        setScrollOffset(0);
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        const next = filterQuery + input;
        setFilterQuery(next);
        setQuery(next);
        setSelectedIndex(0);
        setScrollOffset(0);
        return;
      }
      return;
    }

    if (input === 'q' && !key.ctrl) {
      exit();
      return;
    }
    if (input === '?') {
      setShowHelp(true);
      return;
    }
    if (input === 'j' || key.downArrow) {
      moveCursor(1);
      return;
    }
    if (input === 'k' || key.upArrow) {
      moveCursor(-1);
      return;
    }
    if (key.pageDown) {
      moveCursor(listHeight);
      return;
    }
    if (key.pageUp) {
      moveCursor(-listHeight);
      return;
    }
    if (input === 'g') {
      setSelectedIndex(0);
      setScrollOffset(0);
      return;
    }
    if (input === 'G') {
      const last = Math.max(0, filtered.length - 1);
      setSelectedIndex(last);
      setScrollOffset(Math.max(0, filtered.length - listHeight));
      return;
    }
    if (input === 'x' && current) {
      toggle(current.name);
      showToast(`${current.name} ${current.enabled ? 'disabled' : 'enabled'}`);
      return;
    }
    if (input === 'o' && current) {
      setDetailTitle('override');
      setDetailContent(doOverride(current));
      showToast(`Override created for ${current.name}`);
      return;
    }
    if (input === 'd' && current) {
      setDetailTitle('diff');
      setDetailContent(doDiff(current));
      return;
    }
    if (input === 'v' && current) {
      setDetailTitle('validate');
      setDetailContent(doValidate(current));
      return;
    }
    if (input === 'r') {
      reload();
      setDetailTitle('detail');
      setDetailContent(null);
      showToast('Skills reloaded');
      return;
    }
    if (input === 'e') {
      setEvidenceItem({
        evidenceId: `demo-${Date.now()}`,
        format: 'mp4',
        path: '/tmp/demo-evidence',
        validated: true,
        driver: 'tuistory',
        command: 'tctl launch "demo" --backend tuistory',
        warnings: [],
      });
      showToast('Demo evidence loaded (press Tab to focus)');
      return;
    }
    if (input === '/') {
      setFilterMode(true);
      setFilterQuery('');
      setQuery('');
      setSelectedIndex(0);
      setScrollOffset(0);
      return;
    }
    if (key.tab) {
      cycleFocus();
      return;
    }
  });

  useEffect(() => {
    if (stdout && stdout.isTTY) {
      stdout.write('\x1b[?25l');
      return () => {
        stdout.write('\x1b[?25h');
      };
    }
  }, [stdout]);

  const detailSkill = detailContent === null ? current : null;
  const detailText = detailContent ?? null;

  if (showHelp) {
    return (
      <Box flexDirection="column" height={stdout.rows || 24}>
        <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={2} paddingY={1}>
          <Text bold color="cyan">╭────── Skill Studio Help ──────╮</Text>
          <Box flexDirection="column" marginTop={1}>
            <Text><Text color="yellow" bold> j/k     </Text> Navigate up/down</Text>
            <Text><Text color="yellow" bold> PgUp/Dn </Text> Page up/down</Text>
            <Text><Text color="yellow" bold> g/G     </Text> Jump top/bottom</Text>
            <Text><Text color="yellow" bold> x       </Text> Toggle enable/disable</Text>
            <Text><Text color="yellow" bold> o       </Text> Create local override</Text>
            <Text><Text color="yellow" bold> d       </Text> Diff user vs PI</Text>
            <Text><Text color="yellow" bold> v       </Text> Validate SKILL.md</Text>
            <Text><Text color="yellow" bold> r       </Text> Reload all skills</Text>
            <Text><Text color="yellow" bold> e       </Text> Load demo evidence</Text>
            <Text><Text color="yellow" bold> /       </Text> Filter by name</Text>
            <Text><Text color="yellow" bold> Tab     </Text> Cycle focus pane</Text>
            <Text><Text color="yellow" bold> ?       </Text> Show this help</Text>
            <Text><Text color="yellow" bold> q       </Text> Quit studio</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press q, Enter, or Esc to close</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height={stdout.rows || 24}>
      {/* Header */}
      <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
        <Text bold color="cyan">╭── Skill Studio ───────────────────────────────╮</Text>
      </Box>

      {/* Main content */}
      <Box flexDirection="row" flexGrow={1}>
        <SkillList
          skills={visibleSkills}
          selectedIndex={selectedIndex - scrollOffset}
          focus={focus}
          totalCount={filtered.length}
          scrollOffset={scrollOffset}
          filterQuery={filterQuery}
        />
        {focus === 'evidence' ? (
          <EvidencePane focus={focus} item={evidenceItem} />
        ) : detailSkill ? (
          <SkillDetail skill={detailSkill} focus={focus} />
        ) : detailText ? (
          <Box flexDirection="column" width={42} borderStyle={focus === 'detail' ? 'bold' : 'single'} borderColor={focus === 'detail' ? 'cyan' : undefined} paddingY={0} paddingX={1}>
            <Text bold underline color="cyan">{detailTitle}</Text>
            <Box flexDirection="column" marginTop={1}>
              {detailText.split('\n').map((line, i) => (
                <Text key={i} color={line.startsWith('✓') ? 'green' : line.startsWith('✗') ? 'red' : line.startsWith('⚠') ? 'yellow' : undefined}>
                  {line}
                </Text>
              ))}
            </Box>
          </Box>
        ) : (
          <SkillDetail skill={null} focus={focus} />
        )}
        <ActionBar focus={focus} />
      </Box>

      {/* Status bar */}
      <StatusBar
        totalSkills={skills.length}
        filteredCount={filtered.length}
        query={query}
        selectedName={current?.name}
        selectedSource={current?.source}
        selectedValid={current?.valid}
        filterMode={filterMode}
        filterQuery={filterQuery}
      />

      {/* Legend */}
      <Box flexDirection="column" paddingX={1}>
        <Text dimColor>
          {'│Legend: ● on ○ off │ U=user P=pi │ ⇠shadowed ⇢overrides                    │'}
        </Text>
        <Text dimColor>
          {'│Keys: j/k nav │ g/G jump │ x toggle │ o override │ d diff │ v validate       │'}
        </Text>
        <Text dimColor>
          {'│       r reload │ e evidence │ / filter │ ? help │ q quit │ PgUp/PgDn page      │'}
        </Text>
        <Text dimColor>
          {'╰───────────────────────────────────────────────────────────────────────────────╯'}
        </Text>
      </Box>

      {/* Toast */}
      {toast && (
        <Box flexDirection="column" paddingX={1} marginTop={1}>
          <Box backgroundColor="cyan" paddingX={1}>
            <Text color="black" bold>{toast}</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
