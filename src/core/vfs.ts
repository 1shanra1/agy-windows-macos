import { VFSNode } from './types';

export const VFS_STORAGE_KEY = 'halcyon_os_vfs_v1';

export const ROOT_FOLDER_IDS = ['desktop', 'documents', 'pictures', 'music', 'system', 'trash'] as const;
export type RootFolderId = (typeof ROOT_FOLDER_IDS)[number];

const SONOMA_MEADOW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1C5FD0"/>
      <stop offset="55%" stop-color="#3F86E3"/>
      <stop offset="100%" stop-color="#CFE3F5"/>
    </linearGradient>
    <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6DC84B"/>
      <stop offset="100%" stop-color="#3C9129"/>
    </linearGradient>
    <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#9BD65A"/>
      <stop offset="100%" stop-color="#2E7D24"/>
    </linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#sky)"/>
  <path d="M0,255 Q175,180 350,235 T640,215 L640,400 L0,400 Z" fill="url(#hillFar)"/>
  <path d="M0,290 Q190,225 410,275 T640,260 L640,400 L0,400 Z" fill="url(#hillNear)"/>
</svg>`;

export function createSeedVFS(): VFSNode[] {
  const now = Date.now();
  const earlier = now - 1000 * 60 * 60 * 18;

  const nodes: VFSNode[] = [
    {
      id: 'desktop',
      name: 'Desktop',
      type: 'folder',
      parentId: null,
      createdAt: earlier,
      updatedAt: earlier,
      size: 0,
    },
    {
      id: 'documents',
      name: 'My Documents',
      type: 'folder',
      parentId: null,
      createdAt: earlier,
      updatedAt: earlier,
      size: 0,
    },
    {
      id: 'pictures',
      name: 'My Pictures',
      type: 'folder',
      parentId: null,
      createdAt: earlier,
      updatedAt: earlier,
      size: 0,
    },
    {
      id: 'music',
      name: 'My Music',
      type: 'folder',
      parentId: null,
      createdAt: earlier,
      updatedAt: earlier,
      size: 0,
    },
    {
      id: 'system',
      name: 'System',
      type: 'folder',
      parentId: null,
      createdAt: earlier,
      updatedAt: earlier,
      size: 0,
    },
    {
      id: 'trash',
      name: 'Recycle Bin',
      type: 'folder',
      parentId: null,
      createdAt: earlier,
      updatedAt: earlier,
      size: 0,
    },
    {
      id: 'file-welcome-md',
      name: 'Welcome to Halcyon.md',
      type: 'file',
      parentId: 'documents',
      ext: 'md',
      content: `# Welcome to Halcyon

Halcyon brings together the calm precision of Mac OS X Aqua and the warm optimism of Windows XP Luna.

## What You Can Do
- **Write & Save**: Edit this page or compose new notes in **WordLeaf**, then save to *My Documents* or *Desktop*.
- **Browse Wikipedia**: Open **Safari Explorer** to read articles, follow links, and save summaries directly into your folders.
- **Customize Your Desktop**: Open **Control Panel** to switch wallpapers, sound preferences, and your account portrait.
- **Paint & Listen**: Sketch in **LunaPaint** and save to *My Pictures*, or play synthesized ambient tracks in **Prism**.`,
      createdAt: earlier,
      updatedAt: now - 3600_000,
      size: 625,
    },
    {
      id: 'file-manifesto-md',
      name: 'Design Notes.md',
      type: 'file',
      parentId: 'documents',
      ext: 'md',
      content: `# Aqua-Luna Architecture Notes

1. **Solid things are solid**: Windows, toolbars, documents, and status bars are opaque and tactile.
2. **One accent per surface**: Clean hierarchy with one default blue control and restrained chrome.
3. **Typography**: Lucida Grande for interface chrome, Trebuchet MS for Luna titles, and Georgia for reading.`,
      createdAt: earlier,
      updatedAt: now - 7200_000,
      size: 332,
    },
    {
      id: 'file-field-notes-txt',
      name: 'Field Notes.txt',
      type: 'file',
      parentId: 'documents',
      ext: 'txt',
      content: `Observation Log — Sonoma / Petaluma Valley
-----------------------------------------
Sky clarity: clear cerulean azure
Wind: light breeze across the meadow

Tip: Click the search glyph in the menu bar to open Spotlight,
or open Start to jump directly to My Documents and Control Panel.`,
      createdAt: earlier,
      updatedAt: now - 5400_000,
      size: 274,
    },
    {
      id: 'file-wiki-bliss-url',
      name: 'Wikipedia - Bliss Photograph.url',
      type: 'file',
      parentId: 'desktop',
      ext: 'url',
      content: 'https://en.wikipedia.org/wiki/Bliss_(photograph)',
      createdAt: earlier,
      updatedAt: earlier,
      size: 48,
    },
    {
      id: 'file-meadow-svg',
      name: 'Sonoma Meadow Sketch.svg',
      type: 'file',
      parentId: 'pictures',
      ext: 'svg',
      content: SONOMA_MEADOW_SVG,
      createdAt: earlier,
      updatedAt: earlier,
      size: SONOMA_MEADOW_SVG.length,
    },
    {
      id: 'file-synth-patch-sys',
      name: 'Bliss Horizon.sys',
      type: 'file',
      parentId: 'music',
      ext: 'sys',
      content: 'HALCYON_SYNTH_PATCH=F#maj9;TEMPO=72BPM;VOICES=6',
      createdAt: earlier,
      updatedAt: earlier,
      size: 48,
    },
    {
      id: 'file-safenet-policy-txt',
      name: 'Halcyon Library Policy.txt',
      type: 'file',
      parentId: 'system',
      ext: 'txt',
      content: `HALCYON LIBRARY POLICY
======================
Allowed Destinations:
- halcyon://* (Local Portal & Museum)
- *.wikipedia.org (Encyclopedia Reader)
- *.wiktionary.org (Dictionary Lookup)`,
      createdAt: earlier,
      updatedAt: earlier,
      size: 184,
    },
    {
      id: 'file-kernel-sys',
      name: 'Halcyon System 2.0.sys',
      type: 'file',
      parentId: 'system',
      ext: 'sys',
      content: 'HALCYON_SYSTEM=2.0;ARCH=AQUA_LUNA',
      createdAt: earlier,
      updatedAt: earlier,
      size: 33,
    },
    {
      id: 'file-rejected-txt',
      name: 'Old Draft.txt',
      type: 'file',
      parentId: 'trash',
      trashedFrom: 'documents',
      ext: 'txt',
      content: `Early layout scratchpad moved to Recycle Bin.`,
      createdAt: earlier,
      updatedAt: earlier,
      size: 44,
    },
  ];

  return nodes;
}

export function loadVFSNodes(): VFSNode[] {
  if (typeof window === 'undefined') return createSeedVFS();
  try {
    const raw = window.localStorage.getItem(VFS_STORAGE_KEY);
    if (!raw) {
      const seed = createSeedVFS();
      saveVFSNodes(seed);
      return seed;
    }
    const parsed = JSON.parse(raw) as VFSNode[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seed = createSeedVFS();
      saveVFSNodes(seed);
      return seed;
    }
    const existingIds = new Set(parsed.map((n) => n.id));
    const seed = createSeedVFS();
    let changed = false;
    for (const rootId of ROOT_FOLDER_IDS) {
      if (!existingIds.has(rootId)) {
        const seedRoot = seed.find((n) => n.id === rootId);
        if (seedRoot) {
          parsed.push(seedRoot);
          changed = true;
        }
      }
    }
    if (changed) saveVFSNodes(parsed);
    return parsed;
  } catch {
    return createSeedVFS();
  }
}

export function saveVFSNodes(nodes: VFSNode[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(VFS_STORAGE_KEY, JSON.stringify(nodes));
  } catch {
    // Ignore storage quota errors cleanly
  }
}
