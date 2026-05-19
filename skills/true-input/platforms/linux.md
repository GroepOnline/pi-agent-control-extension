# Linux / Wayland Capture

## Prerequisites

- **cage**: Headless Wayland compositor.
- **wtype**: Wayland keystroke injection tool.
- **grim**: Wayland screenshot utility (optional).
- **wf-recorder**: Wayland screen recorder (optional).
- **GPU**: Access to `/dev/dri/*` for hardware acceleration.

## Usage Pattern

1. Launch a headless session: `cage -- <terminal-cmd>`
2. Identify the window or use global injection via `wtype`.
3. Capture output via `grim` or `wf-recorder`.

## Notes

Always ensure the `WAYLAND_DISPLAY` environment variable is correctly set within the cage session.
