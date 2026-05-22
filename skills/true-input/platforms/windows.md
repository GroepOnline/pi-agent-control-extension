# Windows (KVM) True-Input

## Prerequisites

- **libvirt / qemu-kvm** — hypervisor for running Windows VMs
- **SPICE** — remote display and input protocol
- **virt-viewer** — SPICE client (optional)
- **SSH** — guest access for command execution

## Core Pattern

```
virsh send-key $VM --keycode $KEY
```

The KVM hypervisor injects raw HID keycodes into the Windows guest via `virsh send-key`. The Windows guest interprets these as standard HID keyboard input.

## Command Reference

| Action | Command |
|---|---|
| List VMs | `virsh list --all` |
| Start VM | `virsh start $VM_NAME` |
| Send key | `virsh send-key $VM_NAME --codeset xt KEY_ENTER` |
| Type text | Use SSH + PowerShell within the guest |
| Screenshot | `virsh screenshot $VM_NAME $OUTPUT.png` |
| Execute command | `ssh windows@vm-ip "powershell -Command Get-Process"` |

## Encoding Reference

KVM uses XT keycodes via `--codeset xt`. Common values:

| Windows Key | XT keycode | Notes |
|---|---|---|
| Enter | `KEY_ENTER` | |
| Escape | `KEY_ESC` | |
| Tab | `KEY_TAB` | |
| Backspace | `KEY_BACKSPACE` | |
| Delete | `KEY_DELETE` | |
| Shift | `KEY_LEFTSHIFT` | |
| Control | `KEY_LEFTCTRL` | |
| Alt | `KEY_LEFTALT` | |
| Windows (⊞) | `KEY_LEFTMETA` | |
| Arrow up/down/left/right | `KEY_UP` / `KEY_DOWN` / `KEY_LEFT` / `KEY_RIGHT` | |

Key chords: `virsh send-key $VM --codeset xt KEY_LEFTCTRL KEY_C` (Ctrl+C).

## SPICE Input (Alternative)

If SSH is unavailable, SPICE can forward mouse/keyboard directly:

```
remote-viewer spice://$VM_HOST:5900
```

Then inject keystrokes through the SPICE client window as if the VM is local.

## Recording

1. For screen recording, use SPICE passthrough to ffmpeg
2. Or use `virsh screenshot` per-frame for image sequences
3. For audio/video, enable SPICE streaming and capture via `gst-launch-1.0`

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `send-key` fails | VM not running | `virsh start $VM` first |
| Keys not reaching Windows app | Window not focused | Click inside the VM via SPICE first |
| SSH connection refused | Windows OpenSSH not running | Enable in Windows Settings > Apps > Optional Features |
| SPICE connection fails | Port not open | Add SPICE graphics with `--graphics spice,port=5900` |

## Recovery

- VM hang: `virsh reset $VM_NAME`
- Corrupt SPICE: close `remote-viewer` and reconnect
- Guest BSOD: `virsh destroy $VM_NAME && virsh start $VM_NAME`
