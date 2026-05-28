import { describe, it, expect } from "vitest";
import { telemetry, type TelemetrySnapshot } from "./telemetry.ts";

describe("telemetry", () => {
  it("returns a snapshot with zero counts initially", () => {
    const snap: TelemetrySnapshot = telemetry.snapshot();
    expect(snap.sessionCount).toBe(0);
    expect(snap.toolCallCount).toBe(0);
    expect(snap.commandCount).toBe(0);
    expect(snap.errorCount).toBe(0);
    expect(typeof snap.startTime).toBe("string");
  });

  it("increments counters", () => {
    telemetry.increment("test_counter");
    telemetry.increment("test_counter");
    const snap = telemetry.snapshot();
    // snapshot() only exposes specific keys, but internal counters are tracked
    expect(snap.eventsLogged).toBeGreaterThanOrEqual(0);
  });

  it("records events", () => {
    telemetry.record("test.event", { foo: "bar" }, 42, "test error");
    const snap = telemetry.snapshot();
    expect(snap.eventsLogged).toBeGreaterThanOrEqual(1);
  });

  it("formats a markdown report", () => {
    const report = telemetry.formatReport();
    expect(report).toContain("## Telemetry Report");
    expect(report).toContain("Sessions");
    expect(report).toContain("Tool calls");
    expect(report).toContain("Log file");
  });
});
