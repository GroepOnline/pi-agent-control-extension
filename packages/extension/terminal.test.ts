import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { spawnMock, execFileSyncMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
  execFileSyncMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  spawn: spawnMock,
  execFileSync: execFileSyncMock,
}));

import { spawnTerminal } from "./terminal.ts";

function childThat(event: "spawn" | "error") {
  const child = new EventEmitter() as EventEmitter & { unref: ReturnType<typeof vi.fn> };
  child.unref = vi.fn();
  setImmediate(() => child.emit(event, event === "error" ? new Error("ENOENT") : undefined));
  return child;
}

describe("spawnTerminal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("tries the next emulator after an asynchronous spawn error", async () => {
    let started: ReturnType<typeof childThat> | undefined;
    spawnMock
      .mockImplementationOnce(() => childThat("error"))
      .mockImplementationOnce(() => (started = childThat("spawn")));

    await expect(spawnTerminal("/repo/bin/skill-studio", "/repo")).resolves.toBe(
      "Gestart in een nieuw kitty-venster.",
    );
    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(started?.unref).toHaveBeenCalledOnce();
    expect(execFileSyncMock).not.toHaveBeenCalled();
  });


  it("tries the next emulator after a synchronous spawn throw", async () => {
    let started: ReturnType<typeof childThat> | undefined;
    spawnMock
      .mockImplementationOnce(() => { throw new Error("bad spawn args"); })
      .mockImplementationOnce(() => (started = childThat("spawn")));

    await expect(spawnTerminal("/repo/bin/skill-studio", "/repo")).resolves.toBe(
      "Gestart in een nieuw kitty-venster.",
    );
    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(started?.unref).toHaveBeenCalledOnce();
  });

  it("falls back to tmux when all emulators fail asynchronously", async () => {
    spawnMock.mockImplementation(() => childThat("error"));
    execFileSyncMock.mockReturnValue("");

    await expect(spawnTerminal("/repo/bin/skill-studio", "/repo")).resolves.toContain("tmux-sessie");
    expect(spawnMock).toHaveBeenCalledTimes(3);
    expect(execFileSyncMock).toHaveBeenCalledWith(
      "tmux",
      ["new-session", "-d", "-s", "skill-studio", "-c", "/repo", "/repo/bin/skill-studio"],
      expect.objectContaining({ timeout: 5000 }),
    );
  });
});
