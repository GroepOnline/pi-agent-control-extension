import { z } from 'zod';

const pctBox = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.union([z.string(), z.number()]),
  w: z.union([z.string(), z.number()]),
  h: z.union([z.string(), z.number()]),
});

const keystrokeSchema = z.object({
  t: z.number(),
  label: z.string(),
  dur: z.number().optional(),
});

const sectionSchema = z.object({
  t: z.number(),
  title: z.string(),
});

const effectSchema = z.object({
  type: z.enum(['fade-in', 'fade-out', 'zoom', 'spotlight', 'callout', 'shake', 'pulse', 'border']).optional(),
  t: z.number(),
  dur: z.number(),
  to: pctBox.optional(),
  on: pctBox.optional(),
  dim: z.number().optional(),
  text: z.string().optional(),
  at: z.object({ x: z.union([z.string(), z.number()]), y: z.union([z.string(), z.number()]) }).optional(),
});

const codeAnnotationSchema = z.object({
  t: z.number(),
  dur: z.number(),
  code: z.string(),
  language: z.string().optional(),
  title: z.string().optional(),
  highlight: z.array(z.object({ start: z.number(), end: z.number() })).optional(),
  focus: z.array(z.object({ start: z.number(), end: z.number() })).optional(),
  position: z.enum(['top-right', 'center', 'bottom-left']).optional(),
});

export const showcaseSchema = z.object({
  clips: z.array(z.string()),
  layout: z.enum(['single', 'side-by-side']),
  fidelity: z.enum(['auto', 'compact', 'standard', 'inspect']).optional(),
  labels: z.array(z.string()),
  speed: z.number().optional(),
  title: z.string(),
  subtitle: z.string(),
  preset: z.enum(['warm', 'pi-warm', 'warm-hero', 'pi-hero', 'hero', 'macos', 'presentation', 'minimal', 'dark-pro', 'neon', 'paper', 'ocean']),
  keys: z.array(keystrokeSchema),
  sections: z.array(sectionSchema).optional(),
  effects: z.array(effectSchema),
  clipDuration: z.number().optional(),
  speedNote: z.string().optional(),
  windowTitle: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  objectFit: z.enum(['contain', 'cover', 'fill']).optional(),
  codeAnnotations: z.array(codeAnnotationSchema).optional(),
  transitionStyle: z.enum(['motion-blur', 'flash', 'whip-pan', 'light-leak', 'glitch-lite', 'scan-line', 'vignette', 'grain', 'chromatic', 'ripple', 'pixelate', 'blur-zoom', 'split', 'radial-wipe', 'slide', 'mosaic']).optional(),
  showProgress: z.boolean().optional(),
});

export type ShowcaseProps = z.infer<typeof showcaseSchema>;
