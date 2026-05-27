import React from 'react';
import { Box, Text } from 'ink';
import type { FocusPane } from '../model/skill.ts';

export interface EvidenceItem {
  evidenceId: string;
  format: string;
  path: string;
  validated: boolean;
  driver: string;
  command: string;
  warnings: string[];
}

export const EvidencePane: React.FC<{
  focus: FocusPane;
  item: EvidenceItem | null;
}> = React.memo(({ focus, item }) => {
  const isFocused = focus === 'evidence';

  return (
    <Box
      flexDirection="column"
      width={42}
      borderStyle={isFocused ? 'bold' : 'single'}
      borderColor={isFocused ? 'cyan' : 'gray'}
      paddingY={0}
      paddingX={1}
    >
      <Text bold underline color="cyan">evidence</Text>
      {item ? (
        <Box flexDirection="column" marginTop={1}>
          <Text><Text bold>ID:</Text> {item.evidenceId}</Text>
          <Text><Text bold>Driver:</Text> {item.driver}</Text>
          <Text><Text bold>Format:</Text> {item.format}</Text>
          <Text><Text bold>Path:</Text> {item.path}</Text>
          <Text><Text bold>Validated:</Text> {item.validated ? <Text color="green">✅</Text> : <Text color="red">❌</Text>}</Text>
          {item.warnings.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text bold color="yellow">Warnings:</Text>
              {item.warnings.map((w, i) => (
                <Text key={i} color="yellow" wrap="truncate">• {w}</Text>
              ))}
            </Box>
          )}
          <Box marginTop={1}>
            <Text dimColor wrap="truncate">Cmd: {item.command}</Text>
          </Box>
        </Box>
      ) : (
        <Box marginTop={1}>
          <Text dimColor>No capture evidence yet.</Text>
          <Text dimColor>Run /capture to generate.</Text>
        </Box>
      )}
    </Box>
  );
});
EvidencePane.displayName = 'EvidencePane';
