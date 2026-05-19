# Windows (KVM) Capture

## Prerequisites

- **libvirt / qemu**: Hypervisor for running Windows VMs.
- **SPICE**: Protocol for remote display and input.
- **SSH**: Required for command execution and byte capture within the guest.

## Usage Pattern

1. Launch the KVM VM with SPICE enabled.
2. Use SSH to execute commands on the Windows guest.
3. Inject keystrokes via the SPICE protocol or native Windows APIs over SSH.

## Notes

Ensure `PI_AGENT_CONTROL_VM_*` environment variables are set to point to the correct VM instance and credentials.
