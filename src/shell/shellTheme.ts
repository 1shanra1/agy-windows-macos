import type { AppId, TimeOfDay } from '../core/types';

export { MENUBAR_HEIGHT, SHELF_CLEARANCE } from '../core/types';

export const FONT_UI =
  'var(--font-ui, "Lucida Grande", "Lucida Sans Unicode", Tahoma, "Segoe UI", sans-serif)';
export const FONT_TITLE =
  'var(--font-title, "Trebuchet MS", "Lucida Grande", Tahoma, sans-serif)';
export const FONT_START =
  'var(--font-start, "Trebuchet MS", "Franklin Gothic Medium", sans-serif)';

export const APP_META: Record<AppId, { name: string; keywords: string[] }> = {
  navigator: {
    name: 'Navigator',
    keywords: ['finder', 'explorer', 'computer', 'files', 'folders', 'disk', 'trash', 'recycle'],
  },
  browser: {
    name: 'Safari Explorer',
    keywords: ['safari', 'internet', 'ie', 'web', 'wikipedia', 'wiki', 'browser'],
  },
  wordleaf: {
    name: 'WordLeaf',
    keywords: ['write', 'text', 'wordpad', 'notepad', 'pages', 'document', 'editor', 'md'],
  },
  'media-player': {
    name: 'Prism',
    keywords: ['music', 'audio', 'wmp', 'itunes', 'sound', 'player', 'visualizer'],
  },
  paint: {
    name: 'LunaPaint',
    keywords: ['draw', 'paint', 'mspaint', 'art', 'sketch', 'image'],
  },
  'sticky-notes': {
    name: 'Stickies',
    keywords: ['stickies', 'notes', 'memo', 'todo', 'reminder'],
  },
  'control-panel': {
    name: 'Control Panel',
    keywords: ['settings', 'preferences', 'wallpaper', 'theme', 'sound', 'display', 'accounts'],
  },
  about: {
    name: 'About Halcyon',
    keywords: ['about', 'version', 'specs', 'mac', 'xp', 'system'],
  },
};

export const TIME_OF_DAY_OPTIONS: { id: TimeOfDay; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'midday', label: 'Midday' },
  { id: 'golden', label: 'Golden Hour' },
  { id: 'midnight', label: 'Midnight' },
];

export const METAL_SURFACE_BACKGROUND = [
  `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9 0.012' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.10 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
  'linear-gradient(180deg, #E4E5E7 0%, #CFD1D4 55%, #BFC2C6 100%)',
].join(', ');
