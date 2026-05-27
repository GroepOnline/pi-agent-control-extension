import React from 'react';
import { Box, Text } from 'ink';
import type { FocusPane } from '../model/skill.ts';

const actions = [
  { key: 'x', label: 'toggle' },
  { key: 'o', label: 'override' },
  { key: 'd', label: 'diff' },
  { key: 'v', label: 'validate' },
  { key: 'r', label: 'reload' },
  { key: '/', label: 'filter' },
  { key: '?', label: 'help' },
  { key: 'q', label: 'quit' },
];

export const ActionBar: React.FC<{
  focus: FocusPane;
}> = React.memo(({ focus }) => {
  const isFocused = focus === 'actions';

  return (
    <Box
      flexDirection="column"
      width={18}
      borderStyle={isFocused ? 'bold' : 'single'}
      borderColor={isFocused ? 'cyan' : 'gray'}
      paddingY={0}
      paddingX={1}
    >
      <Text bold underline color="cyan">actions</Text>
      <Box flexDirection="column" marginTop={1}>
        {actions.map((a) => (
          <Text key={a.key} wrap="truncate">
            <Text color="yellow" bold>{a.key.padEnd(3)}</Text>
            <Text dimColor>{a.label}</Text>
          </Text>
        ))}
      </Box>
    </Box>
  );
});
ActionBar.displayName = 'ActionBar';
