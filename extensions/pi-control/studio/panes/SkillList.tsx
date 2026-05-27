import React from 'react';
import { Box, Text } from 'ink';
import type { SkillEntry, FocusPane } from '../model/skill.ts';

export const SkillList: React.FC<{
  skills: SkillEntry[];
  selectedIndex: number;
  focus: FocusPane;
  totalCount: number;
  scrollOffset: number;
  filterQuery?: string;
}> = ({ skills, selectedIndex, focus, totalCount, scrollOffset, filterQuery }) => {
  const isFocused = focus === 'list';
  const hasMoreAbove = scrollOffset > 0;
  const hasMoreBelow = scrollOffset + skills.length < totalCount;

  // Build highlighted segments for a skill name when filtering is active
  const highlightSegments = (name: string): { text: string; match: boolean }[] => {
    if (!filterQuery) return [{ text: name, match: false }];
    const q = filterQuery.toLowerCase();
    const n = name.toLowerCase();
    const segments: { text: string; match: boolean }[] = [];
    let last = 0;
    let idx = n.indexOf(q);
    while (idx !== -1) {
      if (idx > last) segments.push({ text: name.slice(last, idx), match: false });
      segments.push({ text: name.slice(idx, idx + q.length), match: true });
      last = idx + q.length;
      idx = n.indexOf(q, last);
    }
    if (last < name.length) segments.push({ text: name.slice(last), match: false });
    return segments.length ? segments : [{ text: name, match: false }];
  };

  return (
    <Box
      flexDirection="column"
      width={30}
      borderStyle={isFocused ? 'bold' : 'single'}
      borderColor={isFocused ? 'cyan' : 'gray'}
      paddingY={0}
      paddingX={1}
    >
      <Text bold underline color="cyan">
        {'[LIST] '}{skills.length}/{totalCount}
      </Text>

      {/* Scroll indicator above */}
      {hasMoreAbove && (
        <Text dimColor color="gray">
          {'  ↑'}{scrollOffset} more
        </Text>
      )}

      {skills.map((skill, i) => {
        const isSelected = i === selectedIndex;
        const iconEnabled = skill.enabled ? '●' : '○';
        const iconSource = skill.source === 'pi' ? 'P' : 'U';
        const shadowMarker = skill.shadowState === 'overrides' ? ' ⇢' : skill.shadowState === 'shadowed' ? ' ⇠' : '';
        const prefix = ` ${iconEnabled} ${iconSource}  `;
        const maxNameLen = 26 - prefix.length;
        const nameDisplay = skill.name.length > maxNameLen ? skill.name.slice(0, maxNameLen - 1) + '…' : skill.name;
        const segments = highlightSegments(nameDisplay);

        return (
          <Box key={skill.name + skill.sourceDir}>
            <Text
              backgroundColor={isSelected ? 'cyan' : undefined}
              color={isSelected ? 'black' : skill.enabled ? 'green' : 'gray'}
              dimColor={!skill.enabled && !isSelected}
              bold={isSelected}
            >
              {isSelected ? '▶' : ' '}
              {prefix}
            </Text>
            {segments.map((seg, si) => (
              <Text
                key={si}
                backgroundColor={isSelected ? 'cyan' : seg.match ? 'yellow' : undefined}
                color={isSelected ? 'black' : skill.enabled ? (seg.match ? 'black' : 'green') : 'gray'}
                dimColor={!skill.enabled && !isSelected && !seg.match}
                bold={seg.match || isSelected}
              >
                {seg.text}
              </Text>
            ))}
            {shadowMarker && (
              <Text
                backgroundColor={isSelected ? 'cyan' : undefined}
                color={isSelected ? 'black' : skill.enabled ? 'green' : 'gray'}
                dimColor={!skill.enabled && !isSelected}
              >
                {shadowMarker}
              </Text>
            )}
          </Box>
        );
      })}

      {/* Scroll indicator below */}
      {hasMoreBelow && (
        <Text dimColor color="gray">
          {'  ↓'}{totalCount - scrollOffset - skills.length} more
        </Text>
      )}

      {skills.length === 0 && (
        <Text dimColor> No skills match filter</Text>
      )}
    </Box>
  );
};
