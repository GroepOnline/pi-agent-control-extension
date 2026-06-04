import { describe, it, expect, vi } from 'vitest';
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

vi.mock('remotion', () => ({
  registerRoot: vi.fn(),
}));

vi.mock('./Root', () => ({
  RemotionRoot: () => null,
}));

describe('remotion index', () => {
  it('should register RemotionRoot', async () => {
    await import('./index.ts');
    expect(registerRoot).toHaveBeenCalledWith(RemotionRoot);
  });
});
