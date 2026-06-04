# Linux / Wayland PTY Byte Capture

## Capture Architecture

```
Terminal (Ghostty/Kitty/Alacritty) → cage compositor → strace/logged PTY → byte log
```

On Linux, the terminal runs inside `cage` (headless Wayland). Byte sequences are captured by wrapping the PTY with `script(1)` or using `strace -e write` to log write(2) syscalls from the terminal process. The result is an exact byte-for-byte log of what the terminal emitted.

## Prerequisites

- **cage** — headless Wayland compositor
- **wtype** — keystroke injection (same as true-input)
- **strace** or **script(1)** — for byte capture
- A Wayland-native terminal (ghostty, kitty, alacritty)

## Usage Pattern

1. **Launch cage with terminal**: `cage -- ghostty -e bash`
2. **Start capture**: `strace -e write -p $TERMINAL_PID -o $RUN_DIR/byte-log.txt`
3. **Inject keystroke**: `wtype -k Shift -k Return`
4. **Stop capture**: `kill -INT $STRACE_PID`
5. **Read log**: `grep 'write(' $RUN_DIR/byte-log.txt` to see emitted bytes

## Platform-Specific Notes

- Use `script -q -c "command" /dev/null` as an alternative capture method that logs all terminal output to a file
- The `WAYLAND_DISPLAY` env var must be set to the cage compositor's socket name
- For TUI programs that detect terminal capabilities via terminfo, ensure `TERM=xterm-256color` or use the terminal's native value
