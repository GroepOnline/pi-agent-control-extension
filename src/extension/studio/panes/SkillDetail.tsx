import React from 'react';
import { Box, Text } from 'ink';
import type { SkillEntry, FocusPane } from '../model/skill.ts';

export const SkillDetail: React.FC<{
  skill: SkillEntry | null;
  focus: FocusPane;
}> = React.memo(({ skill, focus }) => {
  const isFocused = focus === 'detail';

  if (!skill) {
    return (
      <Box
        flexDirection="column"
        width={42}
        borderStyle={isFocused ? 'bold' : 'single'}
        borderColor={isFocused ? 'cyan' : 'gray'}
        paddingY={0}
        paddingX={1}
      >
        <Text bold underline color="cyan">[DETAIL]</Text>
        <Text dimColor> Select a skill to view details</Text>
      </Box>
    );
  }

  const validColor = skill.valid === 'ok' ? 'green' : skill.valid === 'warn' ? 'yellow' : 'red';
  const stateColor = skill.enabled ? 'green' : 'gray';
  const stateLabel = skill.enabled ? 'enabled' : 'disabled';
  const shadowColor = skill.shadowState === 'overrides' ? 'magenta' : skill.shadowState === 'shadowed' ? 'yellow' : undefined;
  const shadowLabel = skill.shadowState === 'overrides' ? '⇢ overrides PI version' : skill.shadowState === 'shadowed' ? '⇠ shadowed by user version' : '';

  return (
    <Box
      flexDirection="column"
      width={42}
      borderStyle={isFocused ? 'bold' : 'single'}
      borderColor={isFocused ? 'cyan' : 'gray'}
      paddingY={0}
      paddingX={1}
    >
      <Text bold underline color="cyan">[DETAIL]</Text>
      <Box flexDirection="column" gap={0} marginTop={1}>
        <Text>
          <Text bold color="white">name  </Text>
          <Text color={skill.enabled ? 'green' : 'gray'}>{skill.enabled ? '●' : '○'} </Text>
          <Text bold>{skill.name}</Text>
        </Text>
        <Text>
          <Text bold color="white">desc  </Text>
          <Text dimColor>{skill.description ? skill.description.length > 38 ? skill.description.slice(0, 37) + '…' : skill.description : '(none)'}</Text>
        </Text>
        <Text>
          <Text bold color="white">src   </Text>
          {skill.source === 'pi' ? <Text color="blue">PI extension</Text> : <Text color="cyan">{skill.sourceDir}</Text>}
        </Text>
        <Text>
          <Text bold color="white">state </Text>
          <Text color={stateColor}>{stateLabel}</Text>
        </Text>
        <Text>
          <Text bold color="white">path  </Text>
          <Text dimColor>{skill.path.length > 36 ? skill.path.slice(0, 35) + '…' : skill.path}</Text>
        </Text>
        <Text>
          <Text bold color="white">valid </Text>
          <Text color={validColor}>{skill.valid}</Text>
        </Text>
        <Text>
          <Text bold color="white">mtime </Text>
          <Text dimColor>{skill.mtime.toLocaleString()}</Text>
        </Text>
        {shadowLabel && (
          <Text>
            <Text bold color="white">shadow </Text>
            <Text color={shadowColor}>{shadowLabel}</Text>
          </Text>
        )}
      </Box>
    </Box>
  );
});
SkillDetail.displayName = 'SkillDetail';
