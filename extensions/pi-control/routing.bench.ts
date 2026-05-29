import { describe, bench } from "vitest";
import { routeControlTask } from "./routing.ts";

describe("Routing Performance Benchmarks", () => {
  bench("routeControlTask - simple browser task", () => {
    routeControlTask("do a visual qa of the login page");
  });

  bench("routeControlTask - complex mixed driver task", () => {
    routeControlTask("analyze and improve the project with wiki and review");
  });

  bench("routeControlTask - terminal encoding task", () => {
    routeControlTask("verify the escape sequence encoding in wezterm");
  });

  bench("routeControlTask - tctl with color warnings", () => {
    routeControlTask("run tctl with force_color=3 and colorterm=truecolor");
  });

  bench("routeControlTask - deliverable hint", () => {
    routeControlTask("run something", "with a video");
  });

  bench("routeControlTask - long complex task", () => {
    routeControlTask(
      "setup workspace with wiki documentation, safety review, and research optimization using subagents for the pipeline"
    );
  });

  bench("routeControlTask - word boundary matching", () => {
    routeControlTask("fetch from the rest api");
  });

  bench("routeControlTask - multiple keyword matches", () => {
    routeControlTask("browser automation with screenshots and video showcase");
  });
});
