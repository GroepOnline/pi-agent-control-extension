import React from 'react';
import { Box, Text } from 'ink';

export const StatusBar: React.FC<{
  totalSkills: number;
  filteredCount: number;
  query: string;
  selectedName?: string;
  selectedSource?: string;
  selectedValid?: string;
  filterMode?: boolean;
  filterQuery?: string;
}> = ({ totalSkills, filteredCount, query, selectedName, selectedSource, selectedValid, filterMode, filterQuery }) => {
  const filterIndicator = query
    ? `  filter: "${query}"  ${filteredCount}/${totalSkills}`
    : `  ${filteredCount}/${totalSkills} skills`;

  const validIcon = selectedValid === 'ok'
    ? <Text color="green">✓</Text>
    : selectedValid === 'warn'
      ? <Text color="yellow">⚠</Text>
      : selectedValid ? <Text color="red">✗</Text> : null;

  return (
    <Box
      flexDirection="row"
      width="100%"
      borderStyle="single"
      borderColor={filterMode ? 'yellow' : 'gray'}
      paddingX={1}
      marginTop={0}
      height={1}
    >
      <Box flexDirection="row" gap={0}>
        <Text bold color="cyan">Skill Studio</Text>
        <Text dimColor>{filterIndicator}</Text>
        {selectedName && (
          <Text dimColor>
            {'  │  '}
            <Text bold color="white">{selectedName}</Text>
            <Text dimColor> [{selectedSource?.toUpperCase() || '?'}] </Text>
            {validIcon}
          </Text>
        )}
        {filterMode && (
          <Text dimColor>
            {'  │  '}
            <Text color="yellow">FILTER</Text>
            <Text color="cyan">: {filterQuery}</Text>
          </Text>
        )}
      </Box>
    </Box>
  );
};
