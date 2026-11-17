import React, { useId } from 'react';

function useSafeId(prefix: string): string {
  const raw = useId();
  return `${prefix}_${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

export type UIGlyphName =
  // Tier 1 — Machined glyphs (16px grid, also 12/14/20)
  | 'back'
  | 'forward'
  | 'up'
  | 'down'
  | 'reload'
  | 'stop'
  | 'home'
  | 'search'
  | 'close'
  | 'check'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-double'
  | 'disclosure'
  | 'plus'
  | 'minus'
  | 'sidebar'
  | 'list'
  | 'grid'
  | 'columns'
  | 'bookmark'
  | 'share'
  | 'lock'
  | 'shield'
  | 'info'
  | 'warning'
  | 'gear'
  | 'power'
  | 'user'
  | 'bell'
  | 'speaker'
  | 'speaker-mute'
  | 'wifi'
  | 'battery'
  | 'control'
  | 'clock'
  | 'trash'
  | 'star'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-justify'
  | 'list-bullet'
  | 'list-number'
  | 'link'
  | 'image'
  | 'play'
  | 'pause'
  | 'prev'
  | 'next'
  | 'stop-media'
  | 'shuffle'
  | 'repeat'
  | 'eq'
  // Tier 2 — Dimensional toolbar & jewel objects (16–32px)
  | 'new-doc'
  | 'open-folder'
  | 'save-disk'
  | 'print'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'loupe'
  | 'shield-enamel'
  | 'undo'
  | 'redo'
  | 'orb-back'
  | 'orb-forward'
  | 'orb-back-disabled'
  | 'orb-forward-disabled'
  | 'all-programs'
  | 'go'
  | 'key-jewel'
  | 'power-jewel'
  | 'standby-jewel';

export interface UIGlyphProps {
  name: UIGlyphName;
  size?: number;
  tone?: 'dark' | 'light' | 'auto';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const TIER2_NAMES = new Set<UIGlyphName>([
  'new-doc',
  'open-folder',
  'save-disk',
  'print',
  'cut',
  'copy',
  'paste',
  'loupe',
  'shield-enamel',
  'undo',
  'redo',
  'orb-back',
  'orb-forward',
  'orb-back-disabled',
  'orb-forward-disabled',
  'all-programs',
  'go',
  'key-jewel',
  'power-jewel',
  'standby-jewel',
]);

function renderTier1Path(name: UIGlyphName): React.ReactNode {
  switch (name) {
    // Solid chevron-arrows: 2px shaft + 7px wedge head, 0.5px rounded corners
    case 'back':
      return (
        <path d="M 8.5 3.6 L 3.2 8 L 8.5 12.4 L 8.5 9.1 L 13.4 9.1 C 13.8 9.1 14 8.8 14 8.4 L 14 7.6 C 14 7.2 13.8 6.9 13.4 6.9 L 8.5 6.9 Z" />
      );
    case 'forward':
      return (
        <path d="M 7.5 3.6 L 12.8 8 L 7.5 12.4 L 7.5 9.1 L 2.6 9.1 C 2.2 9.1 2 8.8 2 8.4 L 2 7.6 C 2 7.2 2.2 6.9 2.6 6.9 L 7.5 6.9 Z" />
      );
    case 'up':
      return (
        <path d="M 3.6 8.5 L 8 3.2 L 12.4 8.5 L 9.1 8.5 L 9.1 13.4 C 9.1 13.8 8.8 14 8.4 14 L 7.6 14 C 7.2 14 6.9 13.8 6.9 13.4 L 6.9 8.5 Z" />
      );
    case 'down':
      return (
        <path d="M 3.6 7.5 L 8 12.8 L 12.4 7.5 L 9.1 7.5 L 9.1 2.6 C 9.1 2.2 8.8 2 8.4 2 L 7.6 2 C 7.2 2 6.9 2.2 6.9 2.6 L 6.9 7.5 Z" />
      );
    case 'reload':
      return (
        <path d="M 8 2.2 C 4.8 2.2 2.2 4.8 2.2 8 C 2.2 11.2 4.8 13.8 8 13.8 C 10.6 13.8 12.8 12.1 13.5 9.7 L 11.4 9.1 C 10.9 10.6 9.6 11.7 8 11.7 C 6 11.7 4.3 10 4.3 8 C 4.3 6 6 4.3 8 4.3 C 9.2 4.3 10.3 4.9 11 5.8 L 9.2 7.2 L 14 7.6 L 13.6 2.8 L 12.3 4.1 C 11.3 2.9 9.7 2.2 8 2.2 Z" />
      );
    case 'stop':
      return (
        <path d="M 5.4 2.5 L 10.6 2.5 L 13.5 5.4 L 13.5 10.6 L 10.6 13.5 L 5.4 13.5 L 2.5 10.6 L 2.5 5.4 Z" />
      );
    case 'home':
      return (
        <path d="M 8 2.1 L 1.8 7.6 L 3.4 7.6 L 3.4 13.6 L 6.6 13.6 L 6.6 9.6 L 9.4 9.6 L 9.4 13.6 L 12.6 13.6 L 12.6 7.6 L 14.2 7.6 Z" />
      );
    case 'search':
      return (
        <path
          fillRule="evenodd"
          d="M 6.8 2.2 C 4.25 2.2 2.2 4.25 2.2 6.8 C 2.2 9.35 4.25 11.4 6.8 11.4 C 7.8 11.4 8.75 11.08 9.52 10.54 L 12.55 13.58 C 12.85 13.88 13.35 13.88 13.65 13.58 C 13.95 13.28 13.95 12.78 13.65 12.48 L 10.62 9.45 C 11.12 8.7 11.4 7.78 11.4 6.8 C 11.4 4.25 9.35 2.2 6.8 2.2 Z M 6.8 4.0 C 8.35 4.0 9.6 5.25 9.6 6.8 C 9.6 8.35 8.35 9.6 6.8 9.6 C 5.25 9.6 4.0 8.35 4.0 6.8 C 4.0 5.25 5.25 4.0 6.8 4.0 Z"
        />
      );
    case 'close':
      return (
        <path d="M 4.1 3.0 L 8 6.9 L 11.9 3.0 L 13.0 4.1 L 9.1 8 L 13.0 11.9 L 11.9 13.0 L 8 9.1 L 4.1 13.0 L 3.0 11.9 L 6.9 8 L 3.0 4.1 Z" />
      );
    case 'check':
      return (
        <path d="M 13.6 4.2 L 6.4 12.1 L 2.5 8.3 L 3.9 6.9 L 6.3 9.2 L 12.2 2.8 Z" />
      );
    case 'chevron-right':
      return <path d="M 6.0 3.4 L 10.8 8 L 6.0 12.6 L 4.8 11.4 L 8.4 8 L 4.8 4.6 Z" />;
    case 'chevron-down':
      return <path d="M 3.4 6.0 L 8 10.8 L 12.6 6.0 L 11.4 4.8 L 8 8.4 L 4.6 4.8 Z" />;
    case 'chevron-double':
      return (
        <>
          <path d="M 5.2 6.4 L 8 3.1 L 10.8 6.4 Z" />
          <path d="M 5.2 9.6 L 8 12.9 L 10.8 9.6 Z" />
        </>
      );
    case 'disclosure':
      return <path d="M 5.2 4.2 L 11.2 8 L 5.2 11.8 Z" />;
    case 'plus':
      return <path d="M 7 3 L 9 3 L 9 7 L 13 7 L 13 9 L 9 9 L 9 13 L 7 13 L 7 9 L 3 9 L 3 7 L 7 7 Z" />;
    case 'minus':
      return <rect x="3" y="7" width="10" height="2" rx="0.4" />;
    case 'sidebar':
      return (
        <path
          fillRule="evenodd"
          d="M 2 3.2 C 2 2.5 2.5 2 3.2 2 L 12.8 2 C 13.5 2 14 2.5 14 3.2 L 14 12.8 C 14 13.5 13.5 14 12.8 14 L 3.2 14 C 2.5 14 2 13.5 2 12.8 Z M 6.4 3.6 L 6.4 12.4 L 12.4 12.4 L 12.4 3.6 Z"
        />
      );
    case 'list':
      return (
        <>
          <rect x="2.2" y="3.2" width="11.6" height="2" rx="0.4" />
          <rect x="2.2" y="7" width="11.6" height="2" rx="0.4" />
          <rect x="2.2" y="10.8" width="11.6" height="2" rx="0.4" />
        </>
      );
    case 'grid':
      return (
        <>
          <rect x="2.4" y="2.4" width="4.8" height="4.8" rx="0.8" />
          <rect x="8.8" y="2.4" width="4.8" height="4.8" rx="0.8" />
          <rect x="2.4" y="8.8" width="4.8" height="4.8" rx="0.8" />
          <rect x="8.8" y="8.8" width="4.8" height="4.8" rx="0.8" />
        </>
      );
    case 'columns':
      return (
        <path
          fillRule="evenodd"
          d="M 2 3 C 2 2.4 2.4 2 3 2 L 13 2 C 13.6 2 14 2.4 14 3 L 14 13 C 14 13.6 13.6 14 13 14 L 3 14 C 2.4 14 2 13.6 2 13 Z M 3.5 3.6 L 5.8 3.6 L 5.8 12.4 L 3.5 12.4 Z M 6.9 3.6 L 9.1 3.6 L 9.1 12.4 L 6.9 12.4 Z M 10.2 3.6 L 12.5 3.6 L 12.5 12.4 L 10.2 12.4 Z"
        />
      );
    case 'bookmark':
      return <path d="M 4 2.2 L 12 2.2 L 12 14 L 8 11.1 L 4 14 Z" />;
    case 'share':
      return (
        <>
          <path d="M 8 1.8 L 4.8 5.2 L 7 5.2 L 7 9.6 L 9 9.6 L 9 5.2 L 11.2 5.2 Z" />
          <path d="M 3 7.5 L 4.8 7.5 L 4.8 12.2 L 11.2 12.2 L 11.2 7.5 L 13 7.5 L 13 13.8 L 3 13.8 Z" />
        </>
      );
    case 'lock':
      return (
        <path
          fillRule="evenodd"
          d="M 8 2 C 6.1 2 4.6 3.5 4.6 5.4 L 4.6 7 L 3.4 7 C 2.8 7 2.4 7.4 2.4 8 L 2.4 13 C 2.4 13.6 2.8 14 3.4 14 L 12.6 14 C 13.2 14 13.6 13.6 13.6 13 L 13.6 8 C 13.6 7.4 13.2 7 12.6 7 L 11.4 7 L 11.4 5.4 C 11.4 3.5 9.9 2 8 2 Z M 6.3 5.4 C 6.3 4.4 7.05 3.6 8 3.6 C 8.95 3.6 9.7 4.4 9.7 5.4 L 9.7 7 L 6.3 7 Z"
        />
      );
    case 'shield':
      return (
        <path
          fillRule="evenodd"
          d="M 8 1.8 L 2.8 3.8 L 2.8 7.6 C 2.8 10.9 5.0 13.5 8 14.3 C 11.0 13.5 13.2 10.9 13.2 7.6 L 13.2 3.8 Z M 7.3 10.7 L 4.9 8.3 L 5.9 7.3 L 7.3 8.7 L 10.4 5.5 L 11.4 6.5 Z"
        />
      );
    case 'info':
      return (
        <path
          fillRule="evenodd"
          d="M 8 1.8 C 4.6 1.8 1.8 4.6 1.8 8 C 1.8 11.4 4.6 14.2 8 14.2 C 11.4 14.2 14.2 11.4 14.2 8 C 14.2 4.6 11.4 1.8 8 1.8 Z M 7.1 4.2 L 8.9 4.2 L 8.9 5.9 L 7.1 5.9 Z M 7.1 7.0 L 8.9 7.0 L 8.9 11.8 L 7.1 11.8 Z"
        />
      );
    case 'warning':
      return (
        <path
          fillRule="evenodd"
          d="M 8 1.9 L 1.6 13.3 L 14.4 13.3 Z M 7.1 5.8 L 8.9 5.8 L 8.7 9.6 L 7.3 9.6 Z M 7.1 10.6 L 8.9 10.6 L 8.9 12.1 L 7.1 12.1 Z"
        />
      );
    case 'gear':
      return (
        <path
          fillRule="evenodd"
          d="M 6.8 1.6 L 9.2 1.6 L 9.6 3.3 L 11.1 2.7 L 12.9 4.5 L 12.1 6.0 L 13.8 6.8 L 13.8 9.2 L 12.1 9.6 L 12.9 11.3 L 11.1 13.1 L 9.5 12.3 L 9.2 14.1 L 6.8 14.1 L 6.4 12.3 L 4.8 13.1 L 3.0 11.3 L 3.8 9.7 L 2.0 9.2 L 2.0 6.8 L 3.8 6.2 L 3.0 4.5 L 4.8 2.7 L 6.4 3.4 Z M 8 5.4 C 6.55 5.4 5.4 6.55 5.4 8 C 5.4 9.45 6.55 10.6 8 10.6 C 9.45 10.6 10.6 9.45 10.6 8 C 10.6 6.55 9.45 5.4 8 5.4 Z"
        />
      );
    case 'power':
      return (
        <>
          <rect x="7.1" y="1.8" width="1.8" height="6.2" rx="0.8" />
          <path d="M 5.1 3.7 C 3.3 4.8 2.3 6.7 2.4 8.8 C 2.6 11.8 5.1 14.1 8 14.1 C 10.9 14.1 13.4 11.8 13.6 8.8 C 13.7 6.7 12.7 4.8 10.9 3.7 L 9.9 5.3 C 11.1 6.0 11.8 7.3 11.7 8.7 C 11.5 10.7 9.9 12.2 8 12.2 C 6.1 12.2 4.5 10.7 4.3 8.7 C 4.2 7.3 4.9 6.0 6.1 5.3 Z" />
        </>
      );
    case 'user':
      return (
        <>
          <circle cx="8" cy="5.0" r="2.7" />
          <path d="M 2.8 13.6 C 2.8 10.4 5.1 8.8 8 8.8 C 10.9 8.8 13.2 10.4 13.2 13.6 Z" />
        </>
      );
    case 'bell':
      return (
        <>
          <path d="M 8 2 C 5.5 2 4.0 3.8 4.0 6.4 L 4.0 10.2 L 2.6 11.8 L 13.4 11.8 L 12.0 10.2 L 12.0 6.4 C 12.0 3.8 10.5 2 8 2 Z" />
          <path d="M 6.3 12.4 C 6.5 13.4 7.2 14.0 8 14.0 C 8.8 14.0 9.5 13.4 9.7 12.4 Z" />
        </>
      );
    case 'speaker':
      return (
        <>
          <path d="M 2.2 6.0 L 5.2 6.0 L 8.8 2.9 L 8.8 13.1 L 5.2 10.0 L 2.2 10.0 Z" />
          <path d="M 10.4 5.2 C 11.6 6.2 11.6 9.8 10.4 10.8 L 11.6 12.0 C 13.4 10.3 13.4 5.7 11.6 4.0 Z" />
          <path d="M 12.4 3.1 C 14.5 5.2 14.5 10.8 12.4 12.9 L 13.5 14.0 C 16.0 11.2 16.0 4.8 13.5 2.0 Z" opacity="0.85" />
        </>
      );
    case 'speaker-mute':
      return (
        <>
          <path d="M 2.2 6.0 L 5.2 6.0 L 8.8 2.9 L 8.8 13.1 L 5.2 10.0 L 2.2 10.0 Z" />
          <path d="M 10.5 5.6 L 12.2 7.3 L 13.9 5.6 L 14.9 6.6 L 13.2 8.3 L 14.9 10.0 L 13.9 11.0 L 12.2 9.3 L 10.5 11.0 L 9.5 10.0 L 11.2 8.3 L 9.5 6.6 Z" />
        </>
      );
    case 'wifi':
      return (
        <>
          <path d="M 1.6 5.6 C 5.1 2.4 10.9 2.4 14.4 5.6 L 13.1 6.9 C 10.2 4.3 5.8 4.3 2.9 6.9 Z" />
          <path d="M 3.9 8.1 C 6.2 6.0 9.8 6.0 12.1 8.1 L 10.8 9.4 C 9.2 7.9 6.8 7.9 5.2 9.4 Z" />
          <path d="M 6.1 10.5 C 7.2 9.5 8.8 9.5 9.9 10.5 L 8.0 13.2 Z" />
        </>
      );
    case 'battery':
      return (
        <>
          <path
            fillRule="evenodd"
            d="M 1.5 4.4 C 1.5 3.9 1.9 3.5 2.4 3.5 L 12.2 3.5 C 12.7 3.5 13.1 3.9 13.1 4.4 L 13.1 11.6 C 13.1 12.1 12.7 12.5 12.2 12.5 L 2.4 12.5 C 1.9 12.5 1.5 12.1 1.5 11.6 Z M 3.0 5.0 L 11.6 5.0 L 11.6 11.0 L 3.0 11.0 Z"
          />
          <rect x="4.0" y="6.0" width="6.6" height="4.0" rx="0.4" />
          <rect x="13.5" y="6.3" width="1.4" height="3.4" rx="0.4" />
        </>
      );
    case 'control':
      return (
        <>
          <rect x="2" y="3.2" width="12" height="1.8" rx="0.6" />
          <rect x="2" y="7.1" width="12" height="1.8" rx="0.6" />
          <rect x="2" y="11.0" width="12" height="1.8" rx="0.6" />
          <circle cx="10.5" cy="4.1" r="2.0" />
          <circle cx="5.4" cy="8.0" r="2.0" />
          <circle cx="9.6" cy="11.9" r="2.0" />
        </>
      );
    case 'clock':
      return (
        <path
          fillRule="evenodd"
          d="M 8 1.8 C 4.6 1.8 1.8 4.6 1.8 8 C 1.8 11.4 4.6 14.2 8 14.2 C 11.4 14.2 14.2 11.4 14.2 8 C 14.2 4.6 11.4 1.8 8 1.8 Z M 8 3.5 C 10.5 3.5 12.5 5.5 12.5 8 C 12.5 10.5 10.5 12.5 8 12.5 C 5.5 12.5 3.5 10.5 3.5 8 C 3.5 5.5 5.5 3.5 8 3.5 Z M 7.2 4.6 L 7.2 8.5 L 10.7 10.3 L 11.4 8.9 L 8.7 7.5 L 8.7 4.6 Z"
        />
      );
    case 'trash':
      return (
        <>
          <path d="M 5.6 2.0 L 10.4 2.0 L 11.0 3.2 L 13.6 3.2 L 13.6 4.7 L 2.4 4.7 L 2.4 3.2 L 5.0 3.2 Z" />
          <path d="M 3.6 5.6 L 12.4 5.6 L 11.6 13.8 L 4.4 13.8 Z" />
        </>
      );
    case 'star':
      return (
        <path d="M 8 1.8 L 9.9 5.7 L 14.2 6.3 L 11.1 9.3 L 11.8 13.6 L 8 11.6 L 4.2 13.6 L 4.9 9.3 L 1.8 6.3 L 6.1 5.7 Z" />
      );
    case 'bold':
      return (
        <path
          fillRule="evenodd"
          d="M 4.0 2.6 L 8.9 2.6 C 11.0 2.6 12.3 3.7 12.3 5.3 C 12.3 6.5 11.6 7.3 10.5 7.7 C 11.9 8.0 12.7 9.0 12.7 10.4 C 12.7 12.3 11.2 13.4 8.9 13.4 L 4.0 13.4 Z M 6.4 4.5 L 6.4 7.0 L 8.5 7.0 C 9.4 7.0 10.0 6.5 10.0 5.7 C 10.0 4.9 9.4 4.5 8.5 4.5 Z M 6.4 8.8 L 6.4 11.5 L 8.7 11.5 C 9.7 11.5 10.3 11.0 10.3 10.1 C 10.3 9.2 9.7 8.8 8.7 8.8 Z"
        />
      );
    case 'italic':
      return <path d="M 6.4 2.6 L 11.8 2.6 L 11.4 4.3 L 9.6 4.3 L 8.1 11.7 L 9.9 11.7 L 9.5 13.4 L 4.1 13.4 L 4.5 11.7 L 6.2 11.7 L 7.7 4.3 L 6.0 4.3 Z" />;
    case 'underline':
      return (
        <>
          <path d="M 4.1 2.4 L 6.1 2.4 L 6.1 7.6 C 6.1 9.0 6.9 9.7 8 9.7 C 9.1 9.7 9.9 9.0 9.9 7.6 L 9.9 2.4 L 11.9 2.4 L 11.9 7.6 C 11.9 10.1 10.3 11.5 8 11.5 C 5.7 11.5 4.1 10.1 4.1 7.6 Z" />
          <rect x="3.2" y="12.4" width="9.6" height="1.6" rx="0.4" />
        </>
      );
    case 'strike':
      return (
        <>
          <path d="M 11.4 4.6 C 10.6 3.7 9.4 3.3 8.1 3.3 C 6.5 3.3 5.5 4.0 5.5 5.1 C 5.5 5.9 6.0 6.4 7.0 6.7 L 4.1 6.7 C 3.9 6.2 3.8 5.6 3.8 5.0 C 3.8 3.0 5.6 1.8 8.2 1.8 C 10.1 1.8 11.6 2.5 12.6 3.6 Z" />
          <rect x="2.2" y="7.3" width="11.6" height="1.5" rx="0.4" />
          <path d="M 9.1 9.5 C 10.2 9.8 10.7 10.3 10.7 11.1 C 10.7 12.2 9.6 12.9 7.9 12.9 C 6.4 12.9 5.1 12.3 4.2 11.3 L 3.0 12.4 C 4.1 13.7 5.8 14.3 7.8 14.3 C 10.7 14.3 12.5 13.0 12.5 11.0 C 12.5 10.3 12.3 9.8 12.0 9.4 Z" />
        </>
      );
    case 'align-left':
      return (
        <>
          <rect x="2" y="2.6" width="12" height="1.7" rx="0.4" />
          <rect x="2" y="5.6" width="8.2" height="1.7" rx="0.4" />
          <rect x="2" y="8.6" width="12" height="1.7" rx="0.4" />
          <rect x="2" y="11.6" width="9.5" height="1.7" rx="0.4" />
        </>
      );
    case 'align-center':
      return (
        <>
          <rect x="2" y="2.6" width="12" height="1.7" rx="0.4" />
          <rect x="3.9" y="5.6" width="8.2" height="1.7" rx="0.4" />
          <rect x="2" y="8.6" width="12" height="1.7" rx="0.4" />
          <rect x="3.2" y="11.6" width="9.6" height="1.7" rx="0.4" />
        </>
      );
    case 'align-right':
      return (
        <>
          <rect x="2" y="2.6" width="12" height="1.7" rx="0.4" />
          <rect x="5.8" y="5.6" width="8.2" height="1.7" rx="0.4" />
          <rect x="2" y="8.6" width="12" height="1.7" rx="0.4" />
          <rect x="4.5" y="11.6" width="9.5" height="1.7" rx="0.4" />
        </>
      );
    case 'align-justify':
      return (
        <>
          <rect x="2" y="2.6" width="12" height="1.7" rx="0.4" />
          <rect x="2" y="5.6" width="12" height="1.7" rx="0.4" />
          <rect x="2" y="8.6" width="12" height="1.7" rx="0.4" />
          <rect x="2" y="11.6" width="12" height="1.7" rx="0.4" />
        </>
      );
    case 'list-bullet':
      return (
        <>
          <circle cx="3.3" cy="3.8" r="1.2" />
          <circle cx="3.3" cy="8.0" r="1.2" />
          <circle cx="3.3" cy="12.2" r="1.2" />
          <rect x="5.8" y="2.9" width="8.2" height="1.8" rx="0.4" />
          <rect x="5.8" y="7.1" width="8.2" height="1.8" rx="0.4" />
          <rect x="5.8" y="11.3" width="8.2" height="1.8" rx="0.4" />
        </>
      );
    case 'list-number':
      return (
        <>
          <path d="M 2.3 2.5 L 3.8 2.5 L 3.8 5.4 L 2.8 5.4 L 2.8 3.4 L 2.3 3.4 Z" />
          <path d="M 2.1 7.0 C 2.1 6.4 2.6 6.0 3.3 6.0 C 4.0 6.0 4.5 6.4 4.5 7.0 C 4.5 7.6 3.9 8.0 3.1 8.5 L 4.5 8.5 L 4.5 9.3 L 2.1 9.3 L 2.1 8.6 C 3.0 8.0 3.6 7.5 3.6 7.1 C 3.6 6.8 3.4 6.7 3.2 6.7 C 2.9 6.7 2.8 6.9 2.8 7.1 Z" />
          <path d="M 2.2 10.6 L 4.4 10.6 L 4.4 11.4 L 3.6 11.9 C 4.2 12.0 4.5 12.4 4.5 12.9 C 4.5 13.5 3.9 14.0 3.2 14.0 C 2.6 14.0 2.1 13.7 1.9 13.3 L 2.6 12.8 C 2.7 13.1 2.9 13.2 3.2 13.2 C 3.5 13.2 3.7 13.0 3.7 12.8 C 3.7 12.5 3.4 12.3 2.9 12.3 L 2.9 11.6 L 3.5 11.3 L 2.2 11.3 Z" />
          <rect x="6.0" y="2.9" width="8.0" height="1.8" rx="0.4" />
          <rect x="6.0" y="7.1" width="8.0" height="1.8" rx="0.4" />
          <rect x="6.0" y="11.3" width="8.0" height="1.8" rx="0.4" />
        </>
      );
    case 'link':
      return (
        <>
          <path d="M 6.5 10.4 L 5.6 11.3 C 4.7 12.2 3.3 12.2 2.4 11.3 C 1.5 10.4 1.5 9.0 2.4 8.1 L 4.6 5.9 C 5.5 5.0 6.9 5.0 7.8 5.9 L 6.7 7.0 C 6.3 6.6 5.8 6.7 5.5 7.0 L 3.5 9.0 C 3.2 9.3 3.2 9.9 3.5 10.2 C 3.8 10.5 4.4 10.5 4.7 10.2 L 5.5 9.4 Z" />
          <path d="M 9.5 5.6 L 10.4 4.7 C 11.3 3.8 12.7 3.8 13.6 4.7 C 14.5 5.6 14.5 7.0 13.6 7.9 L 11.4 10.1 C 10.5 11.0 9.1 11.0 8.2 10.1 L 9.3 9.0 C 9.7 9.4 10.2 9.3 10.5 9.0 L 12.5 7.0 C 12.8 6.7 12.8 6.1 12.5 5.8 C 12.2 5.5 11.6 5.5 11.3 5.8 L 10.5 6.6 Z" />
          <path d="M 5.6 9.3 L 9.3 5.6 L 10.4 6.7 L 6.7 10.4 Z" />
        </>
      );
    case 'image':
      return (
        <path
          fillRule="evenodd"
          d="M 2 3.2 C 2 2.5 2.5 2 3.2 2 L 12.8 2 C 13.5 2 14 2.5 14 3.2 L 14 12.8 C 14 13.5 13.5 14 12.8 14 L 3.2 14 C 2.5 14 2 13.5 2 12.8 Z M 5.4 5.2 C 4.7 5.2 4.2 5.7 4.2 6.4 C 4.2 7.1 4.7 7.6 5.4 7.6 C 6.1 7.6 6.6 7.1 6.6 6.4 C 6.6 5.7 6.1 5.2 5.4 5.2 Z M 3.4 12.2 L 12.6 12.2 L 9.7 8.1 L 7.6 10.5 L 6.2 9.1 Z"
        />
      );
    case 'play':
      return <path d="M 4.4 2.6 L 12.8 8 L 4.4 13.4 Z" />;
    case 'pause':
      return (
        <>
          <rect x="3.8" y="2.8" width="2.8" height="10.4" rx="0.5" />
          <rect x="9.4" y="2.8" width="2.8" height="10.4" rx="0.5" />
        </>
      );
    case 'prev':
      return (
        <>
          <rect x="2.6" y="3.2" width="1.9" height="9.6" rx="0.4" />
          <path d="M 8.6 3.5 L 4.4 8 L 8.6 12.5 Z" />
          <path d="M 13.2 3.5 L 9.0 8 L 13.2 12.5 Z" />
        </>
      );
    case 'next':
      return (
        <>
          <path d="M 2.8 3.5 L 7.0 8 L 2.8 12.5 Z" />
          <path d="M 7.4 3.5 L 11.6 8 L 7.4 12.5 Z" />
          <rect x="11.5" y="3.2" width="1.9" height="9.6" rx="0.4" />
        </>
      );
    case 'stop-media':
      return <rect x="3.5" y="3.5" width="9" height="9" rx="0.8" />;
    case 'shuffle':
      return (
        <>
          <path d="M 2 4.3 L 5.4 4.3 L 10.3 10.1 L 11.5 10.1 L 11.5 8.5 L 14.3 11.0 L 11.5 13.5 L 11.5 11.8 L 9.5 11.8 L 4.6 6.0 L 2 6.0 Z" />
          <path d="M 2 10.1 L 4.6 10.1 L 6.3 8.1 L 7.4 9.4 L 5.4 11.8 L 2 11.8 Z" />
          <path d="M 8.4 5.7 L 9.5 4.3 L 11.5 4.3 L 11.5 2.7 L 14.3 5.2 L 11.5 7.7 L 11.5 6.0 L 10.3 6.0 L 9.5 7.0 Z" />
        </>
      );
    case 'repeat':
      return (
        <>
          <path d="M 3.2 4.5 L 11.2 4.5 L 11.2 2.7 L 14.2 5.3 L 11.2 7.9 L 11.2 6.2 L 4.6 6.2 L 4.6 8.3 L 3.0 8.3 L 3.0 4.7 C 3.0 4.6 3.1 4.5 3.2 4.5 Z" />
          <path d="M 12.8 11.5 L 4.8 11.5 L 4.8 13.3 L 1.8 10.7 L 4.8 8.1 L 4.8 9.8 L 11.4 9.8 L 11.4 7.7 L 13.0 7.7 L 13.0 11.3 C 13.0 11.4 12.9 11.5 12.8 11.5 Z" />
        </>
      );
    case 'eq':
      return (
        <>
          <rect x="2.2" y="8.2" width="2.2" height="5.2" rx="0.4" />
          <rect x="5.4" y="3.0" width="2.2" height="10.4" rx="0.4" />
          <rect x="8.6" y="5.8" width="2.2" height="7.6" rx="0.4" />
          <rect x="11.8" y="4.2" width="2.2" height="9.2" rx="0.4" />
        </>
      );
    default:
      return null;
  }
}

function renderTier2(
  name: UIGlyphName,
  uid: string,
  disabled: boolean
): React.ReactNode {
  switch (name) {
    case 'new-doc':
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}_p`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E6E8E4" />
            </linearGradient>
          </defs>
          <path
            d="M 5 3 L 15.5 3 L 20 7.5 L 20 21 L 5 21 Z"
            fill={`url(#${uid}_p)`}
            stroke="#596270"
            strokeWidth="1.1"
          />
          <path d="M 15.5 3 L 15.5 7.5 L 20 7.5 Z" fill="#C4CCD8" stroke="#596270" strokeWidth="0.9" />
          <path d="M 16.5 3.6 L 19.4 6.5 L 16.5 6.5 Z" fill="#4E96F0" />
          <line x1="8" y1="10.5" x2="17" y2="10.5" stroke="#9AA5B4" strokeWidth="1.2" />
          <line x1="8" y1="14" x2="16" y2="14" stroke="#B6C0CC" strokeWidth="1.2" />
          <line x1="8" y1="17.5" x2="13.5" y2="17.5" stroke="#B6C0CC" strokeWidth="1.2" />
        </g>
      );

    case 'open-folder':
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}_fb`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE27A" />
              <stop offset="100%" stopColor="#C87E15" />
            </linearGradient>
            <linearGradient id={`${uid}_ff`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF0A8" />
              <stop offset="55%" stopColor="#F5BD38" />
              <stop offset="100%" stopColor="#CA8115" />
            </linearGradient>
          </defs>
          <path
            d="M 3 6.5 C 3 5.5 3.7 5 4.6 5 L 9.5 5 C 10.3 5 10.8 6.4 11.7 6.4 L 19.5 6.4 C 20.3 6.4 21 7 21 7.8 L 21 18.5 L 3 18.5 Z"
            fill={`url(#${uid}_fb)`}
            stroke="#8B5608"
            strokeWidth="1"
          />
          <rect x="6" y="7.5" width="12" height="5" fill="#FFFFFF" stroke="#9AA6B6" strokeWidth="0.7" />
          <path
            d="M 2 10.5 L 22 10.5 L 20.5 19.2 L 3.5 19.2 Z"
            fill={`url(#${uid}_ff)`}
            stroke="#8B5608"
            strokeWidth="1"
          />
          <line x1="3" y1="11.5" x2="21" y2="11.5" stroke="rgba(255,255,255,0.75)" strokeWidth="1" />
        </g>
      );

    case 'save-disk':
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}_dk`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5CA2F5" />
              <stop offset="50%" stopColor="#2A6CD2" />
              <stop offset="100%" stopColor="#16469A" />
            </linearGradient>
          </defs>
          <path
            d="M 3 3 L 18.5 3 L 21 5.5 L 21 20.5 L 3 20.5 Z"
            fill={`url(#${uid}_dk)`}
            stroke="#0F3478"
            strokeWidth="1.1"
          />
          <rect x="6.5" y="3.4" width="10" height="6.2" fill="#DCE2EA" stroke="#4D5A6E" strokeWidth="0.8" />
          <rect x="12.5" y="4.2" width="2.5" height="4.5" fill="#234886" />
          <rect x="5.5" y="12" width="13" height="8" rx="0.8" fill="#FAF8F0" stroke="#455B82" strokeWidth="0.8" />
          <line x1="7.5" y1="14.5" x2="16.5" y2="14.5" stroke="#5A83C6" strokeWidth="1.1" />
          <line x1="7.5" y1="17.2" x2="15" y2="17.2" stroke="#9BB5DD" strokeWidth="1.1" />
        </g>
      );

    case 'print':
      return (
        <g>
          <rect x="6.5" y="3" width="11" height="6" fill="#FFFFFF" stroke="#626973" strokeWidth="1" />
          <rect x="2.5" y="8" width="19" height="8.5" rx="1.5" fill="#E3E0D6" stroke="#595D64" strokeWidth="1.1" />
          <line x1="3.5" y1="9.2" x2="20.5" y2="9.2" stroke="#FFFFFF" strokeWidth="1" />
          <rect x="6" y="14.5" width="12" height="6.5" fill="#FFFFFF" stroke="#626973" strokeWidth="1" />
          <circle cx="18" cy="11.2" r="1.1" fill="#3CA438" />
          <line x1="8" y1="16.8" x2="16" y2="16.8" stroke="#9CA6B4" strokeWidth="1" />
          <line x1="8" y1="18.8" x2="14" y2="18.8" stroke="#9CA6B4" strokeWidth="1" />
        </g>
      );

    case 'cut':
      return (
        <g>
          <path d="M 6.5 14.5 L 17.5 3.8 L 19 5.3 L 8.2 15.8 Z" fill="#C4CBD4" stroke="#4D5460" strokeWidth="0.9" />
          <path d="M 17.5 14.5 L 6.5 3.8 L 5 5.3 L 15.8 15.8 Z" fill="#DFE4EA" stroke="#4D5460" strokeWidth="0.9" />
          <circle cx="6.5" cy="17.2" r="3.2" fill="none" stroke="#2D68C4" strokeWidth="2.1" />
          <circle cx="17.5" cy="17.2" r="3.2" fill="none" stroke="#2D68C4" strokeWidth="2.1" />
        </g>
      );

    case 'copy':
      return (
        <g>
          <rect x="4" y="3" width="10.5" height="13.5" fill="#F8F9FB" stroke="#606978" strokeWidth="1" />
          <line x1="6.2" y1="6.2" x2="12.2" y2="6.2" stroke="#9AA5B4" strokeWidth="1.1" />
          <line x1="6.2" y1="9" x2="12.2" y2="9" stroke="#9AA5B4" strokeWidth="1.1" />
          <rect x="9.5" y="7" width="10.5" height="14" fill="#FFFFFF" stroke="#3667AD" strokeWidth="1.1" />
          <line x1="11.7" y1="10.5" x2="17.8" y2="10.5" stroke="#5386CE" strokeWidth="1.1" />
          <line x1="11.7" y1="13.4" x2="17.8" y2="13.4" stroke="#99B5DD" strokeWidth="1.1" />
          <line x1="11.7" y1="16.3" x2="16.2" y2="16.3" stroke="#99B5DD" strokeWidth="1.1" />
        </g>
      );

    case 'paste':
      return (
        <g>
          <rect x="4" y="4.5" width="15" height="17" rx="1.5" fill="#C99A62" stroke="#7A5226" strokeWidth="1.1" />
          <rect x="8.2" y="2.5" width="6.6" height="3.2" rx="0.8" fill="#D4DBE3" stroke="#586170" strokeWidth="0.9" />
          <rect x="7" y="7.5" width="11" height="12.5" fill="#FFFFFF" stroke="#606978" strokeWidth="1" />
          <line x1="9" y1="11" x2="16" y2="11" stroke="#6D95D2" strokeWidth="1.1" />
          <line x1="9" y1="14" x2="16" y2="14" stroke="#9DB4D8" strokeWidth="1.1" />
          <line x1="9" y1="17" x2="14" y2="17" stroke="#9DB4D8" strokeWidth="1.1" />
        </g>
      );

    case 'loupe':
      return (
        <g>
          <defs>
            <radialGradient id={`${uid}_gl`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
              <stop offset="55%" stopColor="#A6DCFF" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#4F9BE8" stopOpacity="0.8" />
            </radialGradient>
          </defs>
          <line x1="13.5" y1="13.5" x2="20.5" y2="20.5" stroke="#525B68" strokeWidth="3.4" strokeLinecap="round" />
          <line x1="13.5" y1="13.5" x2="20.5" y2="20.5" stroke="#C8CFD8" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="9.6" cy="9.6" r="6.2" fill={`url(#${uid}_gl)`} stroke="#636D7A" strokeWidth="1.8" />
          <path d="M 5.6 7.4 C 6.8 5.2 9.4 4.7 11.4 5.7" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </g>
      );

    case 'shield-enamel':
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}_sb`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#65B0FF" />
              <stop offset="100%" stopColor="#1752B8" />
            </linearGradient>
            <linearGradient id={`${uid}_sg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFE47A" />
              <stop offset="100%" stopColor="#D48414" />
            </linearGradient>
          </defs>
          <path
            d="M 12 2.5 L 4 5.5 L 4 11.5 C 4 16.5 7.4 20.2 12 21.5 C 16.6 20.2 20 16.5 20 11.5 L 20 5.5 Z"
            fill={`url(#${uid}_sb)`}
            stroke="#133D88"
            strokeWidth="1.2"
          />
          <path d="M 12 3.8 L 12 20.2 C 15.8 19.0 18.6 15.8 18.6 11.5 L 18.6 6.4 Z" fill={`url(#${uid}_sg)`} />
          <path d="M 8 12.2 L 10.7 14.8 L 16.2 9.2" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      );

    case 'undo':
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}_ub`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#77BCFF" />
              <stop offset="100%" stopColor="#1D63D4" />
            </linearGradient>
          </defs>
          <path
            d="M 10.5 4.2 L 3.8 9.8 L 10.5 15.2 L 10.5 11.6 C 14.5 11.6 17.2 13.4 18.5 17.5 C 19.2 12.2 16.4 7.8 10.5 7.8 Z"
            fill={`url(#${uid}_ub)`}
            stroke="#12449C"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </g>
      );

    case 'redo':
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}_rb`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#77BCFF" />
              <stop offset="100%" stopColor="#1D63D4" />
            </linearGradient>
          </defs>
          <path
            d="M 13.5 4.2 L 20.2 9.8 L 13.5 15.2 L 13.5 11.6 C 9.5 11.6 6.8 13.4 5.5 17.5 C 4.8 12.2 7.6 7.8 13.5 7.8 Z"
            fill={`url(#${uid}_rb)`}
            stroke="#12449C"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </g>
      );

    case 'orb-back':
    case 'orb-forward':
    case 'orb-back-disabled':
    case 'orb-forward-disabled': {
      const isDisabled = disabled || name.endsWith('-disabled');
      const isBack = name.startsWith('orb-back');
      return (
        <g>
          <defs>
            <radialGradient id={`${uid}_orb`} cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor={isDisabled ? '#E2E4E8' : '#C9F5A8'} />
              <stop offset="55%" stopColor={isDisabled ? '#9DA3AE' : '#4DB53A'} />
              <stop offset="100%" stopColor={isDisabled ? '#6C727D' : '#1F6E1A'} />
            </radialGradient>
          </defs>
          <circle
            cx="12"
            cy="12"
            r="10.5"
            fill={`url(#${uid}_orb)`}
            stroke={isDisabled ? '#5E646E' : '#1A5C16'}
            strokeWidth="1.1"
          />
          <ellipse cx="12" cy="6.2" rx="6.6" ry="3.2" fill="rgba(255,255,255,0.45)" />
          <g
            transform={isBack ? undefined : 'translate(24,0) scale(-1,1)'}
          >
            <path
              d="M 11.6 6.8 L 6.2 12 L 11.6 17.2 L 11.6 14.0 L 17.6 14.0 L 17.6 10.0 L 11.6 10.0 Z"
              fill={isDisabled ? 'rgba(0,0,0,0.22)' : 'rgba(0,60,0,0.42)'}
              transform="translate(0,-0.8)"
            />
            <path
              d="M 11.6 6.8 L 6.2 12 L 11.6 17.2 L 11.6 14.0 L 17.6 14.0 L 17.6 10.0 L 11.6 10.0 Z"
              fill="#FFFFFF"
              opacity={isDisabled ? 0.72 : 1}
            />
          </g>
        </g>
      );
    }

    case 'all-programs':
    case 'go':
      return (
        <g>
          <defs>
            <radialGradient id={`${uid}_go`} cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#C9F5A8" />
              <stop offset="55%" stopColor="#4DB53A" />
              <stop offset="100%" stopColor="#1F6E1A" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill={`url(#${uid}_go)`} stroke="#1A5C16" strokeWidth="1.1" />
          <ellipse cx="12" cy="6.5" rx="6" ry="2.8" fill="rgba(255,255,255,0.45)" />
          {name === 'all-programs' ? (
            <path d="M 9.6 7.2 L 16.6 12 L 9.6 16.8 Z" fill="#FFFFFF" />
          ) : (
            <path d="M 12.2 7.2 L 17.4 12 L 12.2 16.8 L 12.2 13.8 L 6.8 13.8 L 6.8 10.2 L 12.2 10.2 Z" fill="#FFFFFF" />
          )}
        </g>
      );

    case 'key-jewel':
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}_kj`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE173" />
              <stop offset="50%" stopColor="#F09E1C" />
              <stop offset="100%" stopColor="#BA6408" />
            </linearGradient>
          </defs>
          <rect x="1.5" y="1.5" width="21" height="21" rx="4" fill={`url(#${uid}_kj)`} stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
          <circle cx="9.2" cy="10.2" r="3.4" fill="none" stroke="#FFFFFF" strokeWidth="2.1" />
          <path d="M 12.2 11.4 L 18.2 15.8 L 16.6 17.4 L 15.0 16.2 L 13.8 17.4 L 12.2 15.8 L 13.4 14.6 L 11.0 12.6 Z" fill="#FFFFFF" />
        </g>
      );

    case 'power-jewel':
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}_pj`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF967A" />
              <stop offset="50%" stopColor="#E24E2A" />
              <stop offset="100%" stopColor="#A6250D" />
            </linearGradient>
          </defs>
          <rect x="1.5" y="1.5" width="21" height="21" rx="4" fill={`url(#${uid}_pj)`} stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
          <rect x="11" y="5.5" width="2" height="6.2" rx="0.8" fill="#FFFFFF" />
          <path
            d="M 8.5 7.4 C 6.7 8.5 5.8 10.6 6.0 12.8 C 6.3 15.7 8.9 18.0 12 18.0 C 15.1 18.0 17.7 15.7 18.0 12.8 C 18.2 10.6 17.3 8.5 15.5 7.4"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </g>
      );

    case 'standby-jewel':
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}_sj`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE88A" />
              <stop offset="50%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#C46E09" />
            </linearGradient>
          </defs>
          <rect x="1.5" y="1.5" width="21" height="21" rx="4" fill={`url(#${uid}_sj)`} stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
          <path
            d="M 14.4 6.6 C 10.8 6.4 7.8 9.2 7.8 12.7 C 7.8 16.0 10.6 18.4 13.9 18.2 C 11.4 17.2 10.2 14.8 10.5 12.2 C 10.8 9.6 12.4 7.6 14.4 6.6 Z"
            fill="#FFFFFF"
          />
        </g>
      );

    default:
      return null;
  }
}

export const UIGlyph: React.FC<UIGlyphProps> = ({
  name,
  size = 16,
  tone = 'dark',
  disabled = false,
  className = '',
  style,
}) => {
  const uid = useSafeId(`glyph_${name}`);
  const isTier2 = TIER2_NAMES.has(name);

  if (isTier2) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        style={{
          display: 'inline-block',
          flexShrink: 0,
          verticalAlign: 'middle',
          opacity: disabled ? 0.52 : 1,
          ...style,
        }}
        aria-hidden="true"
      >
        {renderTier2(name, uid, disabled)}
      </svg>
    );
  }

  const fill =
    tone === 'light'
      ? '#FFFFFF'
      : tone === 'auto'
        ? 'currentColor'
        : '#3A3A3A';

  const shadowColor =
    tone === 'light'
      ? 'rgba(0, 0, 0, 0.35)'
      : tone === 'auto'
        ? 'rgba(255, 255, 255, 0.55)'
        : 'rgba(255, 255, 255, 0.75)';

  const shapes = renderTier1Path(name);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        verticalAlign: 'middle',
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
      aria-hidden="true"
    >
      {/* 1px Letterpress bevel highlight below */}
      <g transform="translate(0, 1)" fill={shadowColor}>
        {shapes}
      </g>
      <g fill={fill}>{shapes}</g>
    </svg>
  );
};
