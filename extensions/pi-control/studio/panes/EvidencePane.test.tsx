import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { EvidencePane } from './EvidencePane.tsx';

describe('EvidencePane', () => {
  it('renders empty state when no evidence', () => {
    const { lastFrame } = render(<EvidencePane focus="evidence" item={null} />);
    expect(lastFrame()).toContain('evidence');
    expect(lastFrame()).toContain('No capture');
    expect(lastFrame()).toContain('/capture');
  });

  it('renders evidence item details', () => {
    const item = {
      evidenceId: 'test-123',
      format: 'mp4',
      path: '/tmp/evidence',
      validated: true,
      driver: 'tuistory',
      command: 'tctl launch demo',
      warnings: [],
    };
    const { lastFrame } = render(<EvidencePane focus="evidence" item={item} />);
    expect(lastFrame()).toContain('test-123');
    expect(lastFrame()).toContain('tuistory');
    expect(lastFrame()).toContain('mp4');
  });

  it('shows warnings when present', () => {
    const item = {
      evidenceId: 'test-456',
      format: 'png',
      path: '/tmp/evidence',
      validated: false,
      driver: 'browser',
      command: 'agent-browser screenshot',
      warnings: ['agent-browser not found'],
    };
    const { lastFrame } = render(<EvidencePane focus="evidence" item={item} />);
    expect(lastFrame()).toContain('Warnings');
    expect(lastFrame()).toContain('agent-browser not found');
  });
});
