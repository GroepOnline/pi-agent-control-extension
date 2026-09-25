import { test } from "vitest";
import { routeControlTask } from "./routing.ts";

const route = routeControlTask;
const runOptions = { time: 200, iterations: 10 };

test("routeControlTask - simple browser task", async ({ bench }) => {
  await bench("routeControlTask - simple browser task", () => {
    route("do a visual qa of the login page");
  }).run(runOptions);
});

test("routeControlTask - complex mixed driver task", async ({ bench }) => {
  await bench("routeControlTask - complex mixed driver task", () => {
    route("analyze and improve the project with wiki and review");
  }).run(runOptions);
});

test("routeControlTask - terminal encoding task", async ({ bench }) => {
  await bench("routeControlTask - terminal encoding task", () => {
    route("verify the escape sequence encoding in wezterm");
  }).run(runOptions);
});

test("routeControlTask - tctl with color warnings", async ({ bench }) => {
  await bench("routeControlTask - tctl with color warnings", () => {
    route("run tctl with force_color=3 and colorterm=truecolor");
  }).run(runOptions);
});

test("routeControlTask - deliverable hint", async ({ bench }) => {
  await bench("routeControlTask - deliverable hint", () => {
    route("run something", "with a video");
  }).run(runOptions);
});

test("routeControlTask - long complex task", async ({ bench }) => {
  await bench("routeControlTask - long complex task", () => {
    route(
      "setup workspace with wiki documentation, safety review, and research optimization using subagents for the pipeline"
    );
  }).run(runOptions);
});

test("routeControlTask - word boundary matching", async ({ bench }) => {
  await bench("routeControlTask - word boundary matching", () => {
    route("fetch from the rest api");
  }).run(runOptions);
});

test("routeControlTask - multiple keyword matches", async ({ bench }) => {
  await bench("routeControlTask - multiple keyword matches", () => {
    route("browser automation with screenshots and video showcase");
  }).run(runOptions);
});
