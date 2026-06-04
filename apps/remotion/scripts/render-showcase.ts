import { renderShowcase, buildShowcasePropsFromRecipe } from "../../../src/showcase/render.js";

async function main() {
  const args = process.argv.slice(2);
  const recipe = args[0] ?? "showcase-compose";
  const capturePath = args[1];
  const outPath = args[2] ?? `artifacts/showcases/${recipe}.mp4`;

  const props = buildShowcasePropsFromRecipe(recipe, capturePath);

  console.error(`[showcase-render] Rendering "${recipe}" -> ${outPath}`);
  if (capturePath) {
    console.error(`[showcase-render] Bound to capture: ${capturePath}`);
  }

  const result = await renderShowcase({ props, outPath });

  if (result.success) {
    console.log(JSON.stringify({
      ok: true,
      outputPath: result.outputPath,
      sizeInBytes: result.sizeInBytes,
      durationInFrames: result.durationInFrames,
    }));
  } else {
    console.error(`[showcase-render] Error: ${result.error}`);
    console.log(JSON.stringify({ ok: false, error: result.error }));
    process.exit(1);
  }
}

main();
