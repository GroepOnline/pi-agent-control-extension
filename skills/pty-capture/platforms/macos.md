# macOS (QEMU) PTY Byte Capture

## Capture Architecture

```
Terminal (Terminal.app/iTerm2) → macOS inside QEMU → serial port/log → byte capture
```

The macOS guest runs inside QEMU. Byte sequences are captured either via the QEMU serial console or by installing a loopback capture utility inside the macOS guest that logs terminal output to a file accessible over SSH.

## Prerequisites

- **qemu-system-aarch64** — macOS VM emulation
- **SSH** — guest access for command execution and log retrieval
- A serial port or log mechanism inside the guest to capture terminal bytes

## Usage Pattern

1. **Launch macOS guest** via QEMU with VNC display
2. **SSH into the guest**
3. **Open a terminal** inside the guest, pipe output through `tee` or `script(1)` if available
4. **Inject keystrokes** via QEMU monitor `sendkey`
5. **Retrieve the byte log** via SCP or shared directory

## Platform-Specific Notes

- macOS `script(1)` can log terminal sessions: `script -q byte-log.txt`
- The QEMU serial port (`-serial file:serial.log`) captures console output but not the GUI terminal's raw byte stream
- For GUI terminal apps (Terminal.app, iTerm2), the most reliable capture method is to SSH a second session that tails the log file
- Default macOS terminal uses `TERM=xterm-256color` — override with `TERM=vt100` to test different encoding paths
