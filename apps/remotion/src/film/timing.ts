import {linearTiming} from "@remotion/transitions";
import {layout} from "./theme";

export const fps = layout.fps;

export const sceneFrames = {
  open: 6 * fps,
  stack: 8 * fps,
  wishcraft: 10 * fps,
  orchestrator: 10 * fps,
  tools: 8 * fps,
  missions: 8 * fps,
  control: 8 * fps,
  close: 8 * fps,
} as const;

export const fadeFrames = 12;

export const fadeTiming = linearTiming({durationInFrames: fadeFrames});

const sceneSum = Object.values(sceneFrames).reduce((a, b) => a + b, 0);
const fadeCount = Object.keys(sceneFrames).length - 1;

export const filmDuration = sceneSum - fadeCount * fadeFrames;
