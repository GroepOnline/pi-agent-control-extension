import { z } from 'zod';

export const narratorSchema = z.object({
  runId: z.string().optional(),
  preset: z.string().optional(),
  durationTargetSec: z.number().optional(),
  chapters: z.array(z.object({
    id: z.string().optional(),
    title: z.string(),
    durationHintSec: z.number().optional(),
  })).optional(),
  effects: z.array(z.string()).optional(),
});

export type NarratorProps = z.infer<typeof narratorSchema>;