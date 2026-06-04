# Windows (KVM) PTY Byte Capture

## Capture Architecture

```
Terminal (Windows Terminal/ConHost) → Windows inside KVM → SSH/PowerShell → byte capture
```

The Windows guest runs inside KVM. Byte sequences from the terminal are captured by running a loopback capture inside the guest (e.g., a PowerShell script that reads from the console API) and streaming results to a file or stdout that can be retrieved over SSH.

## Prerequisites

- **libvirt / qemu-kvm** — hypervisor
- **SSH** — Windows OpenSSH server enabled in the guest
- **PowerShell** — for running capture scripts inside the guest

## Usage Pattern

1. **Start the Windows VM**: `virsh start $VM_NAME`
2. **SSH into the guest**: `ssh windows@vm-ip`
3. **Start a terminal inside Windows** (Windows Terminal, ConHost, or PowerShell)
4. **Capture bytes**: Use a PowerShell capture script that logs WriteFile calls or pipe through `Tee-Object`
5. **Inject keystrokes** via `virsh send-key`
6. **Read logs**: `ssh windows@vm-ip "Get-Content C:\capture\byte-log.txt"`

## Platform-Specific Notes

- Windows Terminal uses `TERM=xterm-256color` in WSL contexts, but native console uses different encoding
- Use `[Console]::OutputEncoding` in PowerShell to check/change the active code page
- For raw byte capture, a kernel-level driver or API hook (e.g., `SetWindowsHookEx`) may be needed for precise injection-to-emission tracing
- The `PiAgentControl` service (if installed) can relay terminal byte streams to a network socket for external capture
