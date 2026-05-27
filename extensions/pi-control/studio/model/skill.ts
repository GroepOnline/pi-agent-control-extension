export type SkillSource = 'user' | 'pi';
export type ShadowState = 'overrides' | 'shadowed' | null;

export type SkillEntry = {
  name: string;
  description: string;
  path: string;
  source: SkillSource;
  sourceDir: string;
  enabled: boolean;
  valid: 'ok' | 'warn' | 'error';
  mtime: Date;
  shadowState: ShadowState;
};

export type FocusPane = 'list' | 'detail' | 'actions';
