# macOS (QEMU) True-Input

## Prerequisites

- **qemu-system-aarch64** — macOS VM emulation
- **socat** — QEMU monitor communication
- **SSH** — guest access for command execution

## Core Pattern

```
qemu-system-aarch64 -monitor stdio ... && sendkey via monitor
```

The QEMU monitor's `sendkey` command injects HID keystrokes into the guest. The macOS guest receives these as if typed on a real Apple keyboard.

## Command Reference

| Action | Command |
|---|---|
| Launch guest | `qemu-system-aarch64 -M virt -accel hvf -monitor tcp:127.0.0.1:4444,server,nowait -vnc :0 ...` |
| Send key via monitor | `echo "sendkey $KEY" \| nc -q 0 127.0.0.1 4444` |
| Execute command in guest | `ssh macguest "echo hello"` |
| Capture screenshot | Pull via VNC or `ssh macguest "screencapture -x /dev/stdout" \| base64 -d > screenshot.png` |

## Encoding Reference

QEMU `sendkey` uses the QEMU key name table. Common values:

| macOS Key | QEMU sendkey name | Notes |
|---|---|---|
| Command (⌘) | `meta_r` or `meta_l` | |
| Option (⌥) | `alt_r` or `alt_l` | |
| Control (⌃) | `ctrl` | |
| Shift (⇧) | `shift` | |
| Return | `ret` | |
| Escape | `esc` | |
| Tab | `tab` | |
| Delete | `backspace` | macOS forward delete = `delete` |
| Arrow up/down/left/right | `up`/`down`/`left`/`right` | |

Key chords: `sendkey ctrl-alt-f1` (spaces separate simultaneous keys).

## Recording

1. Use QEMU's VNC output for screen capture
2. Pipe VNC to ffmpeg: `ffmpeg -f vnc -i localhost:0 -c:v libx264 -preset ultrafast recording.mp4`
3. Or use `ssh macguest "screencapture -C -x /tmp/frame.png"` per-frame

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| VM boots to prohibitory sign | Missing macOS installer ISO | Use a real macOS recovery restore image |
| sendkey not responding | QEMU monitor disconnected | Check `-monitor` is properly configured |
| SSH slow or dropping | VM resource contention | Increase RAM: `-m 4096` |
| No display output | VNC not enabled | Add `-vnc :0` to QEMU args |

## Recovery

- Guest freeze: `pkill -f qemu-system` and relaunch VM
- Corrupt disk image: restore from backup or recreate with `qemu-img`
