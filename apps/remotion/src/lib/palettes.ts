export type Palette = {
  bg: string;
  panel: string;
  panel2: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
  shadow: string;
};

export const palettes: Record<string, Palette> = {
  warm: { bg: '#181818', panel: '#111111', panel2: '#1f1712', text: '#f4e8dc', muted: '#c5ad98', accent: '#ee6018', border: '#3a2a22', shadow: 'rgba(238,96,24,0.28)' },
  'pi-warm': { bg: '#181818', panel: '#111111', panel2: '#1f1712', text: '#f4e8dc', muted: '#c5ad98', accent: '#ee6018', border: '#3a2a22', shadow: 'rgba(238,96,24,0.28)' },
  'warm-hero': { bg: '#20130d', panel: '#111111', panel2: '#2c160a', text: '#fff3e8', muted: '#d3b89e', accent: '#ee6018', border: '#4a2a18', shadow: 'rgba(238,96,24,0.38)' },
  'pi-hero': { bg: '#20130d', panel: '#111111', panel2: '#2c160a', text: '#fff3e8', muted: '#d3b89e', accent: '#ee6018', border: '#4a2a18', shadow: 'rgba(238,96,24,0.38)' },
  hero: { bg: '#11111b', panel: '#181825', panel2: '#1e1e2e', text: '#f5e0dc', muted: '#cdd6f4', accent: '#89b4fa', border: '#313244', shadow: 'rgba(137,180,250,0.25)' },
  macos: { bg: '#0b0b12', panel: '#11111b', panel2: '#181825', text: '#cdd6f4', muted: '#a6adc8', accent: '#89b4fa', border: '#313244', shadow: 'rgba(0,0,0,0.5)' },
  presentation: { bg: '#000000', panel: '#111111', panel2: '#1b1b1b', text: '#ffffff', muted: '#b8b8b8', accent: '#89b4fa', border: '#2c2c2c', shadow: 'rgba(0,0,0,0.6)' },
  minimal: { bg: '#0b0b0f', panel: '#0f0f14', panel2: '#14141a', text: '#e8e8ea', muted: '#a0a0aa', accent: '#89b4fa', border: '#24242c', shadow: 'rgba(0,0,0,0.3)' },
  'dark-pro': { bg: '#080810', panel: '#0d0d18', panel2: '#121220', text: '#e2e2f0', muted: '#8888aa', accent: '#7c6af7', border: '#1e1e32', shadow: 'rgba(124,106,247,0.22)' },
  neon: { bg: '#0a0a14', panel: '#11111b', panel2: '#181825', text: '#f5e0dc', muted: '#cdd6f4', accent: '#ff79c6', border: '#313244', shadow: 'rgba(255,121,198,0.35)' },
  paper: { bg: '#1a1814', panel: '#24201a', panel2: '#2e2920', text: '#e8dcc8', muted: '#b8a898', accent: '#c78a50', border: '#4a3e2e', shadow: 'rgba(199,138,80,0.25)' },
  ocean: { bg: '#0b1218', panel: '#111b24', panel2: '#182430', text: '#d0e4f0', muted: '#8aaec8', accent: '#4fc3f7', border: '#1e3448', shadow: 'rgba(79,195,247,0.25)' },
};
