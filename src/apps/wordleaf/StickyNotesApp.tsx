import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MenuGroup, OSAppProps } from '../../core/types';
import { useOS } from '../../core/osStore';
import { UIGlyph } from '../../art';
import './wordleaf.css';

export type StickyColor = 'buttercup' | 'mint' | 'cerulean' | 'blossom' | 'lavender';

interface StickyNote {
  id: string;
  title: string;
  body: string;
  color: StickyColor;
  pinned: boolean;
  updatedAt: number;
}

const STICKIES_STORAGE_KEY = 'halcyon_stickies_v1';

const COLOR_META: { id: StickyColor; label: string }[] = [
  { id: 'buttercup', label: 'Yellow' },
  { id: 'mint', label: 'Green' },
  { id: 'cerulean', label: 'Blue' },
  { id: 'blossom', label: 'Pink' },
  { id: 'lavender', label: 'Purple' },
];

function createStarterNotes(): StickyNote[] {
  const now = Date.now();
  return [
    {
      id: 'sticky-welcome',
      title: 'Quick Shortcuts',
      body: 'Cmd/Ctrl + K: Spotlight\nCmd/Ctrl + S: Save in WordLeaf\nClick Start in the shelf to browse apps and folders.',
      color: 'buttercup',
      pinned: true,
      updatedAt: now - 300_000,
    },
    {
      id: 'sticky-notes',
      title: 'Notes & Drafts',
      body: 'Notes save automatically in local storage. Click "To WordLeaf" below to turn any sticky into a document in My Documents.',
      color: 'mint',
      pinned: false,
      updatedAt: now - 180_000,
    },
    {
      id: 'sticky-ideas',
      title: 'Reading List',
      body: '- Look up Sonoma Valley on Wikipedia\n- Sketch a horizon in LunaPaint\n- Listen to Bliss Horizon in Prism',
      color: 'cerulean',
      pinned: false,
      updatedAt: now - 60_000,
    },
  ];
}

function loadStickies(): StickyNote[] {
  if (typeof window === 'undefined') return createStarterNotes();
  try {
    const raw = window.localStorage.getItem(STICKIES_STORAGE_KEY);
    if (!raw) {
      const seed = createStarterNotes();
      window.localStorage.setItem(STICKIES_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as StickyNote[];
    if (!Array.isArray(parsed)) return createStarterNotes();
    return parsed;
  } catch {
    return createStarterNotes();
  }
}

function formatTimeAgo(ts: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return `${Math.floor(diffSec / 3600)}h ago`;
}

export const StickyNotesApp: React.FC<OSAppProps> = ({
  isFocused,
  setWindowTitle,
  setAppMenus,
}) => {
  const { vfs, openApp, playSound, notify } = useOS();

  const [notes, setNotes] = useState<StickyNote[]>(() => loadStickies());
  const [search, setSearch] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<StickyColor | 'all'>('all');
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    noteId: string;
    x: number;
    y: number;
  } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const setAppMenusRef = useRef(setAppMenus);
  setAppMenusRef.current = setAppMenus;

  useEffect(() => {
    try {
      window.localStorage.setItem(STICKIES_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Ignore storage quota errors
    }
  }, [notes]);

  useEffect(() => {
    setWindowTitle(`Stickies (${notes.length})`);
  }, [notes.length, setWindowTitle]);

  // Close filter popup & context menu on outside pointerdown or Escape
  useEffect(() => {
    if (!filterOpen && !contextMenu) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (filterOpen && !target?.closest('.sn-filter-anchor')) {
        setFilterOpen(false);
      }
      if (contextMenu && !target?.closest('.sn-context-menu')) {
        setContextMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFilterOpen(false);
        setContextMenu(null);
      }
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [contextMenu, filterOpen]);

  const handleAddNote = useCallback(
    (color: StickyColor = 'buttercup') => {
      playSound('click');
      const newNote: StickyNote = {
        id: `sticky-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: 'New Note',
        body: '',
        color,
        pinned: false,
        updatedAt: Date.now(),
      };
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
    },
    [playSound]
  );

  const handleUpdateNote = useCallback((id: string, patch: Partial<StickyNote>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
    );
  }, []);

  const handleDeleteNote = useCallback(
    (id: string) => {
      playSound('trash');
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setContextMenu(null);
    },
    [playSound]
  );

  const handleResetStarterNotes = useCallback(() => {
    playSound('click');
    setNotes(createStarterNotes());
    setColorFilter('all');
    setSearch('');
  }, [playSound]);

  const handleSendToWordLeaf = useCallback(
    (note: StickyNote) => {
      const cleanTitle = (note.title.trim() || 'Sticky Note').replace(/[\\/:*?"<>|]/g, '-');
      const existingNames = new Set(
        vfs.getChildren('documents').map((n) => n.name.toLowerCase())
      );
      let baseName = cleanTitle;
      if (existingNames.has(`${baseName}.md`.toLowerCase())) {
        let count = 2;
        while (existingNames.has(`${baseName} ${count}.md`.toLowerCase())) {
          count += 1;
        }
        baseName = `${baseName} ${count}`;
      }

      const content = `# ${note.title.trim() || 'Sticky Note'}\n\n${note.body.trim()}\n`;
      const created = vfs.createFile('documents', baseName, 'md', content);
      playSound('open');
      notify({
        title: 'Saved to My Documents',
        message: `Created "${created.name}" in My Documents.`,
        icon: 'wordleaf',
      });
      openApp('wordleaf', { fileId: created.id });
    },
    [notify, openApp, playSound, vfs]
  );

  const visibleNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes
      .filter((n) => {
        if (colorFilter !== 'all' && n.color !== colorFilter) return false;
        if (q && !n.title.toLowerCase().includes(q) && !n.body.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [colorFilter, notes, search]);

  const setTargetNoteColor = useCallback(
    (color: StickyColor) => {
      const targetId = activeNoteId ?? visibleNotes[0]?.id;
      if (!targetId) return;
      playSound('click');
      handleUpdateNote(targetId, { color });
    },
    [activeNoteId, handleUpdateNote, playSound, visibleNotes]
  );

  const menuActionsRef = useRef({
    handleAddNote,
    setTargetNoteColor,
    clearFilters: () => {
      setColorFilter('all');
      setSearch('');
    },
    handleResetStarterNotes,
  });
  menuActionsRef.current = {
    handleAddNote,
    setTargetNoteColor,
    clearFilters: () => {
      setColorFilter('all');
      setSearch('');
    },
    handleResetStarterNotes,
  };

  useEffect(() => {
    const menus: MenuGroup[] = [
      {
        label: 'Note',
        items: [
          {
            label: 'New Note',
            shortcut: '⌘N',
            dividerAfter: true,
            action: () => menuActionsRef.current.handleAddNote('buttercup'),
          },
          ...COLOR_META.map((c, idx) => ({
            label: `Colour: ${c.label}`,
            dividerAfter: idx === COLOR_META.length - 1,
            action: () => menuActionsRef.current.setTargetNoteColor(c.id),
          })),
          {
            label: 'Show All Notes',
            action: () => menuActionsRef.current.clearFilters(),
          },
          {
            label: 'Restore Starter Notes',
            action: () => menuActionsRef.current.handleResetStarterNotes(),
          },
        ],
      },
    ];
    setAppMenusRef.current(menus);
  }, [isFocused]);

  const activeFilterLabel =
    colorFilter === 'all'
      ? 'All Notes'
      : COLOR_META.find((c) => c.id === colorFilter)?.label ?? 'All Notes';

  const contextNote = contextMenu
    ? notes.find((n) => n.id === contextMenu.noteId) ?? null
    : null;

  return (
    <div ref={rootRef} className="sn-root" style={{ position: 'relative' }}>
      {/* 34px Toolbar */}
      <div className="hc-toolbar sn-toolbar">
        <div className="sn-toolbar-group">
          <button
            type="button"
            className="hc-btn"
            onClick={() => handleAddNote('buttercup')}
          >
            <UIGlyph name="plus" size={12} />
            <span>New Note</span>
          </button>

          <span className="hc-toolbar-sep" />

          <div className="wl-popover-anchor sn-filter-anchor">
            <button
              type="button"
              className="hc-popup wl-popup-btn"
              style={{ width: 108 }}
              onClick={() => setFilterOpen((o) => !o)}
              aria-label="Filter Notes"
            >
              <span className="wl-popup-label">{activeFilterLabel}</span>
              <UIGlyph name="chevron-double" size={12} />
            </button>
            {filterOpen && (
              <div className="hc-menu wl-popup-menu" style={{ minWidth: 120 }}>
                <button
                  type="button"
                  className={`wl-menu-item ${colorFilter === 'all' ? 'is-selected' : ''}`}
                  onClick={() => {
                    setColorFilter('all');
                    setFilterOpen(false);
                  }}
                >
                  <span>All Notes</span>
                  {colorFilter === 'all' && <UIGlyph name="check" size={12} />}
                </button>
                {COLOR_META.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`wl-menu-item ${colorFilter === c.id ? 'is-selected' : ''}`}
                    onClick={() => {
                      setColorFilter(c.id);
                      setFilterOpen(false);
                    }}
                  >
                    <span>{c.label}</span>
                    {colorFilter === c.id && <UIGlyph name="check" size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ position: 'relative', width: 180 }}>
          <span
            style={{
              position: 'absolute',
              left: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'inline-flex',
              pointerEvents: 'none',
            }}
          >
            <UIGlyph name="search" size={13} />
          </span>
          <input
            type="text"
            className="hc-search"
            style={{ width: '100%' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            aria-label="Search notes"
          />
        </div>
      </div>

      {/* 220x220 Square Paper Notes Board */}
      <div className="sn-board">
        {visibleNotes.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--text-2)', fontSize: 12 }}>
            No notes match the current filter.
          </div>
        ) : (
          visibleNotes.map((note) => (
            <div
              key={note.id}
              className={`sn-note sn-note--${note.color}`}
              onMouseDown={() => setActiveNoteId(note.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setActiveNoteId(note.id);
                const rect = rootRef.current?.getBoundingClientRect();
                const x = rect ? Math.min(rect.width - 150, Math.max(8, e.clientX - rect.left)) : 16;
                const y = rect ? Math.min(rect.height - 180, Math.max(40, e.clientY - rect.top)) : 48;
                setContextMenu({ noteId: note.id, x, y });
              }}
            >
              <div className="sn-note-strip">
                <button
                  type="button"
                  className="sn-strip-btn"
                  onClick={() => handleDeleteNote(note.id)}
                  title="Delete Note"
                  aria-label="Delete Note"
                >
                  <UIGlyph name="close" size={10} />
                </button>

                <button
                  type="button"
                  className={`sn-strip-btn ${note.pinned ? 'is-pinned' : ''}`}
                  onClick={() => {
                    playSound('click');
                    handleUpdateNote(note.id, { pinned: !note.pinned });
                  }}
                  title={note.pinned ? 'Unpin' : 'Pin'}
                  aria-label={note.pinned ? 'Unpin' : 'Pin'}
                >
                  <UIGlyph name="star" size={11} />
                </button>
              </div>

              <input
                type="text"
                className="sn-note-title"
                value={note.title}
                onFocus={() => setActiveNoteId(note.id)}
                onChange={(e) => handleUpdateNote(note.id, { title: e.target.value })}
                placeholder="Title"
                aria-label="Note Title"
              />

              <textarea
                className="sn-note-body"
                value={note.body}
                onFocus={() => setActiveNoteId(note.id)}
                onChange={(e) => handleUpdateNote(note.id, { body: e.target.value })}
                placeholder="Write a note..."
                aria-label="Note Body"
              />

              <div className="sn-note-foot">
                <span>{formatTimeAgo(note.updatedAt)}</span>
                <button
                  type="button"
                  className="sn-send-link"
                  onClick={() => handleSendToWordLeaf(note)}
                  title="Create a document in My Documents and open in WordLeaf"
                >
                  To WordLeaf
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right-click Note Colour & Actions Menu */}
      {contextMenu && contextNote && (
        <div
          className="hc-menu sn-context-menu"
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            minWidth: 144,
            zIndex: 70,
          }}
        >
          {COLOR_META.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`wl-menu-item ${contextNote.color === c.id ? 'is-selected' : ''}`}
              onClick={() => {
                playSound('click');
                handleUpdateNote(contextNote.id, { color: c.id });
                setContextMenu(null);
              }}
            >
              <span>{c.label}</span>
              {contextNote.color === c.id && <UIGlyph name="check" size={12} />}
            </button>
          ))}
          <div className="hc-menu-sep" />
          <button
            type="button"
            className="wl-menu-item"
            onClick={() => {
              playSound('click');
              handleUpdateNote(contextNote.id, { pinned: !contextNote.pinned });
              setContextMenu(null);
            }}
          >
            <span>{contextNote.pinned ? 'Unpin Note' : 'Pin Note'}</span>
          </button>
          <button
            type="button"
            className="wl-menu-item"
            onClick={() => {
              handleSendToWordLeaf(contextNote);
              setContextMenu(null);
            }}
          >
            <span>Send to WordLeaf</span>
          </button>
          <button
            type="button"
            className="wl-menu-item"
            onClick={() => handleDeleteNote(contextNote.id)}
          >
            <span>Delete Note</span>
          </button>
        </div>
      )}
    </div>
  );
};
