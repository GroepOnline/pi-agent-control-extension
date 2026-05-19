# macOS (QEMU) Capture

## Prerequisites

- **qemu**: Required for emulating macOS.
- **socat**: Used for communicating with the QEMU monitor.
- **SSH**: Required for command execution and byte capture within the guest.

## Usage Pattern

1. Launch the macOS guest via QEMU.
2. Connect via SSH to the guest for command execution.
3. Monitor byte sequences emitted by the terminal via the QEMU console or SSH session logs.

## Notes

Ensure `PI_AGENT_CONTROL_MAC_*` environment variables are set to point to the correct macOS VM image and SSH configuration.
