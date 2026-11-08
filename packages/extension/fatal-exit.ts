/**
 * Process surface used when an uncaught exception must end the process
 * with a non-zero status. Tests pass a fake; production uses `process`.
 */
export interface FatalExitProcess {
  once(event: "uncaughtException", listener: (error: unknown) => void): void;
  exitCode: number | string | null | undefined;
  exit(code: number): void;
}

/**
 * Node stops its default fatal exit as soon as an `uncaughtException`
 * listener exists. Record a non-zero status and exit so the failure is
 * still fatal.
 */
export function installFatalExceptionExit(target: FatalExitProcess = process): void {
  target.once("uncaughtException", () => {
    target.exitCode = 1;
    target.exit(1);
  });
}
