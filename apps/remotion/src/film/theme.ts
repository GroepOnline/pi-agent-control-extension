export const theme = {
  bg: "#F7F6F5",
  surface: "#FFFFFF",
  sunk: "#EFEFEF",
  text: "#191919",
  muted: "rgba(0,0,0,0.55)",
  faint: "rgba(0,0,0,0.38)",
  line: "rgba(0,0,0,0.08)",
  lineStrong: "rgba(0,0,0,0.14)",
  accent: "#317CFF",
  accentInk: "#1D5FD6",
  accentSoft: "rgba(49,124,255,0.09)",
  green: "#1F883D",
} as const;

export const type = {
  display: '"Instrument Serif", Georgia, serif',
  sans: '"General Sans", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
} as const;

export const layout = {
  width: 1920,
  height: 1080,
  fps: 30,
  padX: 120,
  padY: 96,
} as const;
