import type { ShowcaseProps } from "../schema/showcase.schema.js";

export function buildShowcasePropsFromRecipe(recipe: string, capturePath?: string): ShowcaseProps {
  const base: ShowcaseProps = {
    clips: capturePath ? [capturePath] : [],
    layout: "single",
    labels: [recipe],
    title: recipe,
    subtitle: capturePath ? `Generated from ${capturePath}` : "",
    preset: "warm",
    keys: [],
    effects: [],
  };

  switch (recipe) {
    case "browser-loop":
      return { ...base, preset: "macos", layout: "single", transitionStyle: "motion-blur" };
    case "tuistory-launch":
      return { ...base, preset: "dark-pro", layout: "single", transitionStyle: "scan-line", effects: [{ type: "fade-in", t: 0, dur: 0.5 }] };
    case "showcase-compose":
      return { ...base, preset: "neon", layout: "side-by-side", transitionStyle: "flash", effects: [{ type: "zoom", t: 1, dur: 2, to: { x: "20%", y: "20%", w: "60%", h: "60%" } }] };
    case "qa-report":
      return { ...base, preset: "presentation", layout: "single", transitionStyle: "slide", showProgress: true };
    default:
      return { ...base, preset: "warm", transitionStyle: "motion-blur" };
  }
}
