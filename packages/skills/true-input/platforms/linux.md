# Linux / Wayland True-Input

## Prerequisites

- **cage** — headless Wayland compositor (`apt install cage`)
- **wtype** — Wayland keystroke injection (`apt install wtype`)
- **grim** — Wayland screenshot utility (`apt install grim`, optional)
- **wf-recorder** — Wayland screen recorder (`apt install wf-recorder`, optional)
- **GPU** — access to `/dev/dri/*` for hardware-accelerated rendering

## Core Pattern

```
cage -- <terminal> [args...]
```

The cage compositor creates an isolated Wayland environment. wtype injects keystrokes directly into the compositor's input stack, bypassing XWayland compatibility layers.

## Command Reference

| Action | Command |
|---|---|
| Launch headless terminal | `cage -- ghostty -e $SHELL` |
| Type text | `wtype "command\n"` |
| Press key chord | `wtype -k Shift -k Return` |
| Screenshot | `grim -t png $OUTPUT` |
| Start recording | `wf-recorder -f $OUTPUT.mp4` |
| Stop recording | `kill -INT $RECORDER_PID` |

## Encoding Reference

Linux keycodes follow `linux/input-event-codes.h`. wtype maps key names (e.g., `Shift`, `Return`, `Escape`, `Tab`) to the corresponding EV_KEY codes. Modifier order matters: `wtype -k Shift -k a` sends `A`, while `wtype -k a` sends `a`.

| Key | wtype flag | Notes |
|---|---|---|
| Shift | `-k Shift` | Left shift |
| Control | `-k Ctrl` | Left control |
| Alt | `-k Alt` | Left alt |
| Super | `-k Super` | Windows/Command key |
| Return | `-k Return` | |
| Escape | `-k Escape` | |
| Tab | `-k Tab` | |
| Backspace | `-k Backspace` | |

## Recording

1. Launch cage with terminal
2. Start recording: `wf-recorder -f "$RUN_DIR/evidence/session.mp4" &`
3. Store PID: `RECORDER_PID=$!`
4. Inject keystrokes via wtype
5. Stop recording: `kill -INT $RECORDER_PID`

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `wtype: failed to connect` | No WAYLAND_DISPLAY set | Export the display from cage's env |
| Cage GPU error | No /dev/dri/* access | Add user to `video` group or run under `weston --backend=headless-backend.so` (software rendering) |
| Black screenshots | Compositor not idle yet | Wait 500ms after cage launch before grim |
| wtype keys not reaching terminal | Terminal not focused | cage auto-focused the only window; if using nested compositor, ensure window focus |

## Recovery

- Cage crashes: `pkill -f cage` and relaunch
- Orphan wf-recorder: `pkill -f wf-recorder`
- Stale runtime dirs: remove `/run/user/$UID/tctl/*`
