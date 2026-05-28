import { renderMedia, getCompositions, type VideoImageFormat } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import { join, resolve } from "node:path";
import { mkdirSync, statSync } from "node:fs";
import { calculateShowcaseDuration } from "./lib/duration.js";
import type { ShowcaseProps } from "./schema/showcase.schema.js";
import { buildShowcasePropsFromRecipe } from "./lib/recipe-props.js";

export type RenderOptions = {
  props: ShowcaseProps;
  outPath?: string;
  imageFormat?: VideoImageFormat;
  crf?: number;
  concurrency?: number;
};

export interface RenderResult {
  success: boolean;
  outputPath: string;
  sizeInBytes: number;
  durationInFrames: number;
  error?: string;
}

const DEFAULT_OUTPUT = "artifacts/showcases/showcase.mp4";

export async function renderShowcase(options: RenderOptions): Promise<RenderResult> {
  const outPath = options.outPath ?? DEFAULT_OUTPUT;
  const outputDir = join(process.cwd(), "artifacts", "showcases");
  mkdirSync(outputDir, { recursive: true });

  const entry = resolve(process.cwd(), "remotion", "src", "index.ts");
  const bundled = await bundle(entry, {
    webpackOverride: (config) => config,
  });

  const compositions = await getCompositions(bundled);
  const composition = compositions.find((c) => c.id === "Showcase");
  if (!composition) {
    return { success: false, outputPath: outPath, sizeInBytes: 0, durationInFrames: 0, error: "Composition 'Showcase' not found" };
  }

  const fps = 30;
  const durationInFrames = calculateShowcaseDuration(options.props, fps);

  try {
    const absoluteOutPath = resolve(process.cwd(), outPath);
    await renderMedia({
      composition: { ...composition, durationInFrames },
      serveUrl: bundled,
      codec: "h264",
      outputLocation: absoluteOutPath,
      inputProps: options.props as Record<string, unknown>,
      imageFormat: options.imageFormat ?? "jpeg",
      crf: options.crf ?? 18,
      concurrency: options.concurrency ?? 4,
    });

    const stats = statSync(absoluteOutPath);
    return {
      success: true,
      outputPath: absoluteOutPath,
      sizeInBytes: stats.size,
      durationInFrames,
    };
  } catch (err: any) {
    return {
      success: false,
      outputPath: outPath,
      sizeInBytes: 0,
      durationInFrames,
      error: err?.message ?? String(err),
    };
  }
}

export { buildShowcasePropsFromRecipe } from "./lib/recipe-props.js";
