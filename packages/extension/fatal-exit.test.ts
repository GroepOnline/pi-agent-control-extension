import { describe, expect, it, vi } from "vitest";
import { installFatalExceptionExit, type FatalExitProcess } from "./fatal-exit.ts";

describe("installFatalExceptionExit", () => {
  it("exits non-zero when the process raises an uncaught exception", () => {
    let listener: ((error: unknown) => void) | undefined;
    const target: FatalExitProcess = {
      once(event, fn) {
        expect(event).toBe("uncaughtException");
        listener = fn;
      },
      exitCode: 0,
      exit: vi.fn(),
    };

    installFatalExceptionExit(target);
    expect(listener).toBeTypeOf("function");

    listener?.(new Error("fatal"));

    expect(target.exitCode).toBe(1);
    expect(target.exit).toHaveBeenCalledOnce();
    expect(target.exit).toHaveBeenCalledWith(1);
  });
});
