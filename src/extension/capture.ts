import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { parseCaptureArgs, capture, formatCaptureMarkdown, routeToDriver } from "../core/capture/capture.ts";
export { parseCaptureArgs, capture, formatCaptureMarkdown, routeToDriver };

export function registerCapture(pi: ExtensionAPI) {
  pi.registerCommand("capture", {
    description: "Unified evidence capture: kiest driver + format automatisch",
    handler: async (args: string, ctx: ExtensionContext) => {
      const parsed = parseCaptureArgs(args);
      if (parsed.error) {
        ctx.ui?.notify?.("Usage: /capture <url|command> [--format mp4|cast|png|report]", "error");
        return;
      }

      const result = capture(parsed.target, parsed.format);
      ctx.ui?.notify?.(formatCaptureMarkdown(result), result.validated ? "info" : "warning");
    },
  });
}
